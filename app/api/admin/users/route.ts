import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enforcePermission } from '@/lib/abac/evaluator';
import { ACTIONS } from '@/lib/abac/types';

// GET /api/admin/users - Listar usuarios (solo super_admin)
export async function GET(request: Request) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Verificar permiso ABAC
        await enforcePermission(user.id, ACTIONS.USER_LIST, 'users');

        // Obtener usuarios con sus atributos (SIN datos sensibles)
        const { data: users, error } = await supabase
            .from('users_profile')
            .select(`
                id, 
                role, 
                status,
                department,
                created_at,
                user_attributes!user_attributes_user_id_fkey (
                    abac_attributes (
                        id,
                        name,
                        category,
                        level,
                        description
                    )
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[API] Error fetching users:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transformar datos - NO incluir real_name ni email para proteger identidad
        const formattedUsers = users?.map((u: any) => ({
            id: u.id,
            role: u.role,
            status: u.status,
            department: u.department || '',
            createdAt: u.created_at,
            attributes: u.user_attributes?.map((ua: any) => ua.abac_attributes).filter(Boolean) || []
        })) || [];

        return NextResponse.json({ users: formattedUsers });

    } catch (error: any) {
        if (error.message.includes('Permiso denegado')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        console.error('[API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
