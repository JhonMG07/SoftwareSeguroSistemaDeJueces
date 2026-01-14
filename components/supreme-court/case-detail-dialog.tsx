"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, AlertCircle } from "lucide-react"
import type { JudicialCase } from "@/lib/types/supreme-court"

interface CaseDetailDialogProps {
  open: boolean
  onClose: () => void
  caseItem: JudicialCase | null
}

export function CaseDetailDialog({ open, onClose, caseItem }: CaseDetailDialogProps) {
  if (!caseItem) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Caso</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="border-b pb-4">
            <h3 className="text-xl font-semibold mb-2">{caseItem.title}</h3>
            <p className="text-sm text-muted-foreground">Caso: {caseItem.caseNumber}</p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Estado</p>
              <p className="text-sm mt-1">
                <Badge>{caseItem.status}</Badge>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo</p>
              <p className="text-sm mt-1 capitalize">
                <Badge variant="outline">{caseItem.caseType}</Badge>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Prioridad</p>
              <p className="text-sm mt-1">
                <Badge>{caseItem.priority}</Badge>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Clasificación</p>
              <p className="text-sm mt-1">
                <Badge>{caseItem.classification}</Badge>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Creado</p>
              <p className="text-sm mt-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(caseItem.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Descripción</p>
            <p className="text-sm leading-relaxed bg-muted p-4 rounded-md">
              {caseItem.description}
            </p>
          </div>

          {/* Assigned Judge */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Juez Asignado</p>
            {caseItem.assignedJudge ? (
              <div className="flex items-center gap-2 bg-muted p-3 rounded-md">
                <User className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">{caseItem.assignedJudge.fullName}</p>
                  <p className="text-xs text-muted-foreground">{caseItem.assignedJudge.email}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground p-3 bg-muted rounded-md">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">Sin asignar</p>
              </div>
            )}
          </div>

          {/* Deadline */}
          {caseItem.deadline && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Fecha Límite</p>
              <p className="text-sm flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(caseItem.deadline).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
