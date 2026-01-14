import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enforcePermission } from '@/lib/abac/evaluator';
import { ACTIONS } from '@/lib/abac/types';

// GET /api/admin/users/[id]/attributes - Listar atributos del usuario
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: userId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Verificar permiso ABAC (solo super admin puede gestionar atributos)
        await enforcePermission(user.id, 'admin.abac', 'user_attributes');

        // Obtener atributos del usuario target
        const { data: userAttributes, error } = await supabase
            .from('user_attributes')
            .select(`
        id,
        attribute_id,
        granted_by,
        granted_at,
        expires_at,
        reason,
        abac_attributes (
          id,
          name,
          category,
          description,
          level
        ),
        granted_by_profile:users_profile!user_attributes_granted_by_fkey (
          real_name
        )
      `)
            .eq('user_id', userId)
            .order('granted_at', { ascending: false });

        if (error) {
            console.error('[API] Error fetching user attributes:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ attributes: userAttributes });

    } catch (error: any) {
        if (error.message.includes('Permiso denegado')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        console.error('[API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/users/[id]/attributes - Asignar atributo al usuario
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: userId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Verificar permiso ABAC
        await enforcePermission(user.id, 'admin.abac', 'user_attributes');

        const body = await request.json();
        const { attribute_id, expires_at, reason } = body;

        // Validación
        if (!attribute_id) {
            return NextResponse.json(
                { error: 'attribute_id es requerido' },
                { status: 400 }
            );
        }

        // Verificar que el atributo existe
        const { data: attribute, error: attrError } = await supabase
            .from('abac_attributes')
            .select('*')
            .eq('id', attribute_id)
            .single();

        if (attrError || !attribute) {
            return NextResponse.json(
                { error: 'Atributo no encontrado' },
                { status: 404 }
            );
        }

        // Verificar que el usuario existe
        const { data: targetUser, error: userError } = await supabase
            .from('users_profile')
            .select('id, real_name, role')
            .eq('id', userId)
            .single();

        if (userError || !targetUser) {
            return NextResponse.json(
                { error: 'Usuario no encontrado' },
                { status: 404 }
            );
        }

        // Asignar atributo
        const { data: assignment, error: assignError } = await supabase
            .from('user_attributes')
            .insert({
                user_id: userId,
                attribute_id,
                granted_by: user.id,
                expires_at: expires_at || null,
                reason: reason || `Asignado por ${user.email}`
            })
            .select(`
        *,
        abac_attributes (*)
      `)
            .single();

        if (assignError) {
            // Si es duplicate key, es porque ya tiene el atributo
            if (assignError.code === '23505') {
                return NextResponse.json(
                    { error: 'El usuario ya tiene este atributo asignado' },
                    { status: 409 }
                );
            }

            console.error('[API] Error assigning attribute:', assignError);
            return NextResponse.json({ error: assignError.message }, { status: 500 });
        }

        console.log(
            `[API] Attribute assigned: ${attribute.name} to user ${targetUser.real_name} by ${user.email}`
        );

        return NextResponse.json({ assignment }, { status: 201 });

    } catch (error: any) {
        if (error.message.includes('Permiso denegado')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        console.error('[API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
