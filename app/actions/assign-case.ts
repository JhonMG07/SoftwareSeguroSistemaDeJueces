'use server';

import { createClient } from '@/lib/supabase/server';
import { IdentityVaultService } from '@/lib/vault/identity-service';
import { Resend } from 'resend';
import { revalidatePath } from 'next/cache';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function assignJudgeAction(caseId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('No autenticado');
    }

    // 1. Validar Permisos
    const { data: profile } = await supabase
        .from('users_profile')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'secretary') {
        throw new Error('No autorizado');
    }

    // 2. Verificar que el caso esté en 'por_asignar'
    const { data: caseData } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .single();

    if (caseData.status !== 'por_asignar') {
        throw new Error('El caso ya ha sido asignado o procesado');
    }

    // 3. Selección Aleatoria de Juez
    const { data: judges } = await supabase
        .from('users_profile')
        .select('id')
        .eq('role', 'judge');

    if (!judges || judges.length === 0) {
        throw new Error('No hay jueces disponibles');
    }

    const randomJudge = judges[Math.floor(Math.random() * judges.length)];

    // 4. Crear Mapeo en Vault y Asignación
    try {
        const { anonActorId: judgeAnonId } = await IdentityVaultService.createMapping({
            userId: randomJudge.id,
            caseId: caseId,
            createdBy: user.id
        });

        const { error: assignError } = await supabase.from('case_assignments').insert({
            case_id: caseId,
            anon_actor_id: judgeAnonId,
            role: 'judge',
            status: 'active',
            assigned_by: user.id // Fix: Required field
        });

        if (assignError) {
            console.error('ASSIGNMENT ERROR:', assignError);
            throw new Error(`Error asignando juez: ${assignError.message}`);
        }

        // 5. Actualizar estado del caso a 'asignado'
        const { error: updateError } = await supabase
            .from('cases')
            .update({ status: 'asignado' })
            .eq('id', caseId);

        if (updateError) {
            throw new Error(`Error actualizando estado: ${updateError.message}`);
        }

    } catch (vaultError: any) {
        throw new Error(`Error en asignación: ${vaultError.message}`);
    }

    // 6. Enviar Email
    try {
        await resend.emails.send({
            from: 'Sistema de Jueces <onboarding@resend.dev>',
            to: 'jmeza050@gmail.com', // Demo email
            subject: `Nuevo Caso Asignado: ${caseData.title}`,
            html: `
        <h1>Nuevo Caso Asignado</h1>
        <p>Se le ha asignado un nuevo caso en el sistema.</p>
        <p>Clave de Acceso: <strong>${caseData.access_token}</strong></p>
        <p><em>Autogenerado por Sistema Judicial</em></p>
      `
        });
    } catch (emailError) {
        console.error('Error enviando email:', emailError);
    }

    revalidatePath('/dashboard/secretary');
}
