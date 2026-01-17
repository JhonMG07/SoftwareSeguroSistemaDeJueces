import { createClient } from '@/lib/supabase/server';
import { AppNavbar } from '@/components/app-navbar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge'; // Assuming Badge exists
import { redirect } from 'next/navigation';

// Force dynamic rendering to ensure fresh data
// export const dynamic = 'force-dynamic'; // Removed due to conflict with nextConfig.cacheComponents
// export const revalidate = 0; // Removed due to conflict with nextConfig.cacheComponents

import { AssignJudgeButton } from '@/components/secretary/assign-judge-button';

export default async function SecretaryDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

    // Verificar rol
    const { data: profile } = await supabase
        .from('users_profile')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'secretary') {
        // Si no es secretario, redirigir a home para que el router decida
        redirect('/');
    }

    // Obtener casos creados por este secretario
    // Usamos la columna secretary_id como atajo
    const { data: cases } = await supabase
        .from('cases')
        .select(`
      id,
      title,
      status,
      created_at,
      created_at,
      case_assignments (
        anon_actor_id,
        role
      )
    `)
        .in('status', ['por_asignar', 'asignado', 'en_revision', 'dictaminado', 'cerrado'])
        .order('created_at', { ascending: false });

    // DEBUG: Log to file - REMOVED after successful debugging
    /* 
    if (cases && cases.length > 0) {
        ...
    } 
    */

    return (
        <>
            <AppNavbar />
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-6xl mx-auto space-y-8">

                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Panel de Secretaría</h1>
                            <p className="text-muted-foreground mt-2">
                                Gestión y radicación de casos judiciales
                            </p>
                        </div>
                        <Link href="/dashboard/secretary/create">
                            <Button>+ Nuevo Caso</Button>
                        </Link>
                    </div>

                    <div className="border rounded-lg bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Juez Asignado (ID Anónimo)</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!cases || cases.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            No hay casos registrados
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    cases.map((c) => {
                                        // Buscar el asignado que sea role='judge'
                                        const judgeAssignment = c.case_assignments.find((a: any) => a.role === 'judge');

                                        return (
                                            <TableRow key={c.id}>
                                                <TableCell className="font-medium">{c.title}</TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {judgeAssignment ? judgeAssignment.anon_actor_id : 'Pendiente'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={
                                                        c.status === 'asignado' ? 'default' :
                                                            c.status === 'en_revision' ? 'secondary' :
                                                                c.status === 'dictaminado' ? 'outline' :
                                                                    c.status === 'cerrado' ? 'destructive' :
                                                                        c.status === 'por_asignar' ? 'secondary' : 'default'
                                                    } className={
                                                        c.status === 'asignado' ? 'bg-blue-600 hover:bg-blue-700' :
                                                            c.status === 'en_revision' ? 'bg-yellow-500 hover:bg-yellow-600' :
                                                                c.status === 'dictaminado' ? 'bg-purple-600 text-white hover:bg-purple-700' :
                                                                    c.status === 'cerrado' ? 'bg-green-600 hover:bg-green-700' :
                                                                        c.status === 'por_asignar' ? 'bg-gray-400 hover:bg-gray-500' : ''
                                                    }>
                                                        {c.status === 'asignado' && 'Asignado'}
                                                        {c.status === 'en_revision' && 'En Revisión'}
                                                        {c.status === 'dictaminado' && 'Dictaminado'}
                                                        {c.status === 'cerrado' && 'Cerrado'}
                                                        {c.status === 'por_asignar' && 'Por Asignar'}
                                                        {!['asignado', 'en_revision', 'dictaminado', 'cerrado', 'por_asignar'].includes(c.status) && c.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(c.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {c.status === 'por_asignar' && (
                                                        <AssignJudgeButton caseId={c.id} />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </>
    );
}
