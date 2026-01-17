import { createClient } from "@/lib/supabase/server";
import { AppNavbar } from "@/components/app-navbar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { requireSuperAdmin } from "@/lib/vault/middleware";
import { vaultClient } from "@/lib/vault/client";
import { Suspense } from "react";
import { ReviewButtons } from "./review-buttons";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";



async function ResolutionsContent() {
    const user = await requireSuperAdmin();
    const supabase = await createClient();

    // 1. Obtener Casos Dictaminados
    const { data: resolvedCases, error } = await supabase
        .from('cases')
        .select(`
            id,
            case_number,
            title,
            updated_at,
            case_assignments!inner (
                anon_actor_id,
                assigned_at
            )
        `)
        .eq('status', 'resolved')
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching resolved cases:', error);
    }

    // 2. Obtener IDs anónimos únicos de los jueces asignados
    const anonIds = Array.from(
        new Set(
            resolvedCases?.flatMap((c: any) => 
                c.case_assignments?.map((a: any) => a.anon_actor_id) || []
            ) || []
        )
    );

    // 3. Consultar VAULT para obtener User IDs reales
    let userMappings: any[] = [];
    if (anonIds.length > 0) {
        const { data: mappings } = await vaultClient
            .from('identity_mapping')
            .select('anon_actor_id, user_id')
            .in('anon_actor_id', anonIds);
        userMappings = mappings || [];
    }

    // 4. Consultar Main DB para obtener IDs de usuarios
    const userIds = userMappings.map((m: any) => m.user_id);
    let userProfiles: any[] = [];
    if (userIds.length > 0) {
        const { data: profiles } = await supabase
            .from('users_profile')
            .select('id')
            .in('id', userIds);
        userProfiles = profiles || [];
    }

    // 5. Construir Mapas
    const profileMap = new Map();
    userProfiles.forEach(p => {
        // Generar pseudónimo para mostrar en lugar del nombre real encriptado
        const pseudonym = `Juez-${p.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`;
        profileMap.set(p.id, { id: p.id, pseudonym });
    });

    // Map: AnonID -> Profile (via UserID)
    const identityMap = new Map();
    userMappings.forEach(m => {
        const profile = profileMap.get(m.user_id);
        if (profile) {
            identityMap.set(m.anon_actor_id, profile);
        }
    });

    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg border shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Expediente</TableHead>
                        <TableHead>Dictamen</TableHead>
                        <TableHead>Juez Desencriptado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {!resolvedCases || resolvedCases.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                                No hay resoluciones registradas.
                            </TableCell>
                        </TableRow>
                    ) : (
                        resolvedCases.map((caseItem: any) => {
                            // Obtener el primer juez asignado (puede haber varios)
                            const assignment = caseItem.case_assignments?.[0];
                            const judgeIdentity = assignment ? identityMap.get(assignment.anon_actor_id) : null;

                            return (
                                <TableRow key={caseItem.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <TableCell>
                                        <div className="font-medium text-slate-900 dark:text-slate-100">
                                            {caseItem.case_number}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={caseItem.title}>
                                            {caseItem.title}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-md">
                                        <div className="text-sm text-emerald-700 dark:text-emerald-400 font-semibold">
                                            ✓ Dictamen Emitido
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            El caso ha sido resuelto
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                                {judgeIdentity ? judgeIdentity.pseudonym : 'Desconocido'}
                                            </span>
                                            {assignment && (
                                                <span className="text-xs font-mono text-muted-foreground" title="Anonymous ID">
                                                    ID: {assignment.anon_actor_id.substring(0, 8)}...
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                                        {new Date(caseItem.updated_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <ReviewButtons 
                                            caseId={caseItem.id} 
                                            caseNumber={caseItem.case_number}
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

export default function ResolutionsPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Suspense fallback={<div className="h-16 bg-white dark:bg-slate-900 border-b" />}>
                <AppNavbar />
            </Suspense>
            <div className="container mx-auto p-8 max-w-7xl">
                <div className="mb-8">
                    <Link href="/supreme-court">
                        <Button variant="ghost" className="mb-4 -ml-2">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver al Dashboard
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Resoluciones Judiciales
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Auditoría de dictámenes y revelación de identidad de jueces.
                    </p>
                </div>

                <Suspense fallback={
                    <div className="bg-white dark:bg-slate-900 rounded-lg border shadow-sm p-12 text-center text-muted-foreground">
                        Cargando resoluciones...
                    </div>
                }>
                    <ResolutionsContent />
                </Suspense>
            </div>
        </div>
    );
}
