import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { IdentityVaultService } from '@/lib/vault/identity-service';
import { enforcePermission } from '@/lib/abac/evaluator';
import { ACTIONS } from '@/lib/abac/types';

/**
 * GET /api/judge/cases
 * 
 * Obtener todos los casos asignados al juez autenticado
 * Usa el Identity Vault para resolver pseudónimos
 * Con verificación ABAC
 */
export async function GET() {
    try {
        const supabase = await createClient();

        // 1. Verificar usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized - Please login' },
                { status: 401 }
            );
        }

        // 2. Verificar permiso ABAC para ver casos
        try {
            await enforcePermission(user.id, ACTIONS.CASE_VIEW, 'case');
        } catch (abacError: any) {
            return NextResponse.json(
                { error: abacError.message },
                { status: 403 }
            );
        }

        // 2. Verificar que el usuario existe y está activo
        const { data: profile } = await supabase
            .from('users_profile')
            .select('role, status')
            .eq('id', user.id)
            .single();

        if (!profile) {
            return NextResponse.json(
                { error: 'User profile not found' },
                { status: 404 }
            );
        }

        if (profile.status !== 'active') {
            return NextResponse.json(
                { error: 'Account is not active' },
                { status: 403 }
            );
        }

        // 3. Consultar Identity Vault para obtener pseudónimos del usuario
        console.log('[JudgeCases] Fetching pseudonyms for user:', user.id);
        const pseudonyms = await IdentityVaultService.getUserPseudonyms(user.id);

        if (pseudonyms.length === 0) {
            console.log('[JudgeCases] No assignments found for user');
            return NextResponse.json({ cases: [] });
        }

        console.log(`[JudgeCases] Found ${pseudonyms.length} pseudonyms`);

        const anonActorIds = pseudonyms.map(p => p.anonActorId);

        // 4. Obtener casos desde BD principal usando pseudónimos
        const { data: assignments, error } = await supabase
            .from('case_assignments')
            .select(`
        id,
        role,
        status,
        assigned_at,
        cases (
          id,
          case_number,
          title,
          description,
          case_type,
          priority,
          status,
          created_at
        )
      `)
            .in('anon_actor_id', anonActorIds)
            .eq('status', 'active')
            .order('assigned_at', { ascending: false });

        if (error) {
            console.error('[JudgeCases] Error fetching cases:', error);
            return NextResponse.json(
                { error: 'Failed to fetch cases' },
                { status: 500 }
            );
        }

        // 5. Formatear respuesta
        const formattedCases = (assignments || []).map(assignment => ({
            assignmentId: assignment.id,
            role: assignment.role,
            assignedAt: assignment.assigned_at,
            case: assignment.cases
        }));

        console.log(`[JudgeCases] Returning ${formattedCases.length} cases`);

        return NextResponse.json({
            cases: formattedCases,
            total: formattedCases.length
        });

    } catch (error: any) {
        console.error('[JudgeCases] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
