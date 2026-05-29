import { Header } from '@/components/layout/header'
import { AgentMetricsCards } from '@/components/agent/metrics-cards'
import { DistributionHistory } from '@/components/agent/distribution-history'
import { getAgentDashboardData } from './actions'
import Link from 'next/link'

import { Suspense } from 'react'
import { AgentDashboardContent } from '@/components/agent/dashboard-content'
import { AgentDashboardSkeleton } from '@/components/agent/dashboard-skeleton'
import { DateFilter } from '@/components/staff/date-filter'
import { getCurrentWorkDate } from '@/utils/date-utils'

export default async function AgentDashboardPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const resolvedParams = await searchParams
  const dateParam = resolvedParams.date || getCurrentWorkDate()

  let todayDisplay = "All Time"
  if (dateParam !== 'all') {
    const localDate = new Date(dateParam + 'T12:00:00')
    todayDisplay = localDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="Agent Dashboard" />
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full">
          <section className="mb-8">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-[18px] font-bold text-[#0f172a] mb-1">Distribution Overview</h2>
                <p className="text-[14px] font-medium text-[#64748b]">Strategic tracking for <span className="text-[#3b82f6] font-bold">{todayDisplay}</span></p>
              </div>
              
              <div className="flex items-center gap-4">
                <Suspense fallback={<div className="h-[44px] w-[300px] bg-slate-200 animate-pulse rounded-[16px]"></div>}>
                  <DateFilter />
                </Suspense>
                <Link href="/dashboard/agent/distribution" className="bg-[#4fa0ff] hover:bg-[#3b82f6] text-white font-bold h-[44px] px-6 rounded-[12px] flex items-center gap-2 transition-colors shadow-sm">
                  <span className="text-[20px] leading-none mb-0.5">+</span> Distribute Liters
                </Link>
              </div>
            </div>
            
            <Suspense fallback={<AgentDashboardSkeleton />}>
               <AgentDashboardContent date={dateParam} />
            </Suspense>
          </section>
        </div>
      </main>
    </div>
  )
}
