import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ABACEvaluator, enforcePermission } from '@/lib/abac/evaluator';
import { ACTIONS } from '@/lib/abac/types';

/**
 * EJEMPLO: Crear un nuevo caso con verificación ABAC
 */
export async function POST(request: Request) {
    const supabase = await createClient();

    // 1. Autenticación básica
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. Verificar permiso ABAC
        await enforcePermission(
            user.id,
            ACTIONS.CASE_CREATE,
            'case'
        );

        // 3. Si pasó la verificación, proceder con la lógica
        const body = await request.json();
        const { title, description, classification } = body;

        // Validación adicional: verificar clearance si es caso clasificado
        if (classification && classification !== 'public') {
            const evaluator = new ABACEvaluator();
            const hasProperClearance = await evaluator.hasClearance(
                user.id,
                classification === 'top_secret' ? 4 :
                    classification === 'secret' ? 3 :
                        classification === 'confidential' ? 2 : 1
            );

            if (!hasProperClearance) {
                return NextResponse.json(
                    { error: 'Clearance insuficiente para crear caso clasificado' },
                    { status: 403 }
                );
            }
        }

        // 4. Crear el caso
        const { data: newCase, error } = await supabase
            .from('cases')
            .insert({
                title,
                description,
                classification: classification || 'public',
                status: 'pendiente',
                created_by: user.id
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ case: newCase }, { status: 201 });

    } catch (error: any) {
        // El enforcePermission lanza error si no tiene permiso
        if (error.message.includes('Permiso denegado') || error.message.includes('bloqueada')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        console.error('[API] Error creating case:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * EJEMPLO: Listar casos con filtro ABAC automático
 */
export async function GET(request: Request) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Verificar permiso para ver lista
        await enforcePermission(
            user.id,
            ACTIONS.CASE_VIEW,
            'case'
        );

        const evaluator = new ABACEvaluator();

        // Verificar si tiene restricción "solo casos asignados"
        const isRestricted = await evaluator.hasAttribute(
            user.id,
            'case.assigned_only'
        );

        let query = supabase
            .from('cases')
            .select('*');

        // Si está restringido, solo mostrar casos asignados
        if (isRestricted) {
            // Aquí iría la lógica para filtrar por anon_actor_id
            // Por ahora, simplificado
            const { data: profile } = await supabase
                .from('users_profile')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role !== 'super_admin') {
                // Filtrar solo casos asignados
                // En producción, hacer JOIN con case_assignments
                query = query.eq('created_by', user.id);  // Simplificado
            }
        }

        const { data: cases, error } = await query;

        if (error) throw error;

        return NextResponse.json({ cases });

    } catch (error: any) {
        if (error.message.includes('Permiso denegado')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        console.error('[API] Error fetching cases:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
