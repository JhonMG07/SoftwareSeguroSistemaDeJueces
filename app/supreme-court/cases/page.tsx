"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CaseList } from "@/components/supreme-court/case-list"
import { CaseFormDialog } from "@/components/supreme-court/case-form-dialog"
import { CaseDetailDialog } from "@/components/supreme-court/case-detail-dialog"
import { AssignCaseDialog } from "@/components/supreme-court/assign-case-dialog"
import { ArrowLeft } from "lucide-react"
import { ClientNavbar } from "@/components/client-navbar"
import type { JudicialCase, CreateCaseForm, AssignCaseForm, SystemUser } from "@/lib/types/supreme-court"
import { toast } from "sonner"

export default function CasesPage() {
  const router = useRouter()
  const [cases, setCases] = useState<JudicialCase[]>([])
  const [judges, setJudges] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedCase, setSelectedCase] = useState<JudicialCase | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [assigningCase, setAssigningCase] = useState<JudicialCase | null>(null)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)

  // Cargar casos
  const fetchCases = async () => {
    try {
      const res = await fetch('/api/admin/cases')
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al cargar casos')
      }
      const data = await res.json()
      console.log('[Frontend] Cases received:', data.cases)
      setCases(data.cases || [])
    } catch (error: any) {
      console.error('Error fetching cases:', error)
      toast.error(error.message || 'Error al cargar casos')
    } finally {
      setLoading(false)
    }
  }

  // Cargar jueces para asignación
  const fetchJudges = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setJudges((data.users || []).filter((u: SystemUser) => u.role === 'judge'))
      }
    } catch (error) {
      console.error('Error fetching judges:', error)
    }
  }

  // Cargar usuario actual
  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setCurrentUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  useEffect(() => {
    fetchCases()
    fetchJudges()
    fetchCurrentUser()
  }, [])

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
      fetchCases() // Recargar lista
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
      
      // Esperar un momento antes de recargar para dar tiempo al backend
      setTimeout(() => {
        fetchCases() // Recargar para ver el juez asignado
      }, 500)
      
    } catch (error: any) {
      console.error('Error assigning case:', error)
      toast.error(error.message || 'Error al asignar caso')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <ClientNavbar displayName={currentUser?.fullName || 'Usuario'} />

      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/supreme-court")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Gestión de Casos</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Sistema de la Suprema Corte</p>
            </div>
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
          loading={loading}
        />
      </main>

      {/* Dialogs */}
      <CaseFormDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateCase}
      />

      <CaseDetailDialog
        open={isDetailDialogOpen}
        onClose={() => setIsDetailDialogOpen(false)}
        caseItem={selectedCase}
      />

      <AssignCaseDialog
        open={isAssignDialogOpen}
        onClose={() => {
          setIsAssignDialogOpen(false)
          setAssigningCase(null)
        }}
        onSubmit={handleSubmitAssignment}
        caseItem={assigningCase}
        judges={judges}
      />
    </div>
  )
}
