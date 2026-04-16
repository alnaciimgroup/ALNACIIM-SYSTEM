import { Header } from '@/components/layout/header'
import { getAccountantOverview } from './actions'
import { StaffPerformanceTable } from '@/components/accountant/staff-performance-table'
import Link from 'next/link'
import { Truck, Tag, ClipboardList, Banknote, TrendingUp, Building2, AlertCircle, ShoppingCart, Wallet, Clock, ShieldAlert, Users, ChevronRight, ArrowUpRight, Activity, Download } from 'lucide-react'

import { Suspense } from 'react'
import { DashboardFilter } from '@/components/accountant/dashboard-filter'
import { AccountantDashboardContent } from '@/components/accountant/dashboard-content'
import { AccountantDashboardSkeleton } from '@/components/accountant/dashboard-skeleton'

export const dynamic = 'force-dynamic'

export default async function AccountantDashboardPage(props: {
  searchParams: Promise<{ date?: string; customDate?: string }>
}) {
  const searchParams = await props.searchParams
  const dateFilter = searchParams.date || 'all'
  const customDate = searchParams.customDate

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header 
        title="Accountant Overview"
        actions={<DashboardFilter />}
      />
      
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full max-w-[1200px]">
          
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-[20px] font-black text-[#0f172a] mb-1 tracking-tight">Audit Distribution Overview</h2>
              <p className="text-[14px] font-medium text-[#64748b]">Filtering metrics based on your selected audit period.</p>
            </div>
            <div className="text-right">
               <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest block mb-0.5">Active Filter</span>
               <span className="text-[13px] font-bold text-[#3b82f6] capitalize">{dateFilter === 'custom' ? customDate : dateFilter.replace('7days', 'Last 7 Days')}</span>
            </div>
          </div>

          <Suspense fallback={<AccountantDashboardSkeleton />}>
             <AccountantDashboardContent dateFilter={dateFilter} customDate={customDate} />
          </Suspense>

        </div>
      </main>
    </div>
  )
}
