import { LogTable } from "@/components/admin/log-table";

/**
 * Página de logs de auditoría
 *
 * Muestra tabla paginada de logs con filtros.
 * Todos los datos están anonimizados:
 * - user_id → hash MD5 de 8 caracteres
 * - resource_id → NO se muestra
 * - reason → sanitizada (sin UUIDs)
 */
export default function AdminLogsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    Logs de Auditoría
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Registro de actividades del sistema (datos anonimizados)
                </p>
            </div>

            {/* Tabla de logs */}
            <LogTable />
        </div>
    );
}
