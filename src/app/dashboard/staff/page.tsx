import { Header } from '@/components/layout/header'
import { getStaffDashboardData } from './actions'
import Link from 'next/link'
import { Calculator } from 'lucide-react'

import { Suspense } from 'react'
import { StaffDashboardContent } from '@/components/staff/dashboard-content'
import { StaffDashboardSkeleton } from '@/components/staff/dashboard-skeleton'
import { DateFilter } from '@/components/staff/date-filter'

export default async function StaffDashboardPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const resolvedParams = await searchParams
  const dateParam = resolvedParams.date || new Date().toISOString().split('T')[0]
  
  let todayDisplay = "All Time Focus"
  if (dateParam !== 'all') {
    const localDate = new Date(dateParam + 'T12:00:00') // Ensure consistent local date formatting
    todayDisplay = localDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="Operations Overview" />
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full">
          
          <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 mb-10">
            <div>
              <h2 className="text-[32px] font-black text-[#0f172a] mb-1 tracking-tighter">Performance Monitor</h2>
              <p className="text-[15px] font-medium text-[#64748b]">Strategic tracking for <span className="text-[#3b82f6] font-bold">{todayDisplay}</span></p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Suspense fallback={<div className="h-[44px] w-[300px] bg-slate-200 animate-pulse rounded-[16px]"></div>}>
                <DateFilter />
              </Suspense>
              <Link href="/dashboard/staff/record-sales" className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold h-[48px] px-8 rounded-[14px] flex items-center gap-3 transition-all shadow-lg shadow-blue-500/20 active:scale-95 text-[14px] uppercase tracking-wider">
                <Calculator size={18} strokeWidth={2.5} />
                New Sale transaction
              </Link>
            </div>
          </div>
          
          <Suspense fallback={<StaffDashboardSkeleton />}>
            <StaffDashboardContent date={dateParam} />
          </Suspense>

        </div>
      </main>
    </div>
  )
}
