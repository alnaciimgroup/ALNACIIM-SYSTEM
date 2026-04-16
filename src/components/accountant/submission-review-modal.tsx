'use client'

import { useState, useTransition } from 'react'
import { X, CheckCircle2, ShieldAlert, Clock, AlertCircle, Save, Loader2, Banknote, User, Calendar, MessageSquare, Calculator, ListChecks } from 'lucide-react'
import { updateSubmissionStatus, getSubmissionBreakdown } from '@/app/dashboard/accountant/submissions/actions'
import { useToast } from '@/components/ui/toast'
import { useEffect } from 'react'
import { SubmissionBreakdownList } from './submission-breakdown-list'

interface Submission {
  id: string
  staff_id: string
  submission_date: string
  tanks_sold: number
  money_collected: number
  submitted_amount: number
  difference_amount: number
  status: string
  note?: string
  created_at: string
}

interface Props {
  submission: Submission
  staffName: string
  onClose: () => void
}

export function SubmissionReviewModal({ submission, staffName, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()
  
  const [amount, setAmount] = useState(submission.submitted_amount)
  const [note, setNote] = useState(submission.note || '')
  const [breakdown, setBreakdown] = useState<{ sales: any[], payments: any[] } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchBreakdown() {
      setIsLoading(true)
      try {
        const data = await getSubmissionBreakdown(submission.staff_id, submission.submission_date)
        setBreakdown(data)
      } catch (err) {
        console.error('Failed to fetch breakdown:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchBreakdown()
  }, [submission])
  
  const diff = amount - Number(submission.money_collected)
  const isMismatch = Math.abs(diff) > 0.01

  const handleAction = (status: string) => {
    if (status === 'verified' && isMismatch) {
        const confirm = window.confirm('This submission has a financial mismatch. Are you sure you want to verify it as correct?')
        if (!confirm) return
    }

    startTransition(async () => {
      try {
        await updateSubmissionStatus(submission.id, status, note, amount)
        showToast(`Submission marked as ${status}`, 'success')
        onClose()
      } catch (err) {
        showToast('Operation failed. Please check the data.', 'error')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-[600px] max-h-[90vh] flex flex-col rounded-[32px] shadow-2xl overflow-hidden border border-white/20 animate-in slide-in-from-bottom-8 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1e293b] shrink-0 p-8 text-white flex justify-between items-start relative overflow-hidden">
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2 opacity-60">
                 <ShieldAlert size={16} className="text-[#3b82f6]" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em]">Regional Audit Panel</span>
              </div>
              <h2 className="text-[28px] font-black leading-none tracking-tight uppercase">Audit Submission</h2>
           </div>
           <button 
             onClick={onClose}
             className="relative z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
           >
             <X size={20} />
           </button>
           
           {/* Abstract patterns */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-[#3b82f6]/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
           {/* Staff Detail */}
           <div className="flex items-center justify-between mb-8 pb-8 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#64748b]">
                    <User size={24} strokeWidth={2.5} />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[16px] font-black text-[#0f172a] uppercase tracking-tight">{staffName}</span>
                    <span className="text-[12px] font-bold text-[#94a3b8] uppercase">Warehouse Unit Account</span>
                 </div>
              </div>
              <div className="text-right">
                 <div className="flex items-center justify-end gap-2 text-[#64748b] mb-1">
                    <Calendar size={14} />
                    <span suppressHydrationWarning className="text-[12px] font-black uppercase text-[#0f172a]">{new Date(submission.submission_date).toLocaleDateString()}</span>
                 </div>
                 <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest leading-none">Reporting Cycle</span>
              </div>
           </div>

           {/* Financial Grid */}
           <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="p-5 rounded-[24px] bg-[#f8fafc] border border-[#e2e8f0]">
                 <div className="flex items-center gap-2 mb-2 text-[#64748b]">
                    <Calculator size={14} />
                    <span className="text-[11px] font-black uppercase tracking-wider">Expected Cash</span>
                 </div>
                 <div className="text-[24px] font-black text-[#0f172a] tracking-tighter">${Number(submission.money_collected).toFixed(2)}</div>
              </div>
              <div className="p-5 rounded-[24px] bg-[#f8fafc] border border-[#e2e8f0]">
                 <div className="flex items-center gap-2 mb-2 text-[#64748b]">
                    <Banknote size={14} />
                    <span className="text-[11px] font-black uppercase tracking-wider">Submitted Cash</span>
                 </div>
                 <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full text-[24px] font-black text-[#3b82f6] bg-transparent border-none outline-none focus:ring-0 p-0 tracking-tighter"
                 />
              </div>
           </div>

           {/* Mismatch Alert */}
           <div className={`p-6 rounded-[24px] flex items-center justify-between mb-8 transition-all ${
             Math.abs(diff) < 0.01 
             ? 'bg-[#ecfdf5] border border-[#d1fae5] text-[#10b981]' 
             : 'bg-red-50 border border-red-100 text-red-600'
           }`}>
              <div className="flex items-center gap-4">
                 <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center ${
                   Math.abs(diff) < 0.01 ? 'bg-white text-[#10b981]' : 'bg-white text-red-500 shadow-sm'
                 }`}>
                    {Math.abs(diff) < 0.01 ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <AlertCircle size={24} strokeWidth={2.5} />}
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-widest opacity-60">Variance Balance</span>
                    <span className="text-[20px] font-black leading-none">${diff.toFixed(2)}</span>
                 </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-white/50 rounded-[10px]">
                 {Math.abs(diff) < 0.01 ? 'Account Balanced' : 'Mismatch Flagged'}
              </span>
           </div>

           {/* Submission Breakdown Drill-down */}
           <div className="mb-8 p-6 rounded-[24px] border border-[#e2e8f0] bg-white">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                    <ListChecks size={16} className="text-[#3b82f6]" />
                    <span className="text-[12px] font-black uppercase tracking-widest text-[#0f172a]">Transaction Audit Log</span>
                 </div>
                 {isLoading && <Loader2 size={14} className="animate-spin text-[#3b82f6]" />}
              </div>
              
              <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                 {isLoading ? (
                   <div className="py-12 text-center text-[#94a3b8] font-bold text-[13px] uppercase tracking-widest">
                     Gathering transaction data...
                   </div>
                 ) : breakdown ? (
                   <SubmissionBreakdownList sales={breakdown.sales} payments={breakdown.payments} />
                 ) : (
                   <div className="py-8 text-center text-red-400 font-bold text-[13px] uppercase tracking-widest">
                     Failed to load audited data.
                   </div>
                 )}
              </div>
           </div>

           {/* Note Area */}
           <div className="mb-8">
              <div className="flex items-center gap-2 mb-3 text-[#64748b]">
                 <MessageSquare size={14} />
                 <span className="text-[11px] font-black uppercase tracking-wider">Audit Observation Note</span>
              </div>
              <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add audit notes or reason for correction..."
                className="w-full h-24 p-5 rounded-[20px] bg-[#f8fafc] border border-[#e2e8f0] outline-none focus:border-[#3b82f6] text-[14px] font-medium resize-none transition-all"
              />
           </div>
        </div>

        {/* Fixed Action Bar Footer */}
        <div className="shrink-0 p-8 border-t border-[#f1f5f9] bg-white flex gap-4">
           <button 
             onClick={() => handleAction('disputed')}
             disabled={isPending}
             className="flex-1 h-14 rounded-[20px] border-2 border-red-200 text-red-600 font-black text-[13px] uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50"
           >
             Deny & Dispute
           </button>
           <button 
             onClick={() => handleAction('verified')}
             disabled={isPending}
             className="flex-[2] h-14 rounded-[20px] bg-[#10b981] hover:bg-[#059669] text-white font-black text-[14px] uppercase tracking-[0.1em] shadow-lg shadow-[#10b981]/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
           >
             {isPending ? <Loader2 className="animate-spin" /> : <Save size={18} />}
             Update & Verify
           </button>
        </div>

      </div>

    </div>
  )
}
