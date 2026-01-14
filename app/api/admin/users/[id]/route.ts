import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { enforcePermission } from '@/lib/abac/evaluator';
import { ACTIONS } from '@/lib/abac/types';

// PATCH /api/admin/users/[id] - Editar usuario
export async function PATCH(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const userId = params.id;
    const supabase = await createClient();

    // 1. Autenticación
    const { data: { user: requester } } = await supabase.auth.getUser();
    if (!requester) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. Autorización
        await enforcePermission(requester.id, ACTIONS.USER_EDIT, 'users', { resourceId: userId });

        // 3. Protección: No permitir editar el super admin principal
        const { data: targetUser } = await supabaseAdmin
            .from('users_profile')
            .select('email')
            .eq('id', userId)
            .single();

        if (targetUser?.email === 'admin@cortesupremacr.go.ec') {
            return NextResponse.json({
                error: 'No se puede modificar el usuario super admin principal del sistema'
            }, { status: 403 });
        }

        const body = await request.json();
        const { fullName, email, role, attributes, department, phone } = body;

        // 3. Actualizar Perfil
        const updateData: any = {};
        if (fullName) updateData.real_name = fullName;
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (department) updateData.department = department;
        if (phone) updateData.phone = phone;

        if (Object.keys(updateData).length > 0) {
            const { error: profileError } = await supabaseAdmin
                .from('users_profile')
                .update(updateData)
                .eq('id', userId);

            if (profileError) throw new Error('Error actualizando perfil: ' + profileError.message);
        }

        // 4. Sincronizar Atributos (Si se proveen)
        if (attributes && Array.isArray(attributes)) {
            // Verificar atributos actuales
            const { data: currentAttrs, error: fetchError } = await supabaseAdmin
                .from('user_attributes')
                .select('attribute_id')
                .eq('user_id', userId);

            if (fetchError) throw fetchError;

            const currentAttrIds = currentAttrs.map(a => a.attribute_id);
            const newAttrIds = attributes; // IDs recibidos del frontend

            // Calcular a borrar y a agregar
            const toAdd = newAttrIds.filter((id: string) => !currentAttrIds.includes(id));
            const toRemove = currentAttrIds.filter((id: string) => !newAttrIds.includes(id));

            // Eliminar removidos
            if (toRemove.length > 0) {
                await supabaseAdmin
                    .from('user_attributes')
                    .delete()
                    .eq('user_id', userId)
                    .in('attribute_id', toRemove);
            }

            // Agregar nuevos
            if (toAdd.length > 0) {
                const toInsert = toAdd.map((attrId: string) => ({
                    user_id: userId,
                    attribute_id: attrId,
                    granted_by: requester.id,
                    granted_at: new Date().toISOString()
                }));

                await supabaseAdmin
                    .from('user_attributes')
                    .insert(toInsert);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[UpdateUser] Error:', error);
        return NextResponse.json({
            error: error.message || 'Error interno al actualizar usuario'
        }, { status: error.message?.includes('denegado') ? 403 : 500 });
    }
}
