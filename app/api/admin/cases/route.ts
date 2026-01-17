import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { enforcePermission } from '@/lib/abac/evaluator';
import { ACTIONS } from '@/lib/abac/types';
import { IdentityVaultService } from '@/lib/vault/identity-service';

// GET /api/admin/cases - Listar casos con filtros
export async function GET(request: Request) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. ABAC: Verificar permiso
        await enforcePermission(user.id, 'case.view', 'cases');

        // 2. Parsear query params
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';
        const priority = searchParams.get('priority') || '';
        const classification = searchParams.get('classification') || '';

        // 3. Query con filtros (RLS aplicará clearance automáticamente)
        let query = supabaseAdmin
            .from('cases')
            .select('*')
            .order('created_at', { ascending: false });

        // Aplicar filtros
        if (search) {
            query = query.or(`case_number.ilike.%${search}%,title.ilike.%${search}%`);
        }
        if (status) {
            query = query.eq('status', status);
        }
        if (priority) {
            query = query.eq('priority', priority);
        }
        if (classification) {
            query = query.eq('classification', classification);
        }

        const { data: cases, error } = await query;

        if (error) {
            console.error('[GET /api/admin/cases] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 4. Enriquecer con pseudónimo del juez asignado (mantener anonimato)
        const enrichedCases = await Promise.all(cases.map(async (caseItem) => {
            // Buscar asignación en case_assignments
            const { data: assignment } = await supabaseAdmin
                .from('case_assignments')
                .select('anon_actor_id')
                .eq('case_id', caseItem.id)
                .maybeSingle();

            return {
                id: caseItem.id,
                caseNumber: caseItem.case_number,
                title: caseItem.title,
                description: caseItem.description,
                status: caseItem.status,
                priority: caseItem.priority,
                classification: caseItem.classification,
                createdAt: caseItem.created_at,
                updatedAt: caseItem.updated_at,
                deadline: caseItem.deadline,
                createdBy: caseItem.created_by,
                caseType: caseItem.case_type,
                assignedJudgeId: assignment?.anon_actor_id || null,
                assignedJudge: assignment?.anon_actor_id ? {
                    id: assignment.anon_actor_id,
                    fullName: `Juez-${assignment.anon_actor_id.substring(0, 8)}`, // Pseudónimo corto
                    email: null,
                    role: 'judge'
                } : null
            };
        }));

        return NextResponse.json({ cases: enrichedCases });

    } catch (error: any) {
        if (error.message?.includes('Permiso denegado')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        console.error('[GET /api/admin/cases] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/cases - Crear nuevo caso
export async function POST(request: Request) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. ABAC: Verificar permiso para crear casos
        await enforcePermission(user.id, 'case.create', 'cases');

        // 2. Validar y parsear cuerpo
        const body = await request.json();
        const { caseNumber, title, description, caseType, priority, classification, deadline } = body;

        if (!caseNumber || !title || !description || !caseType || !priority || !classification) {
            return NextResponse.json({
                error: 'Campos obligatorios: caseNumber, title, description, caseType, priority, classification'
            }, { status: 400 });
        }

        // Validar valores enum
        const validPriorities = ['low', 'medium', 'high', 'urgent'];
        const validClassifications = ['public', 'confidential', 'secret', 'top_secret'];
        const validCaseTypes = ['civil', 'penal', 'laboral', 'administrativo'];

        if (!validPriorities.includes(priority)) {
            return NextResponse.json({ error: 'Prioridad inválida' }, { status: 400 });
        }
        if (!validClassifications.includes(classification)) {
            return NextResponse.json({ error: 'Clasificación inválida' }, { status: 400 });
        }
        if (!validCaseTypes.includes(caseType)) {
            return NextResponse.json({ error: 'Tipo de caso inválido' }, { status: 400 });
        }

        // 3. Crear caso en BD
        const { data: newCase, error: insertError } = await supabaseAdmin
            .from('cases')
            .insert({
                case_number: caseNumber,
                title,
                description,
                case_type: caseType.toString().toLowerCase().trim(),
                priority,
                classification,
                status: 'pending',
                deadline: deadline || null,
                created_by: user.id
            })
            .select()
            .single();

        if (insertError) {
            console.error('[POST /api/admin/cases] Insert error:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            case: {
                ...newCase,
                assignedJudgeId: null,
                assignedJudge: null
            }
        }, { status: 201 });

    } catch (error: any) {
        if (error.message?.includes('Permiso denegado')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        console.error('[POST /api/admin/cases] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
