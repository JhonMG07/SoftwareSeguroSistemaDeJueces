import { createClient } from '@/lib/supabase/server';

/**
 * Middleware: Verificar que el usuario autenticado es Super Admin
 * 
 * @throws Error si no está autenticado o no es super_admin
 * @returns Usuario autenticado si es Super Admin
 */
export async function requireSuperAdmin() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized - No authenticated user');
    }

    console.log('[Middleware] Checking profile for user:', user.id);

    const { data: profile, error } = await supabase
        .from('users_profile')
        .select('role, status')
        .eq('id', user.id)
        .single();

    console.log('[Middleware] Profile query result:', { profile, error });

    if (!profile) {
        throw new Error('User profile not found');
    }

    if (profile.status !== 'active') {
        throw new Error('Account is not active');
    }

    if (profile.role !== 'super_admin') {
        throw new Error('Forbidden - Super Admin access required');
    }

    return user;
}
