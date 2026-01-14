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
import type { ABACAttribute } from "@/lib/types/supreme-court";

interface AttributeFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ABACAttribute, "id">) => void;
  editAttribute?: ABACAttribute | null;
}

export function AttributeFormDialog({
  open,
  onClose,
  onSubmit,
  editAttribute,
}: AttributeFormDialogProps) {
  const [formData, setFormData] = useState<Omit<ABACAttribute, "id">>({
    name: "",
    category: "permission",
    description: "",
    level: 1,
  });

  useEffect(() => {
    if (editAttribute) {
      setFormData({
        name: editAttribute.name,
        category: editAttribute.category,
        description: editAttribute.description,
        level: editAttribute.level,
      });
    } else {
      setFormData({
        name: "",
        category: "permission",
        description: "",
        level: 1,
      });
    }
  }, [editAttribute, open]);

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
              {editAttribute ? "Editar Atributo" : "Nuevo Atributo ABAC"}
            </DialogTitle>
            <DialogDescription>
              {editAttribute
                ? "Modifica los datos del atributo"
                : "Crea un nuevo atributo de control de acceso"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre del Atributo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ej: Ver Casos"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(value: "permission" | "authorization" | "restriction") =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permission">Permiso</SelectItem>
                  <SelectItem value="authorization">Autorización</SelectItem>
                  <SelectItem value="restriction">Restricción</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="level">Nivel (1-5)</Label>
              <Input
                id="level"
                type="number"
                min="1"
                max="5"
                value={formData.level}
                onChange={(e) =>
                  setFormData({ ...formData, level: parseInt(e.target.value) })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Nivel de privilegio o restricción (1=básico, 5=máximo)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe el propósito del atributo"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {editAttribute ? "Actualizar" : "Crear Atributo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
