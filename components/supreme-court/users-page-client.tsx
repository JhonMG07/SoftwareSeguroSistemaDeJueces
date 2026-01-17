"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserList } from "@/components/supreme-court/user-list"
import { UserFormDialog } from "@/components/supreme-court/user-form-dialog"
import { ArrowLeft } from "lucide-react"
import type { SystemUser, CreateUserForm } from "@/lib/types/supreme-court"
import { DEFAULT_ABAC_ATTRIBUTES } from "@/lib/data/abac-attributes"
import { toast } from "sonner"

// Tipo para usuario en lista (sin datos sensibles)
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

interface UsersPageClientProps {
  initialUsers: AnonymousUser[]
  currentUserName: string
}

export function UsersPageClient({ initialUsers, currentUserName }: UsersPageClientProps) {
  const router = useRouter()
  const [users, setUsers] = useState<AnonymousUser[]>(initialUsers)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null)

  const refreshUsers = () => {
    router.refresh()
  }

  const handleCreateUser = async (data: CreateUserForm) => {
    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await res.json()
      
      if (!res.ok) {
        throw new Error(result.error || 'Error al crear usuario')
      }

      toast.success('Usuario creado exitosamente')
      setIsDialogOpen(false)
      refreshUsers()
    } catch (error: any) {
      toast.error(error.message || 'Error al crear usuario')
    }
  }

  const handleEditUser = async (user: AnonymousUser) => {
    try {
      // Cargar datos completos del usuario (descencriptados) desde la API
      const res = await fetch(`/api/admin/users/${user.id}`)
      
      if (!res.ok) {
        throw new Error('Error al cargar datos del usuario')
      }

      const { user: fullUser } = await res.json()
      
      setEditingUser(fullUser)
      setIsDialogOpen(true)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar usuario')
    }
  }

  const handleUpdateUser = async (data: CreateUserForm) => {
    if (!editingUser) return

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al actualizar usuario')
      }

      toast.success('Usuario actualizado exitosamente')
      setEditingUser(null)
      setIsDialogOpen(false)
      refreshUsers()
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar usuario')
    }
  }

  const handleToggleStatus = async (userId: string, currentStatus: 'active' | 'inactive' | 'suspended') => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al cambiar estado')
      }

      toast.success(`Usuario ${newStatus === 'active' ? 'activado' : 'desactivado'} exitosamente`)
      refreshUsers()
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar estado del usuario')
    }
  }

  const handleOpenDialog = () => {
    setEditingUser(null)
    setIsDialogOpen(true)
  }

  return (
    <>
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/supreme-court')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Usuarios</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Administra usuarios y sus permisos
                </p>
              </div>
            </div>
            <Button onClick={handleOpenDialog}>
              Crear Usuario
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <UserList
          users={users}
          onCreateUser={handleOpenDialog}
          onEditUser={handleEditUser}
          onToggleStatus={handleToggleStatus}
        />
      </main>

      {/* Dialog */}
      <UserFormDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setEditingUser(null)
        }}
        onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
        editUser={editingUser}
      />
    </>
  )
}
