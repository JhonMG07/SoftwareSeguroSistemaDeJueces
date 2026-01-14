"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserList } from "@/components/supreme-court/user-list"
import { UserFormDialog } from "@/components/supreme-court/user-form-dialog"
import { ArrowLeft } from "lucide-react"
import type { SystemUser, CreateUserForm } from "@/lib/types/supreme-court"
import { DEFAULT_ABAC_ATTRIBUTES } from "@/lib/data/abac-attributes"
import { ClientNavbar } from "@/components/client-navbar"
import { toast } from "sonner"

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('[UsersPage] Error fetching users:', error)
    } finally {
      setLoading(false)
    }
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

      // Recargar lista
      fetchUsers()
      toast.success(`Usuario creado con éxito!`, {
        description: `Password temporal: ${result.user.tempPassword}`,
        duration: 10000,
      })
      
    } catch (error: any) {
      console.error('Error creating user:', error)
      toast.error(error.message || 'Error al crear usuario')
    }
  }

  const handleEditUser = async (data: CreateUserForm) => {
    if (!editingUser) return

    try {
       const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Error al actualizar usuario')
      }

      fetchUsers()
      setEditingUser(null)
      toast.success('Usuario actualizado correctamente')

    } catch (error: any) {
       console.error('Error updating user:', error)
       toast.error(error.message || 'Error al actualizar usuario')
    }
  }

  const handleToggleStatus = async (userId: string, newStatus: "active" | "inactive" | "suspended") => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Error cambiando estado')
      }

      // Optimistic update o recarga
      fetchUsers()
      toast.success(`Estado actualizado a: ${newStatus === 'active' ? 'Activo' : newStatus === 'inactive' ? 'Inactivo' : 'Suspendido'}`)

    } catch (error: any) {
      console.error('Error status change:', error)
      toast.error(error.message || 'Error al cambiar estado')
    }
  }

  const handleOpenCreateDialog = () => {
    setEditingUser(null)
    setIsDialogOpen(true)
  }

  const handleOpenEditDialog = (user: SystemUser) => {
    setEditingUser(user)
    setIsDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ClientNavbar displayName="Administrador" />
      
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 shadow-sm border-b dark:border-slate-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/supreme-court")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Gestión de Usuarios</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Sistema de la Suprema Corte</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <UserList
          users={users}
          onCreateUser={handleOpenCreateDialog}
          onEditUser={handleOpenEditDialog}
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
        onSubmit={editingUser ? handleEditUser : handleCreateUser}
        editUser={editingUser}
      />
    </div>
  )
}
