import { Header } from '@/components/layout/header'
import { SuperadminMetricsCards } from '@/components/superadmin/metrics-cards'
import { UserList } from '@/components/superadmin/user-list'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'
import { createAdminClient } from '@/utils/supabase/admin'

export default async function SuperadminDashboard() {
  const supabase = createAdminClient()

  // Fetch all users from Auth Admin API for absolute source of truth
  const { data: { users: authUsers }, error } = await supabase.auth.admin.listUsers()
  
  if (error) {
    console.error('Superadmin Metrics Error:', error)
  }

  const metrics = {
    agents: authUsers?.filter(u => (u.user_metadata?.role || u.app_metadata?.role) === 'agent').length || 0,
    staff: authUsers?.filter(u => (u.user_metadata?.role || u.app_metadata?.role) === 'staff').length || 0,
    accountants: authUsers?.filter(u => (u.user_metadata?.role || u.app_metadata?.role) === 'accountant').length || 0,
    total: authUsers?.length || 0
  }

  const recentUsers = (authUsers || []).map(u => ({
    id: u.id,
    name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
    email: u.email,
    role: (u.user_metadata?.role || u.app_metadata?.role || 'staff').toUpperCase(),
    status: 'Active'
  }))

  const data = {
    metrics,
    recentUsers
  }
          <section className="mb-8">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-[18px] font-bold text-[#0f172a] mb-1 tracking-tight">System Node Overview</h2>
                <p className="text-[14px] font-medium text-[#64748b]">Monitor and manage all operational system accounts</p>
              </div>
              
              <Link href="/dashboard/superadmin/users" className="bg-[#4fa0ff] hover:bg-[#3b82f6] text-white font-bold h-[44px] px-6 rounded-[12px] flex items-center gap-2 transition-colors shadow-sm">
                <PlusCircle size={18} strokeWidth={2.5} />
                Provision Account
              </Link>
            </div>
            
            <SuperadminMetricsCards metrics={data.metrics} />
          </section>

          <section className="grid grid-cols-1 gap-6">
            <UserList users={data.recentUsers} />
          </section>
        </div>
      </main>
    </div>
  )
}
