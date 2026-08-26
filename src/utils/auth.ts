import { createClient } from './supabase/server'
import { redirect } from 'next/navigation'

export async function verifySession(allowedRoles?: string[]) {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  const role = user.user_metadata?.role || user.app_metadata?.role || 'staff'

  if (allowedRoles && !allowedRoles.includes(role)) {
    redirect(`/dashboard/${role}`)
  }

  return { user, role }
}

export async function isAdmin() {
  const { role } = await verifySession()
  return role === 'accountant' || role === 'manager'
}

export async function isAgent() {
  const { role } = await verifySession()
  return role === 'agent'
}

export async function isStaff() {
  const { role } = await verifySession()
  return role === 'staff'
}
