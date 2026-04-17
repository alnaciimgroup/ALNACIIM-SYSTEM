import { Header } from '@/components/layout/header'
import { createClient } from '@/utils/supabase/server'
import { Hash, Calendar, ArrowLeft, Clock, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export default async function SubmissionHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: submissions } = await supabase
    .from('cash_submissions')
    .select('*')
    .eq('staff_id', user.id)
    .order('submission_date', { ascending: false })

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="Submission Archive" />
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full max-w-[1200px] mx-auto">
          
          <div className="mb-8">
            <Link href="/dashboard/staff/daily-report" className="flex items-center gap-2 text-[#64748b] hover:text-[#3b82f6] font-bold text-[12px] mb-3 transition-colors uppercase tracking-widest group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              End-of-Day Reporting
            </Link>
            <h2 className="text-[32px] font-black text-[#0f172a] mb-1 tracking-tight uppercase leading-none">Submission Ledger</h2>
            <p className="text-[15px] font-medium text-[#64748b]">Historical log of all cash hand-overs and financial reconciliations.</p>
          </div>

          <div className="bg-white border border-[#e5e7eb] shadow-sm rounded-[28px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc]">
                    <th className="py-5 px-8 text-[11px] font-black text-[#94a3b8] uppercase tracking-widest border-b border-[#f1f5f9]">Reference</th>
                    <th className="py-5 text-[11px] font-black text-[#94a3b8] uppercase tracking-widest border-b border-[#f1f5f9]">Reporting Date</th>
                    <th className="py-5 text-[11px] font-black text-[#94a3b8] uppercase tracking-widest border-b border-[#f1f5f9]">Units Sold</th>
                    <th className="py-5 text-[11px] font-black text-[#94a3b8] uppercase tracking-widest border-b border-[#f1f5f9]">Money Collected</th>
                    <th className="py-5 text-[11px] font-black text-[#94a3b8] uppercase tracking-widest border-b border-[#f1f5f9]">Amount Submitted</th>
                    <th className="py-5 text-[11px] font-black text-[#94a3b8] uppercase tracking-widest border-b border-[#f1f5f9]">Difference</th>
                    <th className="py-5 pr-8 text-[11px] font-black text-[#94a3b8] uppercase tracking-widest border-b border-[#f1f5f9] text-right">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {submissions?.map(sub => {
                    const diff = Number(sub.difference_amount)
                    const isFlagged = Math.abs(diff) > 0.01

                    return (
                      <tr key={sub.id} className="hover:bg-[#f8fafc]/80 transition-all border-l-4 border-transparent hover:border-[#3b82f6]">
                        <td className="py-6 px-8">
                           <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-[10px] bg-[#f1f5f9] flex items-center justify-center text-[#64748b]">
                                 <Hash size={16} strokeWidth={2.5} />
                              </div>
                              <span className="font-extrabold text-[#0f172a] text-[13px] uppercase tracking-tighter">{sub.id.slice(0, 8)}</span>
                           </div>
                        </td>
                        <td className="py-6">
                           <div className="flex flex-col">
                              <span className="font-black text-[#0f172a] text-[15px] uppercase tracking-tight">
                                {new Date(sub.submission_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              <span className="text-[11px] font-bold text-[#94a3b8] uppercase">Operational Cycle</span>
                           </div>
                        </td>
                        <td className="py-6">
                           <span className="px-3 py-1 rounded-full bg-[#1e293b] text-white text-[10px] font-black uppercase tracking-widest">{sub.tanks_sold}X Sold</span>
                        </td>
                        <td className="py-6">
                           <span className="text-[15px] font-bold text-[#64748b]">${Number(sub.money_collected).toFixed(2)}</span>
                        </td>
                        <td className="py-6">
                           <span className="text-[17px] font-black text-[#0f172a] tracking-tighter">${Number(sub.submitted_amount).toFixed(2)}</span>
                        </td>
                        <td className="py-6">
                           <span className={`text-[15px] font-black ${isFlagged ? 'text-orange-500' : 'text-[#64748b]'}`}>
                              {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                           </span>
                        </td>
                        <td className="py-6 pr-8 text-right">
                           <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] border-2 group transition-all ${
                             sub.status === 'verified' 
                               ? 'bg-[#ecfdf5] text-[#10b981] border-[#10b981]/10' 
                               : sub.status === 'disputed'
                               ? 'bg-red-50 text-red-600 border-red-100'
                               : 'bg-[#f8fafc] text-[#64748b] border-[#e2e8f0]'
                           }`}>
                             {sub.status === 'verified' ? <CheckCircle2 size={14} /> : sub.status === 'disputed' ? <ShieldAlert size={14} /> : <Clock size={14} />}
                             <span className="text-[10px] font-black uppercase tracking-widest">{sub.status}</span>
                           </div>
                        </td>
                      </tr>
                    )
                  })}

                  {submissions?.length === 0 && (
                    <tr>
                       <td colSpan={7} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                             <div className="w-16 h-16 rounded-full bg-[#f8fafc] flex items-center justify-center text-[#cbd5e1]">
                                <Calendar size={32} />
                             </div>
                             <p className="text-[14px] font-bold text-[#94a3b8] uppercase tracking-widest">No historical submissions discovered</p>
                          </div>
                       </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
