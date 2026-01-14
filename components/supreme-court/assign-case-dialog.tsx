"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { JudicialCase, AssignCaseForm, SystemUser } from "@/lib/types/supreme-court"

interface AssignCaseDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: AssignCaseForm) => void
  caseItem: JudicialCase | null
  judges: SystemUser[]
}

export function AssignCaseDialog({ open, onClose, onSubmit, caseItem, judges }: AssignCaseDialogProps) {
  const [selectedJudge, setSelectedJudge] = useState<string>("")
  const [randomAssign, setRandomAssign] = useState(false)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (!open) {
      setSelectedJudge("")
      setRandomAssign(false)
      setNotes("")
    } else if (caseItem?.assignedJudgeId) {
      setSelectedJudge(caseItem.assignedJudgeId)
    }
  }, [open, caseItem])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!caseItem) return
    if (!randomAssign && !selectedJudge) return

    onSubmit({
      caseId: caseItem.id,
      judgeId: randomAssign ? undefined : selectedJudge,
      random: randomAssign,
      notes
    })
    onClose()
  }

  if (!caseItem) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar Caso a Juez</DialogTitle>
          <DialogDescription>
            Caso: {caseItem.caseNumber} - {caseItem.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Checkbox de asignación aleatoria */}
          <div className="flex items-center space-x-2 p-3 border rounded-md bg-muted/30">
            <Checkbox 
              id="random-assign" 
              checked={randomAssign}
              onCheckedChange={(checked) => {
                setRandomAssign(checked as boolean)
                if (checked) {
                  setSelectedJudge("") // Limpiar selección manual
                }
              }}
            />
            <div className="flex-1">
              <Label htmlFor="random-assign" className="text-sm font-medium cursor-pointer">
                Asignar aleatoriamente
              </Label>
              <p className="text-xs text-muted-foreground">
                El sistema seleccionará un juez elegible automáticamente
              </p>
            </div>
          </div>

          {/* Selector manual (deshabilitado si random está activo) */}
          <div className="space-y-2">
            <Label htmlFor="judge">Seleccionar Juez Manualmente {!randomAssign && "*"}</Label>
            <Select 
              value={selectedJudge} 
              onValueChange={setSelectedJudge} 
              disabled={randomAssign}
            >
              <SelectTrigger id="judge" className={randomAssign ? "opacity-50" : ""}>
                <SelectValue placeholder="Seleccione un juez" />
              </SelectTrigger>
              <SelectContent>
                {judges.map((judge) => (
                  <SelectItem key={judge.id} value={judge.id}>
                    {judge.fullName} ({judge.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              La asignación será pseudonimizada en el Identity Vault
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!randomAssign && !selectedJudge}>
              {randomAssign ? "Asignar Aleatoriamente" : "Asignar Caso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
