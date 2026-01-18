import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ClientNavbar } from "@/components/client-navbar"
import { UsersPageClient } from "@/components/supreme-court/users-page-client"
import { supabaseAdmin } from "@/lib/supabase/admin"

// Tipo para usuarios en lista (sin datos sensibles)
interface UserListItem {
  id: string
  role: string
  status: "active" | "inactive" | "suspended"
  department: string
  createdAt: string
  attributes: Array<{
    id: string
    name: string
    category: string
    description: string
    level: number
  }>
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

async function getUsers(): Promise<UserListItem[]> {
  try {
    // Obtener usuarios SIN datos sensibles (real_name, email, phone)
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users_profile')
      .select(`
        id,
        role,
        status,
        department,
        created_at,
        user_attributes!user_attributes_user_id_fkey (
          abac_attributes (
            id,
            name,
            category,
            level,
            description
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return []
    }

    return (users || []).map((user: any) => ({
      id: user.id,
      role: user.role,
      status: user.status,
      department: user.department || '',
      createdAt: user.created_at,
      attributes: user.user_attributes?.map((ua: any) => ua.abac_attributes).filter(Boolean) || []
    }))
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

async function UsersContent() {
  const [users, currentUserName] = await Promise.all([
    getUsers(),
    getCurrentUser()
  ])

  return (
    <>
      <ClientNavbar displayName={currentUserName} />
      <UsersPageClient
        initialUsers={users}
        currentUserName={currentUserName}
      />
    </>
  )
}

export default function UsersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Cargando usuarios...</p>
          </div>
        </div>
      }>
        <UsersContent />
      </Suspense>
    </div>
  )
}
