import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase/admin';

export interface EphemeralCredentials {
    email: string;
    password: string;
    token: string;
    expiresAt: Date;
}

/**
 * Servicio para generar y gestionar credenciales efímeras
 * para jueces asignados a casos
 */
export class EphemeralCredentialsService {

    /**
     * Genera credenciales efímeras para un juez asignado a un caso
     * @param caseId - ID del caso
     * @param anonActorId - Pseudónimo del juez del Identity Vault
     * @returns Credenciales generadas (solo devueltas una vez, no se almacena password en claro)
     */
    static async generate(
        caseId: string,
        anonActorId: string
    ): Promise<EphemeralCredentials> {

        // 1. Generar código único para el email temporal
        const caseCode = crypto.randomBytes(4).toString('hex'); // Ej: "x9k2a1b3"
        const tempEmail = `caso-${caseCode}@sistema.temp`;

        // 2. Generar contraseña segura aleatoria (16 caracteres)
        const tempPassword = this.generateSecurePassword(16);

        // 3. Generar token JWT para acceso directo
        const accessToken = jwt.sign(
            {
                anonActorId,
                caseId,
                type: 'ephemeral',
                email: tempEmail
            },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        // 4. Hash de contraseña para almacenar
        const passwordHash = await bcrypt.hash(tempPassword, 12);

        // 5. Calcular fecha de expiración (7 días)
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // 6. Guardar en BD
        const { error } = await supabaseAdmin
            .from('ephemeral_credentials')
            .insert({
                case_id: caseId,
                anon_actor_id: anonActorId,
                temp_email: tempEmail,
                temp_password_hash: passwordHash,
                access_token: accessToken,
                expires_at: expiresAt.toISOString()
            });

        if (error) {
            console.error('[EphemeralCredentials] Error creating credentials:', error);
            throw new Error('Failed to create ephemeral credentials');
        }

        console.log('[EphemeralCredentials] Created credentials for case:', caseId);

        return {
            email: tempEmail,
            password: tempPassword,  // Solo se devuelve aquí, nunca se guarda en claro
            token: accessToken,
            expiresAt
        };
    }

    /**
     * Valida token de acceso y retorna información
     * @param token - Token JWT a validar
     * @returns Información del token si es válido, null si no
     */
    static async validateToken(token: string): Promise<{
        anonActorId: string;
        caseId: string;
        email: string;
        used: boolean;
    } | null> {

        try {
            // 1. Verificar firma JWT
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
                anonActorId: string;
                caseId: string;
                email: string;
                type: string;
            };

            if (decoded.type !== 'ephemeral') {
                return null;
            }

            // 2. Buscar en BD
            const { data, error } = await supabaseAdmin
                .from('ephemeral_credentials')
                .select('anon_actor_id, case_id, temp_email, used_at, expires_at')
                .eq('access_token', token)
                .single();

            if (error || !data) {
                return null;
            }

            // 3. Verificar si expiró
            if (new Date(data.expires_at) < new Date()) {
                return null;
            }

            return {
                anonActorId: data.anon_actor_id,
                caseId: data.case_id,
                email: data.temp_email,
                used: !!data.used_at
            };

        } catch (error) {
            console.error('[EphemeralCredentials] Token validation error:', error);
            return null;
        }
    }

    /**
     * Marca credenciales como usadas
     * @param token - Token a marcar como usado
     */
    static async markAsUsed(token: string): Promise<void> {
        await supabaseAdmin
            .from('ephemeral_credentials')
            .update({ used_at: new Date().toISOString() })
            .eq('access_token', token);
    }

    /**
     * Genera contraseña segura aleatoria
     * @param length - Longitud de la contraseña
     * @returns Contraseña generada
     */
    private static generateSecurePassword(length: number): string {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        const randomValues = crypto.randomBytes(length);

        for (let i = 0; i < length; i++) {
            password += charset[randomValues[i] % charset.length];
        }

        // Asegurar que tenga al menos una mayúscula, minúscula, número y símbolo
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSymbol = /[!@#$%^&*]/.test(password);

        if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
            // Regenerar si no cumple con los requisitos
            return this.generateSecurePassword(length);
        }

        return password;
    }

    /**
     * Limpia credenciales expiradas (ejecutar periódicamente)
     * @returns Número de credenciales eliminadas
     */
    static async cleanupExpired(): Promise<number> {
        const { data, error } = await supabaseAdmin
            .from('ephemeral_credentials')
            .delete()
            .lt('expires_at', new Date().toISOString())
            .select();

        if (error) {
            console.error('[EphemeralCredentials] Cleanup error:', error);
            return 0;
        }

        const count = data?.length || 0;
        console.log(`[EphemeralCredentials] Cleaned up ${count} expired credentials`);
        return count;
    }
}
