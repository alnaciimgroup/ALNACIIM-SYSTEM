'use client'

import { useState, useActionState } from 'react'
import { Banknote, Send, Loader2, AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react'
import { submitCashSubmission } from '@/app/dashboard/staff/daily-report/actions'

interface Props {
  moneyCollected: number
  date: string
  tanksSold: number
}

export function DailySubmissionForm({ moneyCollected, date, tanksSold }: Props) {
  const [submittedAmount, setSubmittedAmount] = useState<number>(moneyCollected)
  const [state, formAction, isPending] = useActionState(submitCashSubmission, null)

  const difference = moneyCollected - submittedAmount
  const isDiscrepancy = Math.abs(difference) > 0.01

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[24px] overflow-hidden shadow-sm">
      <div className="p-8 border-b border-[#f1f5f9] flex items-center justify-between">
        <div>
          <h3 className="text-[18px] font-black text-[#0f172a] uppercase tracking-tight mb-1">Final Ledger Submission</h3>
          <p className="text-[14px] font-medium text-[#64748b]">Verify your physical cash handover for <span suppressHydrationWarning>{new Date(date).toLocaleDateString()}</span>.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#f8fafc] rounded-full border border-[#e2e8f0]">
          <div className={`w-2 h-2 rounded-full ${isDiscrepancy ? 'bg-orange-400 animate-pulse' : 'bg-emerald-400'}`}></div>
          <span className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider">
            {isDiscrepancy ? 'Reconciliation Warning' : 'Balanced Account'}
          </span>
        </div>
      </div>
      
      <div className="p-10">
        <form action={formAction} className="max-w-[800px] flex flex-col gap-8">
          {state?.message && (
            <div className={`p-4 rounded-[16px] flex items-center gap-3 text-[14px] font-bold border ${state.error ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
              {state.error ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
              {state.message}
            </div>
          )}

          <input type="hidden" name="submission_date" value={date} />
          <input type="hidden" name="tanks_sold" value={tanksSold} />
          <input type="hidden" name="money_collected" value={moneyCollected} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-3">
              <label htmlFor="submitted_amount" className="text-[12px] font-black uppercase tracking-widest text-[#1e293b]">Submitted Amount ($)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-[#94a3b8]">
                  <Banknote size={22} strokeWidth={2.5} />
                </div>
                <input 
                  type="number" 
                  id="submitted_amount" 
                  name="submitted_amount" 
                  step="0.01"
                  required
                  value={submittedAmount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    setSubmittedAmount(isNaN(val) ? 0 : val)
                  }}
                  className={`w-full h-[58px] pl-[60px] pr-8 bg-[#f8fafc] border rounded-[16px] text-[20px] font-black text-[#0f172a] focus:outline-none focus:ring-4 focus:ring-[#3b82f6]/10 transition-all ${isDiscrepancy ? 'border-orange-300' : 'border-[#e2e8f0]'}`}
                />
              </div>
            </div>

            <div className={`flex flex-col justify-center px-6 py-4 rounded-[16px] border-2 ${isDiscrepancy ? 'bg-orange-50 border-orange-200' : 'bg-[#f8fafc] border-[#e2e8f0]'}`}>
               <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-1">Difference / Discrepancy</span>
               <span className={`text-[24px] font-black ${difference > 0 ? 'text-orange-500' : difference < 0 ? 'text-blue-500' : 'text-[#64748b]'}`}>
                  {difference > 0 ? '+' : ''}{difference.toFixed(2)} USD
               </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
             <label htmlFor="note" className="text-[12px] font-black uppercase tracking-widest text-[#1e293b]">Internal Staff Notes (Optional)</label>
             <textarea 
               id="note" 
               name="note" 
               rows={3}
               placeholder="Enter any observational notes here..."
               className="w-full p-5 bg-[#f8fafc] border border-[#e2e8f0] rounded-[16px] text-[14px] font-medium text-[#0f172a] focus:outline-none focus:ring-4 focus:ring-[#3b82f6]/10 transition-all resize-none"
             ></textarea>
          </div>

          {isDiscrepancy && (
            <div className="flex items-start gap-4 p-5 bg-orange-50 rounded-[16px] border border-orange-100">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
                <TriangleAlert size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="text-[13px] font-black text-orange-700 uppercase tracking-tight mb-1">Discrepancy Detected</h4>
                <p className="text-[12px] font-bold text-orange-600/80 leading-relaxed">
                  The submitted amount does not match the collected total. Please ensure all cash and debt repayments are correctly tallied before finalized submission.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-4 p-5 bg-[#eff6ff]/50 rounded-[16px] border border-[#3b82f6]/10">
            <div className="w-8 h-8 rounded-full bg-[#3b82f6] text-white flex items-center justify-center shrink-0">
              <Info size={18} strokeWidth={2.5} />
            </div>
            <p className="text-[12px] font-bold text-[#475569] leading-relaxed">
              Upon submission, your financial record for <span suppressHydrationWarning>{new Date(date).toLocaleDateString()}</span> will be locked. Discrepancies will be automatically flagged for the Accountant's regional audit.
            </p>
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            className="h-[60px] bg-[#3b82f6] hover:bg-[#2563eb] text-white font-black text-[15px] rounded-[18px] flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest w-full"
          >
            {isPending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} strokeWidth={2.5} />}
            {isPending ? 'Processing Submission...' : 'Sign & Finalize Daily Report'}
          </button>
        </form>
      </div>
    </div>
  )
}
