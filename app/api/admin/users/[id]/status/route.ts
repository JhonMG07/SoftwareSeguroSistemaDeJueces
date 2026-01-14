import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { enforcePermission } from '@/lib/abac/evaluator';
import { ACTIONS } from '@/lib/abac/types';

// PATCH /api/admin/users/[id]/status - Cambiar estado
export async function PATCH(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const userId = params.id;
    const supabase = await createClient();

    const { data: { user: requester } } = await supabase.auth.getUser();
    if (!requester) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await enforcePermission(requester.id, ACTIONS.USER_DEACTIVATE, 'users', { resourceId: userId });

        // Protección: No permitir cambiar estado del super admin principal
        const { data: targetUser } = await supabaseAdmin
            .from('users_profile')
            .select('email')
            .eq('id', userId)
            .single();

        if (targetUser?.email === 'admin@cortesupremacr.go.ec') {
            return NextResponse.json({
                error: 'No se puede cambiar el estado del usuario super admin principal del sistema'
            }, { status: 403 });
        }

        const body = await request.json();
        const { status } = body;

        if (!['active', 'inactive', 'suspended'].includes(status)) {
            return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
        }

        // 1. Actualizar perfil
        const { error: profileError } = await supabaseAdmin
            .from('users_profile')
            .update({ status })
            .eq('id', userId);

        if (profileError) throw profileError;

        // 2. Acciones en Auth (Banear si suspendido)
        if (status === 'suspended' || status === 'inactive') {
            // Banear usuario por 100 años para impedir login inmediato
            await supabaseAdmin.auth.admin.updateUserById(userId, {
                ban_duration: '876000h' // ~100 años
            });
        } else if (status === 'active') {
            // Quitar ban
            await supabaseAdmin.auth.admin.updateUserById(userId, {
                ban_duration: '0'
            });
        }

        return NextResponse.json({ success: true, status });

    } catch (error: any) {
        console.error('[UpdateStatus] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
