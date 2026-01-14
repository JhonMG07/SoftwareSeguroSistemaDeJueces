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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Clock } from "lucide-react"

interface ABACAttribute {
  id: string
  name: string
  category: string
  description: string
  level: number
}

interface UserAttribute {
  id: string
  attribute_id: string
  granted_at: string
  expires_at: string | null
  reason: string | null
  abac_attributes: ABACAttribute
  granted_by_profile?: {
    real_name: string
  }
}

interface AttributeAssignmentDialogProps {
  open: boolean
  onClose: () => void
  userId: string
  userName: string
  onAssignmentChanged: () => void
}

export function AttributeAssignmentDialog({
  open,
  onClose,
  userId,
  userName,
  onAssignmentChanged
}: AttributeAssignmentDialogProps) {
  const [availableAttributes, setAvailableAttributes] = useState<ABACAttribute[]>([])
  const [currentAttributes, setCurrentAttributes] = useState<UserAttribute[]>([])
  const [selectedAttributeId, setSelectedAttributeId] = useState<string>("")
  const [expiresAt, setExpiresAt] = useState<string>("")
  const [reason, setReason] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open, userId])

  const fetchData = async () => {
    setLoadingData(true)
    try {
      // Cargar atributos disponibles
      const attrsRes = await fetch('/api/admin/abac/attributes')
      const attrsData = await attrsRes.json()
      
      // Cargar atributos actuales del usuario
      const userAttrsRes = await fetch(`/api/admin/users/${userId}/attributes`)
      const userAttrsData = await userAttrsRes.json()

      if (attrsRes.ok) {
        setAvailableAttributes(attrsData.attributes || [])
      }

      if (userAttrsRes.ok) {
        setCurrentAttributes(userAttrsData.attributes || [])
      }
    } catch (error) {
      console.error('[AttributeAssignment] Error loading data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedAttributeId) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attribute_id: selectedAttributeId,
          expires_at: expiresAt || null,
          reason: reason || null
        })
      })

      const data = await res.json()

      if (res.ok) {
        // Limpiar form
        setSelectedAttributeId("")
        setExpiresAt("")
        setReason("")
        
        // Recargar atributos
        await fetchData()
        onAssignmentChanged()
      } else {
        alert('Error al asignar atributo: ' + data.error)
      }
    } catch (error) {
      console.error('[AttributeAssignment] Error assigning:', error)
      alert('Error al asignar atributo')
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (assignmentId: string) => {
    if (!confirm('¿Estás seguro de revocar este atributo?')) return

    try {
      const res = await fetch(
        `/api/admin/users/${userId}/attributes/${assignmentId}`,
        { method: 'DELETE' }
      )

      if (res.ok) {
        await fetchData()
        onAssignmentChanged()
      } else {
        const data = await res.json()
        alert('Error al revocar: ' + data.error)
      }
    } catch (error) {
      console.error('[AttributeAssignment] Error revoking:', error)
      alert('Error al revocar atributo')
    }
  }

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'permission':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'authorization':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'restriction':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'permission': return 'Permiso'
      case 'authorization': return 'Autorización'
      case 'restriction': return 'Restricción'
      default: return category
    }
  }

  const isAttributeAssigned = (attrId: string) => {
    return currentAttributes.some(ua => ua.attribute_id === attrId)
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Atributos ABAC</DialogTitle>
          <DialogDescription>
            Usuario: <span className="font-semibold">{userName}</span>
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="py-8 text-center text-muted-foreground">
            Cargando...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Atributos actuales */}
            <div>
              <h3 className="text-sm font-semibold mb-3">
                Atributos Asignados ({currentAttributes.length})
              </h3>
              
              {currentAttributes.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                  Sin atributos asignados
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                  {currentAttributes.map((ua) => (
                    <div
                      key={ua.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {ua.abac_attributes.name}
                          </span>
                          <Badge className={getCategoryBadgeColor(ua.abac_attributes.category)}>
                            {getCategoryLabel(ua.abac_attributes.category)}
                          </Badge>
                          <Badge variant="outline">Nivel {ua.abac_attributes.level}</Badge>
                          {ua.expires_at && (
                            <Badge variant={isExpired(ua.expires_at) ? "destructive" : "secondary"}>
                              <Clock className="h-3 w-3 mr-1" />
                              {isExpired(ua.expires_at) ? 'Expirado' : 'Temporal'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {ua.abac_attributes.description}
                        </p>
                        {ua.reason && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Razón: {ua.reason}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRevoke(ua.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Asignar nuevo atributo */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold mb-3">Asignar Nuevo Atrib uto</h3>
              
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="attribute">Atributo</Label>
                  <Select
                    value={selectedAttributeId}
                    onValueChange={setSelectedAttributeId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un atributo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Permisos</SelectLabel>
                        {availableAttributes
                          .filter(a => a.category === 'permission' && !isAttributeAssigned(a.id))
                          .map(attr => (
                            <SelectItem key={attr.id} value={attr.id}>
                              {attr.name} (Nivel {attr.level})
                            </SelectItem>
                          ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Autorizaciones</SelectLabel>
                        {availableAttributes
                          .filter(a => a.category === 'authorization' && !isAttributeAssigned(a.id))
                          .map(attr => (
                            <SelectItem key={attr.id} value={attr.id}>
                              {attr.name} (Nivel {attr.level})
                            </SelectItem>
                          ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Restricciones</SelectLabel>
                        {availableAttributes
                          .filter(a => a.category === 'restriction' && !isAttributeAssigned(a.id))
                          .map(attr => (
                            <SelectItem key={attr.id} value={attr.id}>
                              {attr.name}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="expires">Fecha de Expiración (Opcional)</Label>
                  <Input
                    id="expires"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Deja vacío para acceso permanente
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="reason">Justificación (Opcional)</Label>
                  <Input
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ej: Asignado para proyecto especial"
                  />
                </div>

                <Button
                  onClick={handleAssign}
                  disabled={!selectedAttributeId || loading}
                  className="w-full"
                >
                  {loading ? 'Asignando...' : 'Asignar Atributo'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
