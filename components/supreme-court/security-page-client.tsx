"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AttributesManager } from "@/components/supreme-court/attributes-manager"
import { UsersAttributeManager } from "@/components/supreme-court/users-attribute-manager"
import { AttributeFormDialog } from "@/components/supreme-court/attribute-form-dialog"
import { ArrowLeft } from "lucide-react"
import type { ABACAttribute } from "@/lib/types/supreme-court"
import { toast } from "sonner"

interface SecurityPageClientProps {
  initialAttributes: ABACAttribute[]
}

export function SecurityPageClient({ initialAttributes }: SecurityPageClientProps) {
  const router = useRouter()
  const [attributes, setAttributes] = useState<ABACAttribute[]>(initialAttributes)
  const [isAttributeDialogOpen, setIsAttributeDialogOpen] = useState(false)
  const [editingAttribute, setEditingAttribute] = useState<ABACAttribute | null>(null)

  const refreshAttributes = () => {
    router.refresh()
  }

  const handleCreateAttribute = async (data: Partial<ABACAttribute>) => {
    try {
      const res = await fetch('/api/admin/abac/attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al crear atributo')
      }

      toast.success('Atributo creado exitosamente')
      setIsAttributeDialogOpen(false)
      refreshAttributes()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleUpdateAttribute = async (data: Partial<ABACAttribute>) => {
    if (!editingAttribute) return

    try {
      const res = await fetch(`/api/admin/abac/attributes/${editingAttribute.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al actualizar atributo')
      }

      toast.success('Atributo actualizado exitosamente')
      setEditingAttribute(null)
      setIsAttributeDialogOpen(false)
      refreshAttributes()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDeleteAttribute = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este atributo?')) return

    try {
      const res = await fetch(`/api/admin/abac/attributes/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al eliminar atributo')
      }

      toast.success('Atributo eliminado exitosamente')
      refreshAttributes()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleEditAttribute = (attr: ABACAttribute) => {
    setEditingAttribute(attr)
    setIsAttributeDialogOpen(true)
  }

  const handleOpenAttributeDialog = () => {
    setEditingAttribute(null)
    setIsAttributeDialogOpen(true)
  }

  return (
    <>
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/supreme-court')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Configuración de Seguridad ABAC
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Gestiona atributos ABAC y asignaciones de usuarios
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="attributes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="attributes">Atributos ABAC</TabsTrigger>
            <TabsTrigger value="user-attributes">Asignar a Usuarios</TabsTrigger>
          </TabsList>

          <TabsContent value="attributes" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Define atributos de seguridad para control de acceso
              </p>
              <Button onClick={handleOpenAttributeDialog}>
                Crear Atributo
              </Button>
            </div>
            <AttributesManager
              attributes={attributes}
              onCreateAttribute={handleOpenAttributeDialog}
              onEditAttribute={handleEditAttribute}
              onDeleteAttribute={handleDeleteAttribute}
            />
          </TabsContent>

          <TabsContent value="user-attributes">
            <UsersAttributeManager />
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <AttributeFormDialog
        open={isAttributeDialogOpen}
        onClose={() => {
          setIsAttributeDialogOpen(false)
          setEditingAttribute(null)
        }}
        onSubmit={editingAttribute ? handleUpdateAttribute : handleCreateAttribute}
        editAttribute={editingAttribute}
      />
    </>
  )
}
