import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enforcePermission } from '@/lib/abac/evaluator';

// DELETE /api/admin/users/[userId]/attributes/[attrId] - Revocar atributo
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string; attrId: string }> }
) {
    const { id: userId, attrId: assignmentId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Verificar permiso ABAC
        await enforcePermission(user.id, 'admin.abac', 'user_attributes');

        // Verificar que la asignación existe y pertenece al usuario
        const { data: assignment, error: fetchError } = await supabase
            .from('user_attributes')
            .select(`
        *,
        abac_attributes (name),
        users_profile!user_attributes_user_id_fkey (real_name)
      `)
            .eq('id', assignmentId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !assignment) {
            return NextResponse.json(
                { error: 'Asignación de atributo no encontrada' },
                { status: 404 }
            );
        }

        // Eliminar la asignación
        const { error: deleteError } = await supabase
            .from('user_attributes')
            .delete()
            .eq('id', assignmentId);

        if (deleteError) {
            console.error('[API] Error revoking attribute:', deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        console.log(
            `[API] Attribute revoked: ${assignment.abac_attributes.name} from user ${assignment.users_profile.real_name} by ${user.email}`
        );

        return NextResponse.json({ success: true });

    } catch (error: any) {
        if (error.message.includes('Permiso denegado')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        console.error('[API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
