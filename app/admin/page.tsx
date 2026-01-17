import { MetricsOverview } from "@/components/admin/metrics-overview";
import { TokenStats } from "@/components/admin/token-stats";
import { RecentLogs } from "@/components/admin/recent-logs";
import { JudgeStats } from "@/components/admin/judge-stats";
import { CaseStats } from "@/components/admin/case-stats";


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



            {/* Métricas principales */}
            <MetricsOverview />

            {/* Grid de cuatro columnas: Jueces, Casos, Tokens, Logs */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Estadísticas de jueces activos */}
                <JudgeStats />

                {/* Estadísticas de casos */}
                <CaseStats />

                {/* Estadísticas de tokens */}
                <TokenStats />

                {/* Últimos logs */}
                <RecentLogs />
            </div>


        </div>
    );
}
