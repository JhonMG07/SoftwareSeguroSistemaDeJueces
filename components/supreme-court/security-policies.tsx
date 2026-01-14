import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit } from "lucide-react";
import type { SecurityPolicy } from "@/lib/types/supreme-court";

interface SecurityPoliciesProps {
  policies: SecurityPolicy[];
  onCreatePolicy: () => void;
  onEditPolicy: (policy: SecurityPolicy) => void;
  onTogglePolicy: (policyId: string, active: boolean) => void;
}

export function SecurityPolicies({
  policies,
  onCreatePolicy,
  onEditPolicy,
  onTogglePolicy,
}: SecurityPoliciesProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Políticas de Seguridad</h2>
          <p className="text-sm text-muted-foreground">Gestionar reglas de acceso del sistema</p>
        </div>
        <Button onClick={onCreatePolicy}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Política
        </Button>
      </div>

      {/* Lista de políticas */}
      <div className="space-y-4">
        {policies.map((policy) => (
          <Card key={policy.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{policy.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      policy.active
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {policy.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{policy.description}</p>
                  
                  {/* Reglas de la política */}
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Reglas aplicadas:</p>
                    <div className="flex flex-wrap gap-2">
                      {policy.rules.map((rule) => (
                        <span
                          key={rule.id}
                          className="px-3 py-1 rounded-md text-xs bg-muted border"
                        >
                          {rule.action === 'allow' ? '✅' : '❌'} Atributo: {rule.attribute}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-4 ml-4">
                  <Switch
                    checked={policy.active}
                    onCheckedChange={(checked) => onTogglePolicy(policy.id, checked)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditPolicy(policy)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {policies.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              No hay políticas de seguridad configuradas
            </p>
            <Button variant="outline" className="mt-4" onClick={onCreatePolicy}>
              Crear primera política
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
