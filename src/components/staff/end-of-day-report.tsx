'use client'

import { Droplet, Banknote, Clock, Send, Loader2, CheckCircle2, AlertCircle, CreditCard, ArrowDownCircle, Wallet } from 'lucide-react'
import { useActionState } from 'react'
import { submitCashSubmission } from '@/app/dashboard/staff/daily-report/actions'

interface ReportProps {
  tanksSold: number
  moneySubmitted: number
  moneyCollected: number
  cashSales: number
  debtPayments: number
  creditSold: number
  freeTanksSold: number
  status: 'PENDING' | 'SUBMITTED' | 'VERIFIED'
  date: string
}

export function EndOfDayReport({ report }: { report: ReportProps }) {
  const [state, formAction, isPending] = useActionState(submitCashSubmission, null)

  return (
    <div className="bg-[#0f172a] rounded-[24px] p-7 text-white shadow-xl flex flex-col h-full border border-gray-800">
      <h3 className="text-[20px] font-bold tracking-tight mb-8">End of Day Report</h3>

      <div className="flex flex-col gap-6 flex-1">
        <div className="flex items-center justify-between border-b border-gray-800 pb-5">
          <div className="flex items-center gap-3">
            <Droplet size={18} className="text-gray-400" />
            <span className="text-[15px] text-gray-300 font-medium">Tanks Sold</span>
          </div>
          <span className="text-[18px] font-bold">{report.tanksSold}</span>
        </div>

        <div className="flex items-center justify-between border-b border-gray-800 pb-5">
          <div className="flex items-center gap-3">
            <span className="text-[18px]">🎁</span>
            <span className="text-[15px] text-blue-400 font-bold uppercase tracking-tight">Free Tanks Given</span>
          </div>
          <span className="text-[18px] font-black text-blue-400">{report.freeTanksSold}</span>
        </div>

        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <Banknote size={16} className="text-indigo-400" />
            <span className="text-[14px] text-gray-300 font-medium">Cash Sales</span>
          </div>
          <span className="text-[16px] font-bold text-gray-100">${report.cashSales.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <ArrowDownCircle size={16} className="text-teal-400" />
            <span className="text-[14px] text-gray-300 font-medium">Debt Payments</span>
          </div>
          <span className="text-[16px] font-bold text-gray-100">${report.debtPayments.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <Banknote size={18} className="text-emerald-400" />
            <span className="text-[15px] font-bold text-white uppercase tracking-wider">Money Collected</span>
          </div>
          <span className="text-[20px] font-black text-emerald-400">${report.moneyCollected.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <CreditCard size={16} className="text-orange-400" />
            <span className="text-[14px] text-gray-400 font-medium">Credit Sold Today</span>
          </div>
          <span className="text-[16px] font-bold text-gray-400">${report.creditSold.toFixed(2)}</span>
        </div>



        <div className="flex items-center justify-between border-b border-gray-800 pb-5">
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-gray-400" />
            <span className="text-[15px] text-gray-300 font-medium">Status</span>
          </div>
          <span className="px-3 py-1 bg-[#ea580c]/20 text-[#ea580c] font-black text-[11px] uppercase tracking-wider rounded-md border border-[#ea580c]/30">
            {report.status}
          </span>
        </div>
      </div>

      {state?.message && (
        <div className={`mt-4 p-3 rounded-[12px] flex items-center gap-2 text-[13px] font-bold ${
          state.error ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
        }`}>
          {state.error ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {state.message}
        </div>
      )}

      <form action={formAction} className="mt-6">
        <input type="hidden" name="submission_date" value={report.date} />
        <input type="hidden" name="tanks_sold" value={report.tanksSold} />
        <input type="hidden" name="money_collected" value={report.moneyCollected} />
        <input type="hidden" name="submitted_amount" value={report.moneyCollected} />
        <button
          type="submit"
          disabled={isPending || state?.error === false || report.status !== 'PENDING'}
          className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-[14px] transition-colors flex items-center justify-center gap-2"
        >
          {isPending
            ? <><Loader2 size={18} className="animate-spin" /> Submitting...</>
            : state?.error === false || report.status !== 'PENDING'
            ? <><CheckCircle2 size={18} /> Report Submitted</>
            : <><Send size={18} /> Submit Daily Report</>
          }
        </button>
      </form>
    </div>
  )
}
