"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CreateCaseForm, CasePriority, Classification, CaseType } from "@/lib/types/supreme-court"

interface CaseFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateCaseForm) => void
}

const INITIAL_DATA: CreateCaseForm = {
  caseNumber: "",
  title: "",
  description: "",
  caseType: "civil",
  priority: "medium",
  classification: "public",
  deadline: undefined
}

export function CaseFormDialog({ open, onClose, onSubmit }: CaseFormDialogProps) {
  const [formData, setFormData] = useState<CreateCaseForm>(INITIAL_DATA)

  useEffect(() => {
    if (!open) {
      setFormData(INITIAL_DATA)
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Establecer automáticamente la fecha de hoy + 1 año como deadline
    const deadlineDate = new Date()
    deadlineDate.setFullYear(deadlineDate.getFullYear() + 1)
    
    const dataWithDeadline = {
      ...formData,
      deadline: deadlineDate
    }
    onSubmit(dataWithDeadline)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Caso</DialogTitle>
          <DialogDescription>
            Registrar un nuevo caso judicial en el sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="caseNumber">Número de Caso *</Label>
            <Input
              id="caseNumber"
              placeholder="SC-2024-001"
              value={formData.caseNumber}
              onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título del Caso *</Label>
            <Input
              id="title"
              placeholder="Recurso de Amparo - Derechos Constitucionales"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <textarea
              id="description"
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Descripción detallada del caso..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="caseType">Tipo de Caso *</Label>
              <Select
                value={formData.caseType}
                onValueChange={(value) => setFormData({ ...formData, caseType: value as CaseType })}
              >
                <SelectTrigger id="caseType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="civil">Civil</SelectItem>
                  <SelectItem value="penal">Penal</SelectItem>
                  <SelectItem value="laboral">Laboral</SelectItem>
                  <SelectItem value="administrativo">Administrativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as CasePriority })}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="classification">Clasificación de Seguridad *</Label>
              <Select
                value={formData.classification}
                onValueChange={(value) => setFormData({ ...formData, classification: value as Classification })}
              >
                <SelectTrigger id="classification">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Público</SelectItem>
                  <SelectItem value="confidential">Confidencial</SelectItem>
                  <SelectItem value="secret">Secreto</SelectItem>
                  <SelectItem value="top_secret">Ultra Secreto</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Solo usuarios con clearance adecuado podrán acceder
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Crear Caso
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
