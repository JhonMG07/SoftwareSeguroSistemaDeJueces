"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Shield, User2, Users } from "lucide-react"
import { AttributeAssignmentDialog } from "./attribute-assignment-dialog"
import type { SystemUser } from "@/lib/types/supreme-court"
import { getUserPseudonym, getPseudonymInitials, getUserColor } from "@/lib/utils/pseudonym"

// Tipo para usuario anónimo en lista
interface AnonymousUser {
  id: string
  role: string
  status: "active" | "inactive" | "suspended"
  department: string
  createdAt: string | Date
  attributes: Array<{
    id: string
    name: string
    category: string
    description: string
    level: number
  }>
}

interface UsersAttributeManagerProps {
  onRefresh?: () => void
}

export function UsersAttributeManager({ onRefresh }: UsersAttributeManagerProps) {
  const [users, setUsers] = useState<AnonymousUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('[UsersAttributeManager] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleManageAttributes = async (user: AnonymousUser) => {
    try {
      // Cargar datos completos del usuario para el diálogo
      const res = await fetch(`/api/admin/users/${user.id}`)
      if (!res.ok) {
        console.error('Error loading user data')
        return
      }
      const { user: fullUser } = await res.json()
      setSelectedUser(fullUser)
      setDialogOpen(true)
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedUser(null)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-purple-100 text-purple-800">Super Admin</Badge>
      case 'judge':
        return <Badge className="bg-blue-100 text-blue-800">Juez</Badge>
      case 'secretary':
        return <Badge className="bg-green-100 text-green-800">Secretario</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  // Filtrar por pseudónimo o departamento (ya no tenemos acceso a nombre real ni email)
  const filteredUsers = users.filter(user => {
    const pseudonym = getUserPseudonym(user.id, user.role)
    return pseudonym.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.department?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Asignar Atributos a Usuarios
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Gestiona permisos ABAC por usuario
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por pseudónimo o departamento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-slate-950 rounded-lg border">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-slate-100 mb-4"></div>
            <p>Cargando usuarios...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay usuarios cargados</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredUsers.map((user) => {
              const pseudonym = getUserPseudonym(user.id, user.role)
              const initials = getPseudonymInitials(pseudonym)
              const color = getUserColor(user.id)
              
              return (
                <div
                  key={user.id}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10" style={{ backgroundColor: color }}>
                      <AvatarFallback className="text-white text-sm font-semibold" style={{ backgroundColor: color }}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {pseudonym}
                        </span>
                        {getRoleBadge(user.role)}
                        {user.status !== 'active' && (
                          <Badge variant="destructive">Inactivo</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {user.department || 'Sin departamento'}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManageAttributes(user)}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Gestionar Atributos
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Attribution Dialog */}
      {selectedUser && (
        <AttributeAssignmentDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          userId={selectedUser.id}
          userName={selectedUser.fullName}
          onAssignmentChanged={() => {
            onRefresh?.()
          }}
        />
      )}
    </div>
  )
}
