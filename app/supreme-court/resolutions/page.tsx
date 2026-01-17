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



async function ResolutionsContent() {
    const user = await requireSuperAdmin();
    const supabase = await createClient();

    // 1. Obtener Resoluciones
    const { data: resolutions, error } = await supabase
        .from('case_resolutions')
        .select(`
            id,
            content,
            created_at,
            author_anon_id,
            cases (
                title,
                case_number
            )
        `)
        .order('created_at', { ascending: false });

    // 2. Obtener IDs anónimos únicos
    const anonIds = Array.from(new Set(resolutions?.map((r: any) => r.author_anon_id) || []));

    // 3. Consultar VAULT para obtener User IDs reales
    // Nota: Cross-Database Query manual
    let userMappings: any[] = [];
    if (anonIds.length > 0) {
        const { data: mappings } = await vaultClient
            .from('identity_mapping')
            .select('anon_actor_id, user_id')
            .in('anon_actor_id', anonIds);
        userMappings = mappings || [];
    }

    // 4. Consultar Main DB para obtener Nombres Reales
    const userIds = userMappings.map((m: any) => m.user_id);
    let userProfiles: any[] = [];
    if (userIds.length > 0) {
        const { data: profiles } = await supabase
            .from('users_profile')
            .select('id, real_name, email')
            .in('id', userIds);
        userProfiles = profiles || [];
    }

    // 5. Construir Mapas para unificación
    // Map: UserID -> Profile
    const profileMap = new Map();
    userProfiles.forEach(p => profileMap.set(p.id, p));

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
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {!resolutions || resolutions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-32 text-muted-foreground">
                                No hay resoluciones registradas.
                            </TableCell>
                        </TableRow>
                    ) : (
                        resolutions.map((res: any) => {
                            const judgeIdentity = identityMap.get(res.author_anon_id);

                            return (
                                <TableRow key={res.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <TableCell>
                                        <div className="font-medium text-slate-900 dark:text-slate-100">
                                            {res.cases?.case_number}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={res.cases?.title}>
                                            {res.cases?.title}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-md">
                                        <div className="line-clamp-3 text-sm italic text-slate-700 dark:text-slate-300">
                                            "{res.content}"
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                                {judgeIdentity ? judgeIdentity.real_name : 'Desconocido'}
                                            </span>
                                            <span className="text-xs font-mono text-muted-foreground" title="Anonymous ID">
                                                ID: {res.author_anon_id.substring(0, 8)}...
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                                        {new Date(res.created_at).toLocaleString()}
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
            <AppNavbar />
            <div className="container mx-auto p-8 max-w-7xl">
                <div className="mb-8">
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
