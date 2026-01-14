import { createClient } from '@supabase/supabase-js';

// Validar variables de entorno
const vaultUrl = process.env.IDENTITY_VAULT_URL;
const vaultKey = process.env.IDENTITY_VAULT_SERVICE_KEY;

if (!vaultUrl || !vaultKey) {
    throw new Error(
        'Identity Vault credentials not configured. ' +
        'Set IDENTITY_VAULT_URL and IDENTITY_VAULT_SERVICE_KEY in .env.local'
    );
}

/**
 * Cliente para Identity Vault (Proyecto Supabase separado)
 * 
 * ⚠️ IMPORTANTE: Este cliente solo debe usarse en server-side code:
 * - API Routes
 * - Server Actions
 * - Server Components
 * 
 * NUNCA importar en componentes de cliente o exponer credenciales.
 */
export const vaultClient = createClient(vaultUrl, vaultKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Tipos para las tablas del vault

export interface IdentityMapping {
    id: string;
    anon_actor_id: string;
    user_id: string;
    case_id: string;
    created_by: string;
    created_at: string;
    last_accessed_at: string | null;
    access_count: number;
}

export interface IdentityAccessLog {
    id: string;
    anon_actor_id: string;
    accessed_by: string;
    access_reason: string;
    ip_address: string | null;
    user_agent: string | null;
    accessed_at: string;
}
