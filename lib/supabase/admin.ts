import { createClient } from '@supabase/supabase-js'

/**
 * Cliente de Supabase con privilegios de administrador (Service Role).
 * USAR SOLO EN EL SERVIDOR (API Routes / Server Actions).
 * Permite bypass de RLS y gestión administrativa de Auth.
 */
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)
