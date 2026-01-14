import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { SecurityPolicy } from "@/lib/types/supreme-court";

interface PolicyFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<SecurityPolicy, "id" | "createdAt" | "updatedAt" | "rules">) => void;
  editPolicy?: SecurityPolicy | null;
}

export function PolicyFormDialog({
  open,
  onClose,
  onSubmit,
  editPolicy,
}: PolicyFormDialogProps) {
  const [formData, setFormData] = useState<Omit<SecurityPolicy, "id" | "createdAt" | "updatedAt" | "rules">>({
    name: "",
    description: "",
    active: true,
  });

  useEffect(() => {
    if (editPolicy) {
      setFormData({
        name: editPolicy.name,
        description: editPolicy.description,
        active: editPolicy.active,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        active: true,
      });
    }
  }, [editPolicy, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editPolicy ? "Editar Política" : "Nueva Política de Seguridad"}
            </DialogTitle>
            <DialogDescription>
              {editPolicy
                ? "Modifica los datos de la política"
                : "Crea una nueva política de seguridad para el sistema"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="policy-name">Nombre de la Política</Label>
              <Input
                id="policy-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ej: Acceso Jueces a Casos"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="policy-description">Descripción</Label>
              <Input
                id="policy-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe el propósito de esta política"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="policy-active">Activar política</Label>
                <p className="text-xs text-muted-foreground">
                  La política se aplicará inmediatamente
                </p>
              </div>
              <Switch
                id="policy-active"
                checked={formData.active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, active: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {editPolicy ? "Actualizar" : "Crear Política"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
