import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Shield, Key, Ban } from "lucide-react";
import type { ABACAttribute } from "@/lib/types/supreme-court";

interface AttributesManagerProps {
  attributes: ABACAttribute[];
  onCreateAttribute: () => void;
  onEditAttribute: (attribute: ABACAttribute) => void;
  onDeleteAttribute: (attributeId: string) => void;
}

export function AttributesManager({
  attributes,
  onCreateAttribute,
  onEditAttribute,
  onDeleteAttribute,
}: AttributesManagerProps) {
  // Agrupar atributos por categoría
  const groupedAttributes = {
    permission: attributes.filter(a => a.category === 'permission'),
    authorization: attributes.filter(a => a.category === 'authorization'),
    restriction: attributes.filter(a => a.category === 'restriction'),
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'permission':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'authorization':
        return <Key className="h-4 w-4 text-amber-600" />;
      case 'restriction':
        return <Ban className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'permission':
        return 'Permisos';
      case 'authorization':
        return 'Autorizaciones';
      case 'restriction':
        return 'Restricciones';
      default:
        return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'permission':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'authorization':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
      case 'restriction':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Atributos ABAC</h2>
          <p className="text-sm text-muted-foreground">Gestionar atributos de control de acceso</p>
        </div>
        <Button onClick={onCreateAttribute}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Atributo
        </Button>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permisos</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedAttributes.permission.length}</div>
            <p className="text-xs text-muted-foreground">Atributos de permiso del sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Autorizaciones</CardTitle>
            <Key className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedAttributes.authorization.length}</div>
            <p className="text-xs text-muted-foreground">Niveles de autorización</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restricciones</CardTitle>
            <Ban className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedAttributes.restriction.length}</div>
            <p className="text-xs text-muted-foreground">Restricciones de acceso</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de atributos */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-sm">Atributo</th>
                  <th className="text-left p-4 font-medium text-sm">Categoría</th>
                  <th className="text-left p-4 font-medium text-sm">Nivel</th>
                  <th className="text-left p-4 font-medium text-sm">Descripción</th>
                  <th className="text-right p-4 font-medium text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {attributes.map((attribute) => (
                  <tr key={attribute.id} className="hover:bg-muted/30">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(attribute.category)}
                        <span className="font-medium">{attribute.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(attribute.category)}`}>
                        {getCategoryLabel(attribute.category)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">Nivel {attribute.level}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">{attribute.description}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditAttribute(attribute)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteAttribute(attribute.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
