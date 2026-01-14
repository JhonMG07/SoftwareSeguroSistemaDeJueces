"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, MoreHorizontal, Power, Shield, UserPlus } from "lucide-react"
import type { SystemUser } from "@/lib/types/supreme-court"

interface UserListProps {
  users: SystemUser[]
  onCreateUser: () => void
  onEditUser: (user: SystemUser) => void
  onToggleStatus: (userId: string, currentStatus: "active" | "inactive" | "suspended") => void
}

export function UserList({
  users,
  onCreateUser,
  onEditUser,
  onToggleStatus,
}: UserListProps) {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-slate-900 text-white hover:bg-slate-800">Administrador</Badge>
      case "judge":
        return <Badge variant="secondary">Juez</Badge>
      case "secretary":
        return <Badge variant="outline">Secretario</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Activo
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
            Inactivo
          </Badge>
        )
      case "suspended":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Suspendido
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Usuarios del Sistema</h2>
          <p className="text-muted-foreground">Gestionar jueces y secretarios</p>
        </div>
        <Button onClick={onCreateUser}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Atributos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.fullName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>{user.department}</TableCell>
                <TableCell>{getStatusBadge(user.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span className="text-xs">{user.attributes?.length || 0}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onEditUser(user)}
                      disabled={user.email === 'admin@cortesupremacr.go.ec'}
                      title={user.email === 'admin@cortesupremacr.go.ec' ? 'No se puede editar el super admin principal' : 'Editar usuario'}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" 
                      size="icon"
                      className={user.status === 'active' ? 'text-green-600' : 'text-slate-400'}
                      onClick={() => onToggleStatus(
                        user.id, 
                        user.status === 'active' ? 'inactive' : 'active'
                      )}
                      disabled={user.email === 'admin@cortesupremacr.go.ec'}
                      title={user.email === 'admin@cortesupremacr.go.ec' ? 'No se puede desactivar el super admin principal' : 'Cambiar estado'}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
