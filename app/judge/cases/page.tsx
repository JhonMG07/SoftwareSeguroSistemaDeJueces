import { createClient } from "@/lib/supabase/server";
import { IdentityVaultService } from "@/lib/vault/identity-service";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, FileText, Clock } from "lucide-react";
import { ClientNavbar } from "@/components/client-navbar";

export default async function JudgeCasesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Verificar que el usuario sea realmente un JUEZ
  const { data: profile } = await supabase
    .from('users_profile')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'judge') {
    // Si es secretaria u otro rol, redirigir a su dashboard correspondiente
    if (profile?.role === 'secretary') {
      redirect('/dashboard/secretary');
    }
    redirect('/');
  }


  // 1. Obtener Mapping desde el Vault (Identity Translation)
  // Esto retorna SOLO los IDs de los casos asignados a este juez
  const assignments = await IdentityVaultService.getUserPseudonyms(user.id);

  if (assignments.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <ClientNavbar displayName="Juez" />
        <div className="container mx-auto p-8">
          <h1 className="text-2xl font-bold mb-6">Mis Casos Asignados</h1>
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <ShieldAlert className="h-12 w-12 mb-4 opacity-50" />
              <p>No tiene casos asignados actualmente.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const caseIds = assignments.map(a => a.caseId);

  // 2. Obtener Metadata Pública de los Casos
  // NO se filtra por juez_id en la consulta (eso rompería el anonimato en queries)
  // Se filtra por la lista de IDs obtenida del Vault
  const { data: cases } = await supabase
    .from('cases')
    .select('id, case_number, title, status, classification, created_at, deadline')
    .in('id', caseIds)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ClientNavbar displayName="Juez" />
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Expedientes Asignados</h1>
            <p className="text-muted-foreground mt-2">
              Gestión segura de casos judiciales. Su identidad está protegida.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cases?.map((judicialCase) => (
            <Card key={judicialCase.id} className="flex flex-col border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={judicialCase.classification === 'secret' ? 'destructive' : 'secondary'}>
                    {judicialCase.classification?.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="border-slate-300 dark:border-slate-600">{judicialCase.status}</Badge>
                </div>
                <CardTitle className="text-lg text-slate-900 dark:text-slate-100">{judicialCase.case_number}</CardTitle>
                <CardDescription className="line-clamp-2">{judicialCase.title}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Asignado: {new Date(judicialCase.created_at).toLocaleDateString()}</span>
                  </div>
                  {judicialCase.deadline && (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                      <ShieldAlert className="h-4 w-4" />
                      <span>Vence: {new Date(judicialCase.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 pt-4">
                <Button asChild className="w-full">
                  <Link href={`/judge/cases/${judicialCase.id}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    Acceder al Expediente
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
