"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AttributesManager } from "@/components/supreme-court/attributes-manager"
import { UsersAttributeManager } from "@/components/supreme-court/users-attribute-manager"
import { AttributeFormDialog } from "@/components/supreme-court/attribute-form-dialog"
// Política de seguridad - Ocultado por ahora (futuro)
// import { SecurityPolicies } from "@/components/supreme-court/security-policies"
// import { PolicyFormDialog } from "@/components/supreme-court/policy-form-dialog"
import { ClientNavbar } from "@/components/client-navbar"
import { ArrowLeft } from "lucide-react"
import type { ABACAttribute } from "@/lib/types/supreme-court"
// import type { SecurityPolicy } from "@/lib/types/supreme-court"

interface SecurityPageProps {
  displayName: string;
}

export default function SecurityPage({ displayName = "Usuario" }: SecurityPageProps) {
  const router = useRouter()
  const [attributes, setAttributes] = useState<ABACAttribute[]>([])
  // const [policies, setPolicies] = useState<SecurityPolicy[]>([]) // Ocultado
  const [isAttributeDialogOpen, setIsAttributeDialogOpen] = useState(false)
  const [editingAttribute, setEditingAttribute] = useState<ABACAttribute | null>(null)
  // const [isPolicyDialogOpen, setIsPolicyDialogOpen] = useState(false) // Ocultado
  // const [editingPolicy, setEditingPolicy] = useState<SecurityPolicy | null>(null) // Ocultado
  const [isLoading, setIsLoading] = useState(true)

  // Cargar datos iniciales
  useEffect(() => {
    fetchAttributes()
    // fetchPolicies() // Ocultado
  }, [])

  const fetchAttributes = async () => {
    try {
      const res = await fetch('/api/admin/abac/attributes')
      const data = await res.json()
      if (res.ok) {
        setAttributes(data.attributes)
      } else {
        console.error('[Security] Error fetching attributes:', data.error)
      }
    } catch (error) {
      console.error('[Security] Error fetching attributes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // POLÍTICAS OCULTADAS - Futuro
  /*
  const fetchPolicies = async () => {
    try {
      const res = await fetch('/api/admin/abac/policies')
      const data = await res.json()
      if (res.ok) {
        setPolicies(data.policies)
      } else {
        console.error('[Security] Error fetching policies:', data.error)
      }
    } catch (error) {
      console.error('[Security] Error fetching policies:', error)
    }
  }
  */

  const handleCreateAttribute = async (data: Omit<ABACAttribute, "id">) => {
    try {
      const res = await fetch('/api/admin/abac/attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await res.json()
      
      if (res.ok) {
        setAttributes([...attributes, result.attribute])
        console.log("[Security] Atributo creado:", result.attribute.id)
      } else {
        console.error('[Security] Error creating attribute:', result.error)
        alert('Error al crear atributo: ' + result.error)
      }
    } catch (error) {
      console.error('[Security] Error creating attribute:', error)
      alert('Error al crear atributo')
    }
  }

  const handleEditAttribute = async (data: Omit<ABACAttribute, "id">) => {
    if (!editingAttribute) return

    try {
      const res = await fetch(`/api/admin/abac/attributes/${editingAttribute.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await res.json()
      
      if (res.ok) {
        const updatedAttributes = attributes.map((attr) =>
          attr.id === editingAttribute.id ? result.attribute : attr
        )
        setAttributes(updatedAttributes)
        console.log("[Security] Atributo actualizado:", editingAttribute.id)
        setEditingAttribute(null)
      } else {
        console.error('[Security] Error updating attribute:', result.error)
        alert('Error al actualizar atributo: ' + result.error)
      }
    } catch (error) {
      console.error('[Security] Error updating attribute:', error)
      alert('Error al actualizar atributo')
    }
  }

  const handleDeleteAttribute = async (attributeId: string) => {
    if (!confirm('¿Estás seguro de eliminar este atributo?')) return

    try {
      const res = await fetch(`/api/admin/abac/attributes/${attributeId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        setAttributes(attributes.filter((attr) => attr.id !== attributeId))
        console.log("[Security] Atributo eliminado:", attributeId)
      } else {
        const result = await res.json()
        console.error('[Security] Error deleting attribute:', result.error)
        alert('Error al eliminar atributo: ' + result.error)
      }
    } catch (error) {
      console.error('[Security] Error deleting attribute:', error)
      alert('Error al eliminar atributo')
    }
  }

  // POLÍTICAS OCULTADAS - Futuro
  /*
  const handleTogglePolicy = async (policyId: string, active: boolean) => {
    try {
      const policy = policies.find(p => p.id === policyId)
      if (!policy) return

      const res = await fetch(`/api/admin/abac/policies/${policyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: policy.name,
          description: policy.description,
          active
        })
      })
      
      if (res.ok) {
        const updatedPolicies = policies.map((p) => 
          (p.id === policyId ? { ...p, active } : p)
        )
        setPolicies(updatedPolicies)
        console.log("[Security] Política actualizada:", policyId, "activa:", active)
      } else {
        const result = await res.json()
        console.error('[Security] Error toggling policy:', result.error)
      }
    } catch (error) {
      console.error('[Security] Error toggling policy:', error)
    }
  }
  */

  // POLÍTICAS OCULTADAS - Futuro
  /*
  const handleCreatePolicy = async (data: any) => {
    try {
      const res = await fetch('/api/admin/abac/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await res.json()
      
      if (res.ok) {
        setPolicies([...policies, result.policy])
        console.log("[Security] Política creada:", result.policy.id)
      } else {
        console.error('[Security] Error creating policy:', result.error)
        alert('Error al crear política: ' + result.error)
      }
    } catch (error) {
      console.error('[Security] Error creating policy:', error)
      alert('Error al crear política')
    }
  }
  */

  // POLÍTICAS OCULTADAS - Futuro
  /*
  const handleEditPolicy = async (data: any) => {
    if (!editingPolicy) return

    try {
      const res = await fetch(`/api/admin/abac/policies/${editingPolicy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await res.json()
      
      if (res.ok) {
        const updatedPolicies = policies.map((policy) =>
          policy.id === editingPolicy.id 
            ? { ...policy, ...result.policy }
            : policy
        )
        setPolicies(updatedPolicies)
        console.log("[Security] Política actualizada:", editingPolicy.id)
        setEditingPolicy(null)
      } else {
        console.error('[Security] Error updating policy:', result.error)
        alert('Error al actualizar política: ' + result.error)
      }
    } catch (error) {
      console.error('[Security] Error updating policy:', error)
      alert('Error al actualizar política')
    }
  }
  */

  const handleOpenCreateAttributeDialog = () => {
    setEditingAttribute(null)
    setIsAttributeDialogOpen(true)
  }

  const handleOpenEditAttributeDialog = (attribute: ABACAttribute) => {
    setEditingAttribute(attribute)
    setIsAttributeDialogOpen(true)
  }

  // POLÍTICAS OCULTADAS - Futuro
  /*
  const handleOpenCreatePolicyDialog = () => {
    setEditingPolicy(null)
    setIsPolicyDialogOpen(true)
  }

  const handleOpenEditPolicyDialog = (policy: any) => {
    setEditingPolicy(policy)
    setIsPolicyDialogOpen(true)
  }
  */

  if (isLoading) {
    return (
      <>
        <ClientNavbar displayName={displayName} />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <ClientNavbar displayName={displayName} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Header */}
        <div className="border-b bg-white dark:bg-slate-950 shadow-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/supreme-court")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Parametrización de Seguridad
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Control de acceso basado en atributos (ABAC)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          <Tabs defaultValue="attributes" className="space-y-6">
            <TabsList className="bg-white dark:bg-slate-950">
              <TabsTrigger value="attributes">Atributos ABAC</TabsTrigger>
              {/* <TabsTrigger value="policies">Políticas de Seguridad</TabsTrigger> */}
              <TabsTrigger value="users">Asignar Atributos</TabsTrigger>
            </TabsList>

            <TabsContent value="attributes">
              <AttributesManager
                attributes={attributes}
                onCreateAttribute={handleOpenCreateAttributeDialog}
                onEditAttribute={handleOpenEditAttributeDialog}
                onDeleteAttribute={handleDeleteAttribute}
              />
            </TabsContent>

            {/* POLÍTICAS OCULTADAS - Futuro
            <TabsContent value="policies">
              <SecurityPolicies
                policies={policies}
                onCreatePolicy={handleOpenCreatePolicyDialog}
                onEditPolicy={handleOpenEditPolicyDialog}
                onTogglePolicy={handleTogglePolicy}
              />
            </TabsContent>
            */}

            <TabsContent value="users">
              <UsersAttributeManager
                onRefresh={() => {
                  // Opcionalmente recargar stats o algo
                  console.log('[Security] User attributes updated')
                }}
              />
            </TabsContent>
          </Tabs>
        </main>

        {/* Attribute Dialog */}
        <AttributeFormDialog
          open={isAttributeDialogOpen}
          onClose={() => {
            setIsAttributeDialogOpen(false)
            setEditingAttribute(null)
          }}
          onSubmit={editingAttribute ? handleEditAttribute : handleCreateAttribute}
          editAttribute={editingAttribute}
        />

        {/* Policy Dialog - OCULTADO 
        <PolicyFormDialog
          open={isPolicyDialogOpen}
          onClose={() => {
            setIsPolicyDialogOpen(false)
            setEditingPolicy(null)
          }}
          onSubmit={editingPolicy ? handleEditPolicy : handleCreatePolicy}
          editPolicy={editingPolicy}
        />
        */}
      </div>
    </>
  )
}
