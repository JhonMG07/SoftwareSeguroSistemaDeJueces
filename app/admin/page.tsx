import { MetricsOverview } from "@/components/admin/metrics-overview";
import { TokenStats } from "@/components/admin/token-stats";
import { RecentLogs } from "@/components/admin/recent-logs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Shield } from "lucide-react";

/**
 * Dashboard principal del panel de auditoría
 *
 * Muestra:
 * - Resumen de métricas (solo conteos agregados)
 * - Estadísticas de tokens (sin contenido)
 * - Últimas actividades (logs anonimizados)
 *
 * IMPORTANTE: Ningún dato sensible es expuesto
 * - No hay user_id reales (solo hashes de 8 caracteres)
 * - No hay contenido de casos
 * - No hay identidades de jueces/secretarios
 */
export default function AdminDashboardPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    Dashboard de Auditoría
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Métricas y logs del sistema (datos anonimizados)
                </p>
            </div>

            {/* Aviso de seguridad */}
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-400 text-sm">
                        <Shield className="h-4 w-4" />
                        Información de Seguridad
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-amber-700 dark:text-amber-300">
                    <p>
                        Este panel muestra únicamente datos <strong>anonimizados</strong> y{" "}
                        <strong>métricas agregadas</strong>. Los identificadores de usuario
                        han sido reemplazados por hashes parciales (8 caracteres) que permiten
                        correlacionar acciones sin revelar identidades reales.
                    </p>
                </CardContent>
            </Card>

            {/* Métricas principales */}
            <MetricsOverview />

            {/* Grid de dos columnas */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Estadísticas de tokens */}
                <TokenStats />

                {/* Últimos logs */}
                <RecentLogs />
            </div>

            {/* Nota sobre limitaciones */}
            <Card className="border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                <CardContent className="flex items-start gap-3 pt-6">
                    <AlertTriangle className="h-5 w-5 text-slate-500 mt-0.5" />
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                        <p className="font-medium mb-1">Limitaciones del rol de auditor:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>No es posible ver contenido de casos judiciales</li>
                            <li>No es posible ver identidades reales de jueces o secretarios</li>
                            <li>No es posible acceder al Identity Vault</li>
                            <li>Los datos se actualizan periódicamente (no en tiempo real)</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
