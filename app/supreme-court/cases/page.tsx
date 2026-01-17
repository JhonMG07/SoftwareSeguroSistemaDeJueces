import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ClientNavbar } from "@/components/client-navbar"
import { CasesPageClient } from "@/components/supreme-court/cases-page-client"
import type { JudicialCase, SystemUser } from "@/lib/types/supreme-court"
import { supabaseAdmin } from "@/lib/supabase/admin"

async function getCases(): Promise<JudicialCase[]> {
  try {
    // Fetch cases from database
    const { data: cases, error } = await supabaseAdmin
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Enrich with assignment data
    const enrichedCases = await Promise.all(
      (cases || []).map(async (caseItem) => {
        const { data: assignment } = await supabaseAdmin
          .from('case_assignments')
          .select('anon_actor_id')
          .eq('case_id', caseItem.id)
          .maybeSingle()

        return {
          id: caseItem.id,
          caseNumber: caseItem.case_number,
          title: caseItem.title,
          description: caseItem.description,
          status: caseItem.status,
          priority: caseItem.priority,
          classification: caseItem.classification,
          createdAt: caseItem.created_at,
          updatedAt: caseItem.updated_at,
          deadline: caseItem.deadline,
          createdBy: caseItem.created_by,
          caseType: caseItem.case_type,
          assignedJudgeId: assignment?.anon_actor_id || null,
          assignedJudge: assignment?.anon_actor_id ? {
            id: assignment.anon_actor_id,
            fullName: `Juez-${assignment.anon_actor_id.substring(0, 8)}`,
            email: '',
            role: 'judge'
          } : undefined
        }
      })
    )

    return enrichedCases
  } catch (error) {
    console.error('Error fetching cases:', error)
    return []
  }
}

async function getJudges(): Promise<Pick<SystemUser, 'id' | 'fullName' | 'email'>[]> {
  try {
    const { data: judges, error } = await supabaseAdmin
      .from('users_profile')
      .select('id, real_name, email')
      .eq('role', 'judge')
      .eq('status', 'active')

    if (error) throw error

    return (judges || []).map(judge => ({
      id: judge.id,
      fullName: judge.real_name,
      email: judge.email
    }))
  } catch (error) {
    console.error('Error fetching judges:', error)
    return []
  }
}

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  const { data: profile } = await supabaseAdmin
    .from('users_profile')
    .select('real_name')
    .eq('id', user.id)
    .single()

  return profile?.real_name || 'Usuario'
}

async function CasesContent() {
  const [cases, judges, currentUserName] = await Promise.all([
    getCases(),
    getJudges(),
    getCurrentUser()
  ])

  return (
    <>
      <ClientNavbar displayName={currentUserName} />
      <CasesPageClient 
        initialCases={cases} 
        judges={judges}
        currentUserName={currentUserName}
      />
    </>
  )
}

export default function CasesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Cargando casos...</p>
          </div>
        </div>
      }>
        <CasesContent />
      </Suspense>
    </div>
  )
}
