import { Header } from '@/components/layout/header'
import { createClient } from '@/utils/supabase/server'
import { getReviewSummary } from './actions'
import { SubmissionReviewActions } from '@/components/accountant/submission-review-actions'
import { Calculator, Banknote, TrendingUp, AlertCircle, User, Calendar, Hash } from 'lucide-react'
import { verifySession } from '@/utils/auth'
import { SubmissionQueueTable } from '@/components/accountant/submission-queue-table'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AccountantSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ staff?: string; date?: string; status?: string }>
}) {
  await verifySession(['accountant'])
  const params = await searchParams
  
  // Default to Today if no date provided
  let date = params.date
  if (!date && !params.staff && !params.status) {
    date = new Date().toISOString().split('T')[0]
  }

  const staffId = params.staff
  const status = params.status
  const supabase = await createClient()
  const summary = await getReviewSummary(date, staffId)
  
  // 1. Fetch raw submissions
  let query = supabase
    .from('cash_submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (staffId) {
    query = query.eq('staff_id', staffId)
  }
  
  if (status) {
    query = query.eq('status', status)
  } else if (date) {
    query = query.gte('submission_date', date)
                 .lte('submission_date', date)
  } else {
    query = query.limit(100)
  }

  const { data: rawSubmissions, error } = await query
  const submissions = rawSubmissions || []

  // 2. Fetch ALL transactions for the period to calculate SYSTEM EXPECTATIONS
  // This is the "Truth" we compare submissions against
  const start = date ? `${date}T00:00:00.000Z` : '2000-01-01T00:00:00.000Z'
  const end = date ? `${date}T23:59:59.999Z` : '2099-12-31T23:59:59.999Z'

  const [
    { data: salesByStaff },
    { data: paymentsByStaff }
  ] = await Promise.all([
    supabase.from('sales').select('staff_id, total_amount, sale_type').gte('created_at', start).lte('created_at', end),
    supabase.from('payments').select('amount, payment_method, sales!inner(staff_id)').gte('created_at', start).lte('created_at', end)
  ])

  // Calculation Map: Staff ID -> { cashExpected: number, creditExpected: number }
  const expectationMap: Record<string, { cash: number, credit: number }> = {}
  
  // Track Credit Sales
  salesByStaff?.forEach(s => {
    if (!expectationMap[s.staff_id]) expectationMap[s.staff_id] = { cash: 0, credit: 0 }
    if (s.sale_type === 'credit') {
      expectationMap[s.staff_id].credit += Number(s.total_amount)
    }
  })

  // Track Cash Collections (Cash Sales + Debt Repayments)
  paymentsByStaff?.forEach(p => {
    const sid = (p.sales as any).staff_id
    if (!expectationMap[sid]) expectationMap[sid] = { cash: 0, credit: 0 }
    expectationMap[sid].cash += Number(p.amount)
  })

  // 3. Fetch staff names
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
                {status ? `QUEUE: ${status}` : 'Daily Submission Audit'}
              </h2>
              <p className="text-[15px] font-medium text-[#64748b]">Showing {submissions.length} reports for {date || 'Global Queue'}.</p>
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
            {/* 1. Expected Money */}
            <div className="bg-white p-6 rounded-[24px] border border-[#e5e7eb] shadow-sm flex items-center gap-5">
              <div className="w-12 h-12 rounded-[14px] bg-[#eff6ff] flex items-center justify-center text-[#3b82f6]">
                <Calculator size={22} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-[#94a3b8] uppercase tracking-widest leading-none mb-1.5">Expected Revenue</span>
                <span className="text-[24px] font-black text-[#0f172a] leading-none">${(summary.expectedTotal || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* 2. Collected Today */}
            <div className="bg-white p-6 rounded-[24px] border border-[#e5e7eb] shadow-sm flex items-center gap-5">
              <div className="w-12 h-12 rounded-[14px] bg-[#ecfdf5] flex items-center justify-center text-[#10b981]">
                <Banknote size={22} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-[#94a3b8] uppercase tracking-widest leading-none mb-1.5">Cash Reported</span>
                <span className="text-[24px] font-black text-[#10b981] leading-none">${summary.totalSubmitted.toFixed(2)}</span>
              </div>
            </div>


            {/* 3. Debt */}
            <div className="bg-white p-6 rounded-[24px] border border-[#e5e7eb] shadow-sm flex items-center gap-5">
              <div className="w-12 h-12 rounded-[14px] bg-[#fef2f2] text-[#ef4444] flex items-center justify-center">
                <TrendingUp size={22} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-[#94a3b8] uppercase tracking-widest leading-none mb-1.5">Total Debt</span>
                <span className="text-[24px] font-black text-[#ef4444] leading-none">
                  ${summary.totalCredit?.toFixed(2) ?? '0.00'}
                </span>
              </div>
            </div>

            {/* 4. Pending Queue */}
            <div className="bg-[#0f172a] p-6 rounded-[24px] shadow-lg flex items-center gap-5 text-white">
              <div className="w-12 h-12 rounded-[14px] bg-white/10 flex items-center justify-center text-white ring-4 ring-white/5">
                <AlertCircle size={22} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-white/40 uppercase tracking-widest leading-none mb-1.5">Pending Reports</span>
                <span className="text-[24px] font-black leading-none text-[#3b82f6] lowercase tracking-tighter">{summary.pendingCount} Pending</span>
              </div>
            </div>
          </div>

          <SubmissionQueueTable 
             submissions={submissions.map(s => {
               const exp = expectationMap[s.staff_id] || { cash: 0, credit: 0 }
               return {
                 ...s,
                 system_expected_cash: exp.cash,
                 system_expected_credit: exp.credit
               }
             })} 
             staffMap={staffMap}
          />

</div>
      </main>
    </div>
  )
}
