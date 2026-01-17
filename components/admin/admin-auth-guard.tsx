import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

interface AdminAuthGuardProps {
    children: ReactNode;
}

/**
 * Componente de protección para rutas de administración.
 * Verifica autenticación, rol y estado de la cuenta.
 * 
 * Se extrae del layout principal para permitir el uso de Suspense
 * y evitar errores de "Blocking Route" en Next.js.
 */
export async function AdminAuthGuard({ children }: AdminAuthGuardProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // No autenticado
    if (!user) {
        redirect('/auth/login?redirect=/admin');
    }

    // Verificar perfil y rol
    const { data: profile } = await supabase
        .from('users_profile')
        .select('role, status')
        .eq('id', user.id)
        .single();

    // Sin perfil o cuenta inactiva
    if (!profile || profile.status !== 'active') {
        redirect('/unauthorized');
    }

    // Solo admin, auditor y super_admin pueden acceder
    if (profile.role !== 'admin' && profile.role !== 'auditor' && profile.role !== 'super_admin') {
        redirect('/unauthorized');
    }

    return <>{children}</>;
}
