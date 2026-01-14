import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { enforcePermission } from '@/lib/abac/evaluator';
import { IdentityVaultService } from '@/lib/vault/identity-service';
import { EphemeralCredentialsService } from '@/lib/services/ephemeral-credentials';
import { EmailService } from '@/lib/services/email-service';

/**
 * Algoritmo de asignación aleatoria de casos a jueces
 * Selecciona un juez elegible basado en clearance y disponibilidad
 */
async function selectRandomJudge(
    caseClassification: string,
    caseId: string
): Promise<string | null> {

    // 1. Obtener todos los jueces activos
    const { data: judges, error } = await supabaseAdmin
        .from('users_profile')
        .select('id, email')
        .eq('role', 'judge')
        .eq('status', 'active');

    if (error || !judges || judges.length === 0) {
        console.error('[RandomAssign] No judges available:', error);
        return null;
    }

    // 2. TODO: Filtrar por clearance level (verificar atributos ABAC)
    // Por ahora, usar todos los jueces activos
    const eligibleJudges = judges;

    if (eligibleJudges.length === 0) {
        return null;
    }

    // 3. Selección aleatoria simple
    const randomIndex = Math.floor(Math.random() * eligibleJudges.length);
    const selectedJudge = eligibleJudges[randomIndex];

    console.log(`[RandomAssign] Selected judge: ${selectedJudge.id} from ${eligibleJudges.length} eligible judges`);

    return selectedJudge.id;
}

// POST /api/admin/cases/[id]/assign - Asignar caso a juez con pseudonimización
export async function POST(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const caseId = params.id;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. ABAC: Verificar permiso
        await enforcePermission(user.id, 'case.assign.judge', 'cases', { resourceId: caseId });

        // 2. Parsear cuerpo
        const body = await request.json();
        const { judgeId: providedJudgeId, random, notes } = body;

        // 3. Verificar que el caso existe y obtener info
        const { data: caseData } = await supabaseAdmin
            .from('cases')
            .select('id, case_number, classification')
            .eq('id', caseId)
            .single();

        if (!caseData) {
            return NextResponse.json({ error: 'Caso no encontrado' }, { status: 404 });
        }

        // 4. Seleccionar juez (manual o aleatorio)
        let judgeId: string;

        if (random) {
            const randomJudgeId = await selectRandomJudge(caseData.classification, caseId);
            if (!randomJudgeId) {
                return NextResponse.json({
                    error: 'No hay jueces elegibles disponibles'
                }, { status: 400 });
            }
            judgeId = randomJudgeId;
            console.log(`[Assign] Random selection: ${judgeId}`);
        } else {
            if (!providedJudgeId) {
                return NextResponse.json({ error: 'judgeId o random=true es requerido' }, { status: 400 });
            }
            judgeId = providedJudgeId;
        }

        // 5. Verificar que el juez existe
        const { data: judge } = await supabaseAdmin
            .from('users_profile')
            .select('id, email, real_name, role')
            .eq('id', judgeId)
            .single();

        if (!judge || judge.role !== 'judge') {
            return NextResponse.json({ error: 'El usuario no es un juez válido' }, { status: 400 });
        }

        // 6. Pseudonimizar: Crear/obtener anon_actor_id vía Identity Vault
        const { anonActorId } = await IdentityVaultService.createMapping({
            userId: judgeId,
            caseId: caseId,
            createdBy: user.id
        });

        // 7. Verificar si el caso ya está asignado (no permitir reasignación)
        console.log('[Assign] Checking existing assignment for case:', caseId);
        const { data: existingAssignment, error: fetchError } = await supabaseAdmin
            .from('case_assignments')
            .select('id, anon_actor_id')
            .eq('case_id', caseId)
            .maybeSingle();

        if (fetchError) {
            console.error('[Assign] Error fetching existing assignment:', fetchError);
        }

        console.log('[Assign] Existing assignment:', existingAssignment);

        if (existingAssignment) {
            console.warn('[Assign] Case already assigned, rejecting reassignment attempt');
            return NextResponse.json({
                error: 'Este caso ya está asignado a un juez. No se permite reasignar casos.'
            }, { status: 400 });
        }

        // 8. Crear nueva asignación
        console.log('[Assign] Creating new assignment:', {
            case_id: caseId,
            anon_actor_id: anonActorId,
            role: 'judge',
            assigned_by: user.id
        });
        const { error: insertError } = await supabaseAdmin
            .from('case_assignments')
            .insert({
                case_id: caseId,
                anon_actor_id: anonActorId,
                role: 'judge',
                assigned_by: user.id
            });

        if (insertError) {
            console.error('[Assign] Error inserting assignment:', insertError);
            throw new Error(`Failed to create assignment: ${insertError.message}`);
        }
        console.log('[Assign] Assignment created successfully');

        // 9. Actualizar estado del caso
        await supabaseAdmin
            .from('cases')
            .update({
                status: 'in_review',
                updated_at: new Date().toISOString()
            })
            .eq('id', caseId);

        // 9. Generar credenciales efímeras
        const credentials = await EphemeralCredentialsService.generate(caseId, anonActorId);

        // 10. Enviar email al juez con las credenciales
        try {
            await EmailService.sendCredentialsEmail({
                to: judge.email,
                caseNumber: caseData.case_number,
                tempEmail: credentials.email,
                tempPassword: credentials.password,
                accessToken: credentials.token,
                expiresAt: credentials.expiresAt
            });
            console.log(`[Assign] Email sent to: ${judge.email}`);
        } catch (emailError) {
            console.error('[Assign] Email failed:', emailError);
            // No fallar la asignación si email falla
        }

        return NextResponse.json({
            success: true,
            message: 'Caso asignado exitosamente',
            judgeId,
            judgeName: judge.real_name,
            anonActorId,
            credentials: {
                email: credentials.email,
                password: credentials.password,
                token: credentials.token,
                expiresAt: credentials.expiresAt
            }
        });

    } catch (error: any) {
        if (error.message?.includes('Permiso denegado')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        console.error('[POST /api/admin/cases/[id]/assign] Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

// DELETE /api/admin/cases/[id]/assign - Desasignar caso
export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const caseId = params.id;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. ABAC: Verificar permiso
        await enforcePermission(user.id, 'case.assign.judge', 'cases', { resourceId: caseId });

        // 2. Eliminar asignación
        const { error: deleteError } = await supabaseAdmin
            .from('case_assignments')
            .delete()
            .eq('case_id', caseId);

        if (deleteError) {
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        // 3. Actualizar estado del caso a pending
        await supabaseAdmin
            .from('cases')
            .update({
                status: 'pending',
                updated_at: new Date().toISOString()
            })
            .eq('id', caseId);

        return NextResponse.json({ success: true, message: 'Caso desasignado' });

    } catch (error: any) {
        if (error.message?.includes('Permiso denegado')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        console.error('[DELETE /api/admin/cases/[id]/assign] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
