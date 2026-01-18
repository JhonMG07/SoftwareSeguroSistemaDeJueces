import { Gavel } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";

export async function AppNavbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Obtener rol del usuario
  const { data: profile } = await supabase
    .from('users_profile')
    .select('role')
    .eq('id', user.id)
    .single();

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case 'judge': return 'Juez';
      case 'secretary': return 'Secretario';
      case 'auditor': return 'Auditor';
      case 'super_admin': return 'Administrador';
      default: return 'Usuario';
    }
  };

  const displayName = getRoleDisplayName(profile?.role);

  return (
    <header className="border-b bg-white dark:bg-slate-950 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gavel className="h-8 w-8 text-slate-800 dark:text-slate-200" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Sistema de Gestión
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Suprema Corte de Justicia
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {displayName}
            </span>
            <ThemeSwitcher />
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
