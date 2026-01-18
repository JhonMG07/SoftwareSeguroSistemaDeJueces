import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ClientNavbar } from "@/components/client-navbar"
import { SecurityPageClient } from "@/components/supreme-court/security-page-client"
import type { ABACAttribute } from "@/lib/types/supreme-court"
import { supabaseAdmin } from "@/lib/supabase/admin"

async function getAttributes(): Promise<ABACAttribute[]> {
  try {
    const { data: attributes, error } = await supabaseAdmin
      .from('abac_attributes')
      .select('*')
      .order('category', { ascending: true })

    if (error) throw error

    return (attributes || []).map(attr => ({
      id: attr.id,
      name: attr.name,
      category: attr.category,
      description: attr.description,
      level: attr.level || 1 // Default to level 1 if not set
    }))
  } catch (error) {
    console.error('Error fetching attributes:', error)
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
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role;
  switch (role) {
    case 'judge': return 'Juez';
    case 'secretary': return 'Secretario';
    case 'auditor': return 'Auditor';
    case 'super_admin': return 'Administrador';
    default: return 'Usuario';
  }
}

async function SecurityContent() {
  const [attributes, currentUserName] = await Promise.all([
    getAttributes(),
    getCurrentUser()
  ])

  return (
    <>
      <ClientNavbar displayName={currentUserName} />
      <SecurityPageClient initialAttributes={attributes} />
    </>
  )
}

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Cargando configuración de seguridad...</p>
          </div>
        </div>
      }>
        <SecurityContent />
      </Suspense>
    </div>
  )
}
