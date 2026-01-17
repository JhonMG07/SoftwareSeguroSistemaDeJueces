import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Shield, Gavel } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Suspense } from "react";
import { AppNavbar } from "@/components/app-navbar";
import { IdentityVaultService } from "@/lib/vault/identity-service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Mapping statuses to display columns
// Revision: 'in_progress', 'in_review', 'assigned'
// Dictaminado: 'resolved'
// Cerrado: 'archived'

async function DashboardContent() {
  const supabase = await createClient();

  // 1. Obtener contadores globales
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
    .or('status.eq.in_progress,status.eq.assigned');

  const stats = {
    activeUsers: userCount || 0,
    pendingCases: pendingCount || 0,
    inReview: reviewCount || 0
  };

  // 2. Obtener Jueces y calcular estadísticas por Juez (Anonimizado)
  const { data: judges } = await supabaseAdmin
    .from('users_profile')
    .select('id')
    .eq('role', 'judge')
    .eq('status', 'active');

  const judgeStats = await Promise.all((judges || []).map(async (judge) => {
    // Obtener pseudónimos del juez (casos asignados)
    // Nota: Esto requiere acceso al Vault. Si falla (por config local), retornará array vacío.
    const mappings = await IdentityVaultService.getUserPseudonyms(judge.id);
    const caseIds = mappings.map(m => m.caseId);

    // Obtener estados de los casos
    let assignedCount = 0;
    let revisionCount = 0;
    let dictatedCount = 0;
    let closedCount = 0;

    if (caseIds.length > 0) {
      const { data: cases } = await supabaseAdmin
        .from('cases')
        .select('status')
        .in('id', caseIds);

      (cases || []).forEach(c => {
        assignedCount++;
        if (['in_progress', 'assigned'].includes(c.status)) {
          revisionCount++;
        } else if (c.status === 'resolved') {
          dictatedCount++;
        } else if (c.status === 'archived') {
          closedCount++;
        }
      });
    }

    return {
      anonName: `Juez-${judge.id.substring(0, 8).toUpperCase()}`,
      assignedCount,
      revisionCount,
      dictatedCount,
      closedCount
    };
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <AppNavbar />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Panel de Administración</h2>
          <p className="text-slate-600 dark:text-slate-400">Gestión centralizada de usuarios, seguridad y casos judiciales</p>
        </div>

        {/* Menus / Tarjetas de Navegación */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
          <Link href="/supreme-court/users">
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border-slate-200 dark:border-slate-700">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <Users className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Usuarios</CardTitle>
                    <CardDescription className="mt-1">
                      {stats.activeUsers} activos
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/supreme-court/cases">
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border-slate-200 dark:border-slate-700">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                    <FileText className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Casos</CardTitle>
                    <CardDescription className="mt-1">
                      {stats.pendingCases} pendientes
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/supreme-court/resolutions">
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border-slate-200 dark:border-slate-700">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                    <Gavel className="h-6 w-6 text-purple-700 dark:text-purple-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Resoluciones</CardTitle>
                    <CardDescription className="mt-1">Ver dictámenes</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/supreme-court/security">
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border-slate-200 dark:border-slate-700">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                    <Shield className="h-6 w-6 text-amber-700 dark:text-amber-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Seguridad</CardTitle>
                    <CardDescription className="mt-1">Identity Vault L2</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Tabla de Estadísticas por Juez */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-md">
          <CardHeader>
            <CardTitle>Carga Laboral de Jueces</CardTitle>
            <CardDescription>Resumen anonimizado del desempeño y asignación de casos</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Juez (Anónimo)</TableHead>
                  <TableHead className="text-center">Total Casos</TableHead>
                  <TableHead className="text-center">En Revisión</TableHead>
                  <TableHead className="text-center">Dictaminados</TableHead>
                  <TableHead className="text-center">Cerrados</TableHead>
                  <TableHead className="text-right">Eficiencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {judgeStats.length > 0 ? (
                  judgeStats.map((stat) => (
                    <TableRow key={stat.anonName}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 bg-slate-100 dark:bg-slate-800">
                            <AvatarFallback className="text-xs">{stat.anonName.substring(5, 7)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">{stat.anonName}</span>
                            <span className="text-xs text-muted-foreground">ID Protegido</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-base px-3 py-1">
                          {stat.assignedCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {stat.revisionCount > 0 && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {stat.revisionCount}
                          </Badge>
                        )}
                        {stat.revisionCount === 0 && <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {stat.dictatedCount > 0 && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                            {stat.dictatedCount}
                          </Badge>
                        )}
                        {stat.dictatedCount === 0 && <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {stat.closedCount > 0 && (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {stat.closedCount}
                          </Badge>
                        )}
                        {stat.closedCount === 0 && <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-medium">
                          {stat.assignedCount > 0 
                            ? `${Math.round(((stat.dictatedCount + stat.closedCount) / stat.assignedCount) * 100)}%` 
                            : 'N/A'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay datos de jueces disponibles
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}

export default function SupremeCourtDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando panel...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
