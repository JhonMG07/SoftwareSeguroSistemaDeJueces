import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { enforcePermission } from '@/lib/abac/evaluator';
import { ACTIONS } from '@/lib/abac/types';
import { encrypt } from '@/lib/crypto/encryption';

// POST /api/admin/users/create - Crear nuevo usuario
export async function POST(request: Request) {
    const supabase = await createClient();

    // 1. Autenticación del solicitante
    const { data: { user: requester } } = await supabase.auth.getUser();
    if (!requester) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. Autorización ABAC (¿Puede crear usuarios el solicitante?)
        await enforcePermission(requester.id, ACTIONS.USER_CREATE, 'users');

        // 3. Validar Input
        const body = await request.json();
        const { email, fullName, role, department, phone, attributes } = body;

        if (!email || !fullName || !role) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        // 4. Crear Usuario en Supabase Auth (Usando Service Role Admin)
        // Generamos un password temporal aleatorio si no se provee (o enviamos email de invitación)
        // Por simplicidad en este MVP, usaremos autoconfirmación y un password default o generado.
        // En producción idealmente usaríamos `inviteUserByEmail`.
        const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;

        const { data: newUserAuth, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true, // Autoconfirmar para evitar pasos extra en prueba
            user_metadata: {
                full_name: fullName,
                role: role, // Metadata útil para RLS básico triggers
            }
        });

        if (authError) {
            console.error('[CreateUser] Error crear auth un:', authError);
            return NextResponse.json({ error: authError.message }, { status: 500 });
        }

        if (!newUserAuth.user) {
            return NextResponse.json({ error: 'Error inesperado al crear usuario' }, { status: 500 });
        }

        const newUserId = newUserAuth.user.id;

        // 5. Encriptar datos sensibles y crear Perfil en users_profile
        const { error: profileError } = await supabaseAdmin
            .from('users_profile')
            .insert({
                id: newUserId,
                real_name: encrypt(fullName), // 🔐 Encriptado
                email: encrypt(email),        // 🔐 Encriptado
                phone: phone ? encrypt(phone) : null, // 🔐 Encriptado
                department: department || null,
                role: role,
                status: 'active',
                created_at: new Date().toISOString(),
                created_by: requester.id
            });

        if (profileError) {
            console.error('[CreateUser] Error crear profile:', profileError);
            // Rollback auth user? Difícil sin transacción distribuida, pero recomendable borrar el auth user
            await supabaseAdmin.auth.admin.deleteUser(newUserId);
            return NextResponse.json({ error: 'Error al crear perfil de usuario: ' + profileError.message }, { status: 500 });
        }

        // 6. Asignar Atributos ABAC
        if (attributes && Array.isArray(attributes) && attributes.length > 0) {
            const attributesToInsert = attributes.map((attrId: string) => ({
                user_id: newUserId,
                attribute_id: attrId,
                granted_by: requester.id,
                granted_at: new Date().toISOString()
            }));

            const { error: abacError } = await supabaseAdmin
                .from('user_attributes')
                .insert(attributesToInsert);

            if (abacError) {
                console.error('[CreateUser] Error asignar atributos:', abacError);
                // No hacemos rollback completo, pero avisamos.
            }
        }

        return NextResponse.json({
            success: true,
            user: {
                id: newUserId,
                email,
                fullName,
                role,
                tempPassword // Solo para propósitos de desarrollo/demo
            }
        });

    } catch (error: any) {
        if (error.message?.includes('Permiso denegado')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        console.error('[CreateUser] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
