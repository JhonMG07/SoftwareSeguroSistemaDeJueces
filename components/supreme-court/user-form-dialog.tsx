"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { SystemUser, CreateUserForm, ABACAttribute } from "@/lib/types/supreme-court"
import { Wand2 } from "lucide-react"

interface UserFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateUserForm) => void
  editUser?: SystemUser | null
}

const INITIAL_DATA: CreateUserForm = {
  email: "",
  fullName: "",
  role: "secretary",
  attributes: [],
  department: "",
  phone: "", // Mantener vacío para compatibilidad de tipos
}

// Mapeo de roles a IDs de atributos por defecto
const ROLE_DEFAULT_ATTRIBUTES: Record<string, string[]> = {
  judge: ['attr-001', 'attr-002', 'attr-007', 'attr-008'],
  secretary: ['attr-001', 'attr-003', 'attr-004', 'attr-006'],
  auditor: ['attr-001', 'attr-006', 'attr-010']
}

export function UserFormDialog({
  open,
  onClose,
  onSubmit,
  editUser,
}: UserFormDialogProps) {
  const [formData, setFormData] = useState<CreateUserForm>(INITIAL_DATA)
  const [availableAttributes, setAvailableAttributes] = useState<ABACAttribute[]>([])
  const [loadingAttributes, setLoadingAttributes] = useState(false)

  // Cargar lista de atributos disponibles desde el backend
  useEffect(() => {
    if (open) {
      setLoadingAttributes(true)
      fetch('/api/admin/abac/attributes')
        .then(res => res.json())
        .then(data => {
          if (data.attributes) {
            setAvailableAttributes(data.attributes)
          }
        })
        .catch(err => console.error("Error cargando atributos:", err))
        .finally(() => setLoadingAttributes(false))
    }
  }, [open])

  useEffect(() => {
    if (editUser) {
      setFormData({
        email: editUser.email,
        fullName: editUser.fullName,
        role: editUser.role,
        attributes: editUser.attributes?.map((a) => a.id) || [],
        department: editUser.department,
        phone: editUser.phone,
      })
    } else {
      setFormData({
        ...INITIAL_DATA,
        // Pre-seleccionar atributos para el rol por defecto (secretary)
        attributes: ROLE_DEFAULT_ATTRIBUTES['secretary'] || []
      })
    }
  }, [editUser, open])

  const handleRoleChange = (role: string) => {
    // Al cambiar rol, si es nuevo usuario, actualizar atributos sugeridos
    if (!editUser) {
      const defaultAttrs = ROLE_DEFAULT_ATTRIBUTES[role] || []
      setFormData({
        ...formData,
        role,
        attributes: defaultAttrs
      })
    } else {
      setFormData({ ...formData, role })
    }
  }

  const generateRandomEmail = () => {
    const randomString = Math.random().toString(36).substring(2, 8)
    const email = `usuario_${randomString}@supremacorte.gob.ec`
    setFormData(prev => ({ ...prev, email }))
  }

  // Generar email al abrir dialogo si es nuevo
  useEffect(() => {
    if (open && !editUser && !formData.email) {
      generateRandomEmail()
    }
  }, [open, editUser])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{editUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
          <DialogDescription>
            {editUser
              ? "Modifica los datos del usuario y sus permisos."
              : "Crea un nuevo usuario con credenciales generadas automáticamente."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Solo mostrar campos sensibles al CREAR, no al EDITAR */}
            {!editUser && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Nombre Completo</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Juan Pérez"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select
                      value={formData.role}
                      onValueChange={handleRoleChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="judge">Juez</SelectItem>
                        <SelectItem value="secretary">Secretario</SelectItem>
                        <SelectItem value="auditor">Auditor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email (Generado Automáticamente)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      placeholder="@supremacorte.gob.ec"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={generateRandomEmail}
                      title="Generar nuevo email"
                    >
                      <Wand2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Departamento - SIEMPRE visible */}
            <div className="grid gap-2">
              <Label htmlFor="department">Departamento</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Seleccione departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Penal">Penal</SelectItem>
                  <SelectItem value="Civil">Civil</SelectItem>
                  <SelectItem value="Laboral">Laboral</SelectItem>
                  <SelectItem value="Administrativo">Administrativo</SelectItem>
                  <SelectItem value="Auditoría">Auditoría</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Atributos y Permisos</Label>
                <span className="text-xs text-muted-foreground mr-2">
                  (Sugeridos por rol automáticamente)
                </span>
              </div>
              <div className="rounded-md border p-4">
                <ScrollArea className="h-[200px] pr-4">
                  {loadingAttributes ? (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      Cargando atributos...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(
                        availableAttributes.reduce((acc, attr) => {
                          const category = attr.category
                          if (!acc[category]) acc[category] = []
                          acc[category].push(attr)
                          return acc
                        }, {} as Record<string, typeof availableAttributes>)
                      ).map(([category, attributes]) => (
                        <div key={category}>
                          <h4 className="mb-2 font-medium capitalize text-sm text-muted-foreground">
                            {category === 'permission' ? 'Permisos' :
                              category === 'authorization' ? 'Autorizaciones' : 'Restricciones'}
                          </h4>
                          <div className="grid gap-2 pl-2">
                            {attributes.map((attr) => (
                              <div key={attr.id} className="flex items-start space-x-2">
                                <Checkbox
                                  id={attr.id}
                                  checked={formData.attributes.includes(attr.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setFormData({
                                        ...formData,
                                        attributes: [...formData.attributes, attr.id],
                                      })
                                    } else {
                                      setFormData({
                                        ...formData,
                                        attributes: formData.attributes.filter(
                                          (id) => id !== attr.id
                                        ),
                                      })
                                    }
                                  }}
                                />
                                <div className="grid gap-1.5 leading-none">
                                  <label
                                    htmlFor={attr.id}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {attr.name}
                                  </label>
                                  <p className="text-xs text-muted-foreground">
                                    {attr.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {editUser ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
