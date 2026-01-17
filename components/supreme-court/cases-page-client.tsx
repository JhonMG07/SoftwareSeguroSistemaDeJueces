"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CaseList } from "@/components/supreme-court/case-list"
import { CaseFormDialog } from "@/components/supreme-court/case-form-dialog"
import { CaseDetailDialog } from "@/components/supreme-court/case-detail-dialog"
import { AssignCaseDialog } from "@/components/supreme-court/assign-case-dialog"
import { ArrowLeft } from "lucide-react"
import type { JudicialCase, CreateCaseForm, AssignCaseForm, SystemUser } from "@/lib/types/supreme-court"
import { toast } from "sonner"

interface CasesPageClientProps {
  initialCases: JudicialCase[]
  judges: Pick<SystemUser, 'id' | 'fullName' | 'email'>[]
  currentUserName: string
}

export function CasesPageClient({ initialCases, judges, currentUserName }: CasesPageClientProps) {
  const router = useRouter()
  const [cases, setCases] = useState<JudicialCase[]>(initialCases)
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedCase, setSelectedCase] = useState<JudicialCase | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [assigningCase, setAssigningCase] = useState<JudicialCase | null>(null)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)

  const refreshCases = () => {
    router.refresh() // Server-side refresh
  }

  const handleCreateCase = async (data: CreateCaseForm) => {
    try {
      const res = await fetch('/api/admin/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al crear caso')
      }

      toast.success('Caso creado exitosamente')
      setIsCreateDialogOpen(false)
      refreshCases()
    } catch (error: any) {
      console.error('Error creating case:', error)
      toast.error(error.message || 'Error al crear caso')
    }
  }

  const handleViewCase = (caseItem: JudicialCase) => {
    setSelectedCase(caseItem)
    setIsDetailDialogOpen(true)
  }

  const handleAssignCase = (caseItem: JudicialCase) => {
    setAssigningCase(caseItem)
    setIsAssignDialogOpen(true)
  }

  const handleSubmitAssignment = async (data: AssignCaseForm) => {
    try {
      const res = await fetch(`/api/admin/cases/${data.caseId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          judgeId: data.judgeId, 
          random: data.random,
          notes: data.notes 
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al asignar caso')
      }

      const result = await res.json()

      // Mostrar credenciales generadas
      if (result.credentials) {
        toast.success(
          <div>
            <p className="font-semibold">Caso asignado a {result.judgeName}</p>
            <p className="text-xs mt-1">Email: {result.credentials.email}</p>
            <p className="text-xs">Password: {result.credentials.password}</p>
            <p className="text-xs text-muted-foreground">Credenciales generadas correctamente</p>
          </div>,
          { duration: 10000 }
        )
      } else {
        toast.success(`Caso asignado exitosamente a ${result.judgeName || 'juez'}`)
      }

      setIsAssignDialogOpen(false)
      setAssigningCase(null)
      
      // Esperar un momento antes de recargar
      setTimeout(() => {
        refreshCases()
      }, 500)
      
    } catch (error: any) {
      console.error('Error assigning case:', error)
      toast.error(error.message || 'Error al asignar caso')
    }
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
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Casos</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Administra y asigna casos judiciales
                </p>
              </div>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Crear Caso
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <CaseList
          cases={cases}
          onCreateCase={() => setIsCreateDialogOpen(true)}
          onViewCase={handleViewCase}
          onAssignCase={handleAssignCase}
        />
      </main>

      {/* Dialogs */}
      <CaseFormDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateCase}
      />

      <CaseDetailDialog
        caseItem={selectedCase}
        open={isDetailDialogOpen}
        onClose={() => setIsDetailDialogOpen(false)}
      />

      <AssignCaseDialog
        caseItem={assigningCase}
        judges={judges}
        open={isAssignDialogOpen}
        onClose={() => setIsAssignDialogOpen(false)}
        onSubmit={handleSubmitAssignment}
      />
    </>
  )
}
