import { AppNavbar } from '@/components/app-navbar';
import { createClient } from '@/lib/supabase/server';
import { IdentityVaultService } from '@/lib/vault/identity-service';

interface Case {
  assignmentId: string;
  role: string;
  assignedAt: string;
  case: {
    id: string;
    case_number: string;
    title: string;
    description: string;
    case_type: string;
    priority: string;
    status: string;
    created_at: string;
  };
}

export default async function JudgeCasesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen p-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <p className="text-red-600">No autenticado</p>
        </div>
      </div>
    );
  }

  // Obtener pseudónimos del usuario desde el vault
  const pseudonyms = await IdentityVaultService.getUserPseudonyms(user.id);
  const pseudonymIds = pseudonyms.map(p => p.anonActorId);

  // Obtener casos asignados usando los pseudónimos
  let cases: Case[] = [];
  
  if (pseudonymIds.length > 0) {
    const { data: assignments } = await supabase
      .from('case_assignments')
      .select(`
        id,
        role,
        assigned_at,
        anon_actor_id,
        case_id,
        cases:case_id (
          id,
          case_number,
          title,
          description,
          case_type,
          priority,
          status,
          created_at
        )
      `)
      .in('anon_actor_id', pseudonymIds)
      .eq('status', 'active');

    if (assignments) {
      cases = assignments
        .filter(a => a.cases)
        .map(a => ({
          assignmentId: a.id,
          role: a.role,
          assignedAt: a.assigned_at,
          case: Array.isArray(a.cases) ? a.cases[0] : a.cases
        }));
    }
  }

  return (
    <>
      <AppNavbar />
      <div className="min-h-screen p-8 bg-background">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">👨‍⚖️ Mis Casos Asignados</h1>

          {cases.length === 0 && (
            <div className="border rounded-lg p-12 text-center bg-muted">
              <p className="text-muted-foreground">
                No tienes casos asignados actualmente
              </p>
            </div>
          )}

          {cases.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Total de casos: {cases.length}
              </p>

              {cases.map((item) => (
                <div
                  key={item.assignmentId}
                  className="border rounded-lg p-6 bg-card space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {item.case.case_number}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.case.title}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {item.role === 'judge' ? 'Juez Principal' : 'Secretario'}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {item.case.status}
                      </span>
                    </div>
                  </div>

                  {item.case.description && (
                    <p className="text-sm text-muted-foreground">
                      {item.case.description}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Tipo:</span>
                      <p className="text-muted-foreground capitalize">
                        {item.case.case_type}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Prioridad:</span>
                      <p className="text-muted-foreground capitalize">
                        {item.case.priority}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Asignado:</span>
                      <p className="text-muted-foreground">
                        {new Date(item.assignedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t flex gap-2">
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                      Ver Detalles
                    </button>
                    <button className="px-4 py-2 border rounded-md hover:bg-accent">
                      Documentos
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border rounded-lg p-6 bg-muted space-y-2">
            <h3 className="font-semibold">ℹ️ Información</h3>
            <p className="text-sm text-muted-foreground">
              Esta página muestra los casos asignados a ti usando el sistema de
              pseudónimos del Identity Vault.
            </p>
            <p className="text-sm text-muted-foreground">
              Tu identidad real NO está vinculada directamente a los casos en la
              base de datos principal.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
