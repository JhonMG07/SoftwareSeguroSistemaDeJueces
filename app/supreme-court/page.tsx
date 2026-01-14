import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { AppNavbar } from "@/components/app-navbar";


async function DashboardContent() {
  const supabase = await createClient();

  // Obtener estadísticas básicas
  const { count: userCount } = await supabase
    .from('users_profile')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: pendingCount } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: reviewCount } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'in_progress');

  const stats = {
    activeUsers: userCount || 0,
    pendingCases: pendingCount || 0,
    inReview: reviewCount || 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <AppNavbar />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Panel de Administración</h2>
          <p className="text-slate-600 dark:text-slate-400">Gestión centralizada de usuarios, seguridad y casos judiciales</p>
        </div>

        {/* Main Navigation Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Link href="/supreme-court/users">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-slate-200 dark:border-slate-700">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Users className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                  </div>
                  <CardTitle className="text-lg">Usuarios</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>Gestionar jueces y secretarios del sistema</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/supreme-court/cases">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-slate-200 dark:border-slate-700">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                    <FileText className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
                  </div>
                  <CardTitle className="text-lg">Casos</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>Crear y asignar casos judiciales</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/supreme-court/security">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-slate-200 dark:border-slate-700">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                    <Shield className="h-6 w-6 text-amber-700 dark:text-amber-300" />
                  </div>
                  <CardTitle className="text-lg">Seguridad</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>Auditoría y logs del Identity Vault</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Usuarios Activos</span>
                <span className="font-semibold">{stats.activeUsers}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Casos Pendientes</span>
                <span className="font-semibold">{stats.pendingCases}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">En Revisión</span>
                <span className="font-semibold">{stats.inReview}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Info */}
        <div className="bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Información del Sistema</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Protección de Identidad</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Identity Vault - Nivel 2 (BD Separada)</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Nivel de Seguridad</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Alto - Información Gubernamental</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Última Actualización</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">8 de Enero, 2026</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SupremeCourtDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400">Cargando...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
