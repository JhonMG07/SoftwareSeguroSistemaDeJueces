"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Eye, UserPlus, AlertTriangle } from "lucide-react"
import type { JudicialCase, CaseStatus, CasePriority, Classification } from "@/lib/types/supreme-court"

interface CaseListProps {
  cases: JudicialCase[]
  onCreateCase: () => void
  onViewCase: (caseItem: JudicialCase) => void
  onAssignCase: (caseItem: JudicialCase) => void
  loading?: boolean
}

export function CaseList({ cases, onCreateCase, onViewCase, onAssignCase, loading }: CaseListProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")

  // Filtrar casos
  const filteredCases = cases.filter(c => {
    const matchesSearch = (c.caseNumber?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (c.title?.toLowerCase() || '').includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || c.status === statusFilter
    const matchesPriority = priorityFilter === "all" || c.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusBadge = (status: CaseStatus) => {
    // Map English DB values to Spanish labels
    const config: Record<string, { className: string; label: string }> = {
      pending: { className: "bg-slate-100 text-slate-800 border-slate-200", label: "Pendiente" },
      assigned: { className: "bg-blue-100 text-blue-800 border-blue-200", label: "Asignado" },
      in_progress: { className: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "En Revisión" },
      resolved: { className: "bg-purple-100 text-purple-800 border-purple-200", label: "Dictaminado" },
      archived: { className: "bg-green-100 text-green-800 border-green-200", label: "Cerrado" }
    }

    const badgeConfig = config[status] || { className: "bg-slate-100 text-slate-800", label: status }

    return <Badge variant="outline" className={badgeConfig.className}>{badgeConfig.label}</Badge>
  }

  const getPriorityBadge = (priority: CasePriority) => {
    const colors: Record<CasePriority, string> = {
      low: "bg-slate-100 text-slate-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800"
    }
    const labels: Record<CasePriority, string> = {
      low: "Baja",
      medium: "Media",
      high: "Alta",
      urgent: "Urgente"
    }
    const color = colors[priority] || "bg-slate-100 text-slate-800"
    const label = labels[priority] || priority || "Media"
    return <Badge className={color}>{label}</Badge>
  }

  const getClassificationBadge = (classification: Classification) => {
    const colors: Record<Classification, string> = {
      public: "bg-green-100 text-green-800",
      confidential: "bg-yellow-100 text-yellow-800",
      secret: "bg-orange-100 text-orange-800",
      top_secret: "bg-red-100 text-red-800"
    }
    const labels: Record<Classification, string> = {
      public: "Público",
      confidential: "Confidencial",
      secret: "Secreto",
      top_secret: "Ultra Secreto"
    }
    const color = colors[classification] || "bg-slate-100 text-slate-800"
    const label = labels[classification] || classification || "Público"
    return <Badge className={color}>{label}</Badge>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Casos Judiciales</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Gestionar casos de la Suprema Corte</p>
        </div>
        <Button onClick={onCreateCase}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Caso
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número o título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="assigned">Asignado</SelectItem>
            <SelectItem value="in_progress">En Revisión</SelectItem>
            <SelectItem value="resolved">Dictaminado</SelectItem>
            <SelectItem value="archived">Cerrado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas las prioridades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las prioridades</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando casos...</div>
      ) : filteredCases.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No se encontraron casos</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número de Caso</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Clasificación</TableHead>
                <TableHead>Juez Asignado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.map((caseItem) => (
                <TableRow key={caseItem.id}>
                  <TableCell className="font-medium">{caseItem.caseNumber}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{caseItem.title}</TableCell>
                  <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                  <TableCell>{getPriorityBadge(caseItem.priority)}</TableCell>
                  <TableCell>{getClassificationBadge(caseItem.classification)}</TableCell>
                  <TableCell>
                    {caseItem.assignedJudge ? (
                      <span className="text-sm">{caseItem.assignedJudge.fullName}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => onViewCase(caseItem)} title="Ver detalles">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onAssignCase(caseItem)}
                        disabled={
                          caseItem.status === 'archived' ||
                          caseItem.status === 'resolved' ||
                          !!caseItem.assignedJudge  // Deshabilitar si ya está asignado
                        }
                        title={caseItem.assignedJudge ? "Caso ya asignado" : "Asignar juez"}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        Mostrando {filteredCases.length} de {cases.length} casos
      </div>
    </div>
  )
}
