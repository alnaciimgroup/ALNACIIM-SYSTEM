import { Header } from '@/components/layout/header'
import { createClient } from '@/utils/supabase/server'
import { getReviewSummary } from './actions'
import { SubmissionReviewActions } from '@/components/accountant/submission-review-actions'
import { Calculator, Banknote, TrendingUp, AlertCircle, User, Calendar, Hash, CheckCircle2, ShieldAlert, Clock } from 'lucide-react'
import { verifySession } from '@/utils/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AccountantSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ staff?: string; date?: string; status?: string }>
}) {
  await verifySession(['accountant'])
  const { staff, date, status } = await searchParams
  const supabase = await createClient()
  const summary = await getReviewSummary()
  
  // 1. Fetch raw submissions first (Bulletproof)
  let query = supabase
    .from('cash_submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (staff) {
    query = query.eq('staff_id', staff)
  }
  
  if (status) {
    query = query.eq('status', status)
  } else if (date) {
    query = query.gte('created_at', `${date}T00:00:00.000Z`)
                 .lte('created_at', `${date}T23:59:59.999Z`)
  } else {
    query = query.limit(100)
  }

  const { data: rawSubmissions, error } = await query
  const submissions = rawSubmissions || []

  // 2. Fetch staff names separately to avoid join ambiguity
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name')
    .in('role', ['staff', 'agent'])
  
  const staffMap: Record<string, string> = {}
  users?.forEach(u => staffMap[u.id] = u.full_name)

  let errorMessage = error ? (error as any).message || JSON.stringify(error) : null;

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="Submission Audit Queue" />
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full max-w-[1200px] mx-auto">
          
          <div className="mb-8 flex justify-between items-end">
            <div className="flex-1">
              <h2 className="text-[32px] font-black text-[#0f172a] mb-1 tracking-tight uppercase leading-none truncate">
                {status ? `QUEUE: ${status}` : 'Financial Submission Audit'}
              </h2>
              <p className="text-[15px] font-medium text-[#64748b]">Found {submissions.length} reports in the current filter.</p>
              {errorMessage && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs font-mono">
                  Database Error: {errorMessage}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
               <div className="bg-white border border-[#e2e8f0] px-4 py-2.5 rounded-[12px] flex items-center gap-2 shadow-sm">
                  <Calendar size={16} className="text-[#3b82f6]" />
                  <span suppressHydrationWarning className="text-[13px] font-black text-[#0f172a] uppercase">
                    {date ? new Date(date).toLocaleDateString() : 'Global Queue'}
                  </span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Metrics cards kept as is */}
            <div className="bg-white p-6 rounded-[24px] border border-[#e5e7eb] shadow-sm flex items-center gap-5">
              <div className="w-12 h-12 rounded-[14px] bg-[#eff6ff] flex items-center justify-center text-[#3b82f6]">
                <Calculator size={22} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-[#94a3b8] uppercase tracking-widest leading-none mb-1.5">Collected Total</span>
                <span className="text-[24px] font-black text-[#0f172a] leading-none">${summary.totalCollected.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[24px] border border-[#e5e7eb] shadow-sm flex items-center gap-5">
              <div className="w-12 h-12 rounded-[14px] bg-[#ecfdf5] flex items-center justify-center text-[#10b981]">
                <Banknote size={22} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-[#94a3b8] uppercase tracking-widest leading-none mb-1.5">Submitted (Cash)</span>
                <span className="text-[24px] font-black text-[#10b981] leading-none">${summary.totalSubmitted.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[24px] border border-[#e5e7eb] shadow-sm flex items-center gap-5">
              <div className="w-12 h-12 rounded-[14px] bg-[#fff7ed] flex items-center justify-center text-[#f59e0b]">
                <TrendingUp size={22} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-[#94a3b8] uppercase tracking-widest leading-none mb-1.5">Net Discrepancy</span>
                <span className={`text-[24px] font-black leading-none ${summary.totalDifference > 0 ? 'text-orange-500' : 'text-[#64748b]'}`}>
                  ${summary.totalDifference.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-[#1e293b] p-6 rounded-[24px] shadow-lg flex items-center gap-5 text-white">
              <div className="w-12 h-12 rounded-[14px] bg-white/10 flex items-center justify-center text-white ring-4 ring-white/5">
                <AlertCircle size={22} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-white/40 uppercase tracking-widest leading-none mb-1.5">Global Pending</span>
                <span className="text-[24px] font-black leading-none text-[#3b82f6] lowercase tracking-tighter">{summary.pendingCount} Reports</span>
              </div>
            </div>
          </div>

          <SubmissionQueueTable 
             submissions={submissions} 
             staffMap={staffMap}
          />

        </div>
      </main>
    </div>
  )
}

import { SubmissionQueueTable } from '@/components/accountant/submission-queue-table'
