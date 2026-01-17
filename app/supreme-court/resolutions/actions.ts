'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Aprobar o Desaprobar un dictamen
 * Cambia el estado del caso a 'archived' (cerrado)
 */
export async function reviewVerdict(caseId: string, approved: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autenticado' };
    }

    try {
        // Verificar que el usuario es super_admin
        const { data: profile } = await supabase
            .from('users_profile')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'super_admin') {
            return { error: 'No autorizado. Solo super admins pueden revisar dictámenes.' };
        }

        // Actualizar el caso a 'archived' (cerrado)
        const { error: updateError } = await supabase
            .from('cases')
            .update({
                status: 'archived',
                updated_at: new Date().toISOString()
            })
            .eq('id', caseId);

        if (updateError) {
            console.error('Error updating case:', updateError);
            return { error: 'Error al actualizar el caso' };
        }

        // Opcional: Registrar la decisión en un log de auditoría
        // await supabase.from('audit_log').insert({...})

        revalidatePath('/supreme-court/resolutions');

        return {
            success: true,
            message: approved ? 'Dictamen aprobado y caso cerrado' : 'Dictamen desaprobado y caso cerrado'
        };

    } catch (error) {
        console.error('Error reviewing verdict:', error);
        return { error: 'Error del sistema' };
    }
}
