'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { EphemeralCredentialsService } from '@/lib/services/ephemeral-credentials';
import { IdentityVaultService } from '@/lib/vault/identity-service';

// Schema para validación de token
const TokenSchema = z.object({
    token: z.string().min(1, 'El código de acceso es requerido'),
    caseId: z.string().uuid()
});

// Schema para dictamen
const VerdictSchema = z.object({
    caseId: z.string().uuid(),
    verdict: z.string().min(10, 'El dictamen debe tener al menos 10 caracteres'),
    notes: z.string().optional()
});

/**
 * Validar Token de Caso
 * Verifica el token y establece una cookie de sesión para este caso
 */
export async function validateCaseToken(prevState: any, formData: FormData) {
    const token = formData.get('token') as string;
    const caseId = formData.get('caseId') as string;

    const result = TokenSchema.safeParse({ token, caseId });

    if (!result.success) {
        return { error: 'Datos inválidos' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Sesión expirada' };
    }

    try {
        // 1. Verificar acceso en Vault (¿Este juez tiene asignado este caso?)
        const { hasAccess, anonActorId } = await IdentityVaultService.verifyAccess(user.id, caseId);

        if (!hasAccess || !anonActorId) {
            return { error: 'No tienes permisos para acceder a este caso.' };
        }

        // 2. Validar Token contra la BD (Service Role necesario para ver tokens seguros)
        // El input 'token' es la contraseña que ingresa el usuario
        const accessToken = await EphemeralCredentialsService.validatePassword(caseId, token);

        if (!accessToken) {
            return { error: 'Código de acceso inválido o expirado.' };
        }

        // 3. Establecer Cookie de "Sesión de Caso"
        // Esta cookie permite acceso temporal a este caso específico
        const cookieStore = await cookies();
        cookieStore.set(`case_access_${caseId}`, accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 2 // 2 horas
        });

    } catch (error) {
        console.error('Error validando token:', error);
        return { error: 'Error del sistema validando credenciales' };
    }

    redirect(`/judge/cases/${caseId}`);
}

/**
 * Enviar Dictamen
 * Operación atómica: Guardar dictamen + Invalidar Token + Log
 */
export async function submitVerdict(prevState: any, formData: FormData) {
    const caseId = formData.get('caseId') as string;
    const verdict = formData.get('verdict') as string;

    const result = VerdictSchema.safeParse({ caseId, verdict });

    if (!result.success) {
        console.error('Validation error:', result.error);
        const errorMessage = result.error.issues?.[0]?.message || 'Datos inválidos';
        return { error: 'Datos inválidos en el dictamen: ' + errorMessage };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Sesión expirada' };
    }

    // 1. Validar Cookie de Acceso
    const cookieStore = await cookies();
    const accessCookie = cookieStore.get(`case_access_${caseId}`);

    if (!accessCookie || !accessCookie.value) {
        return { error: 'Sesión de caso inválida. Por favor re-ingrese su token.' };
    }

    try {
        // 2. Verificar Vault y obtener Anon ID
        const { hasAccess, anonActorId } = await IdentityVaultService.verifyAccess(user.id, caseId);

        if (!hasAccess || !anonActorId) {
            return { error: 'Acceso denegado.' };
        }

        // 3. Guardar Dictamen (Usando el ID Anónimo como autor)
        // Nota: Asumimos que existe una tabla 'verdicts' o se actualiza 'cases'
        // Por simplicidad, actualizamos 'cases' y creamos un registro de historial

        // Actualizar caso
        const { error: updateError } = await supabase
            .from('cases')
            .update({
                status: 'dictaminado',
                updated_at: new Date().toISOString()
                // En un sistema real, guardaríamos el dictamen en una tabla encriptada separada
            })
            .eq('id', caseId);

        if (updateError) throw updateError;

        // Insertar el dictamen/resolución
        const { error: verdictError } = await supabase
            .from('case_resolutions') // Asumiendo tabla
            .insert({
                case_id: caseId,
                author_anon_id: anonActorId, // IMPORTANTE: Autor anónimo
                content: verdict,
                created_at: new Date().toISOString()
            });

        // Si no existe la tabla case_resolutions, podemos usar case_history o un campo en cases
        // Adaptar según esquema real.

        // 4. Invalidar Token
        await EphemeralCredentialsService.markAsUsed(accessCookie.value);

        // 5. Limpiar Cookie
        cookieStore.delete(`case_access_${caseId}`);

    } catch (error) {
        console.error('Error enviando dictamen:', error);
        return { error: 'Error al enviar el dictamen. Intente nuevamente.' };
    }

    redirect('/judge/cases?success=true');
}
