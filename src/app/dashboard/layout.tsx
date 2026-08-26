import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { DashboardContainer } from '@/components/layout/dashboard-container'
import { Sidebar } from '@/components/layout/sidebar'
import { logout } from '@/app/login/actions'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const role = user.user_metadata?.role || user.app_metadata?.role || 'staff'
  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''

  if (role === 'staff' && pathname.includes('/dashboard/agent')) {
    return redirect('/dashboard/staff')
  }
  
  if (role === 'agent' && pathname.includes('/dashboard/staff')) {
    return redirect('/dashboard/agent')
  }

  if (role === 'manager' && pathname === '/dashboard') {
    return redirect('/dashboard/manager')
  }

  return (
    <DashboardContainer 
      role={role} 
      userName={fullName}
      sidebar={<Sidebar role={role} logoutAction={logout} />}
    >
      {children}
    </DashboardContainer>
  )
}
