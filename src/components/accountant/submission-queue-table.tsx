'use client'

import { useState } from 'react'
import { User, CheckCircle2, ShieldAlert, Clock, AlertCircle, Hash, ChevronRight } from 'lucide-react'
import { SubmissionReviewActions } from './submission-review-actions'
import { SubmissionReviewModal } from './submission-review-modal'

interface Submission {
  id: string
  staff_id: string
  submission_date: string
  tanks_sold: number
  money_collected: number
  submitted_amount: number
  difference_amount: number
  debt_amount?: number
  status: string
  note?: string
  created_at: string
}

interface Props {
  submissions: Submission[]
  staffMap: Record<string, string>
}

export function SubmissionQueueTable({ submissions, staffMap }: Props) {
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null)

  return (
    <>
      <div className="bg-white border border-[#e5e7eb] shadow-sm rounded-[28px] overflow-hidden">
        <div className="p-6 border-b border-[#f1f5f9] bg-[#f8fafc]/50 flex justify-between items-center">
           <h3 className="text-[14px] font-black text-[#0f172a] uppercase tracking-widest flex items-center gap-2">
             <Hash size={16} className="text-[#3b82f6]" /> Daily Audit Queue
           </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc]">
                <th className="py-5 px-8 text-[11px] font-black text-[#94a3b8] uppercase tracking-widest border-b border-[#f1f5f9]">Staff Identity</th>
                <th className="py-5 text-[11px] font-black text-[#94a3b8] uppercase tracking-widest border-b border-[#f1f5f9]">Expected</th>
                <th className="py-5 text-[11px] font-black text-[#94a3b8] uppercase tracking-widest border-b border-[#f1f5f9]">Collected Today</th>
                <th className="py-5 text-[11px] font-black text-[#94a3b8] uppercase tracking-widest border-b border-[#f1f5f9]">Debt</th>
                <th className="py-5 text-[11px] font-black text-[#94a3b8] uppercase tracking-widest border-b border-[#f1f5f9]">Status</th>
                <th className="py-5 pr-8 text-[11px] font-black text-[#94a3b8] uppercase tracking-widest border-b border-[#f1f5f9] text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {submissions.map(sub => {
                const staffName = staffMap[sub.staff_id] || 'Unknown Staff'
                
                return (
                  <tr 
                    key={sub.id} 
                    className="group hover:bg-[#f8fafc] transition-all cursor-pointer"
                    onClick={() => setSelectedSub(sub)}
                  >
                    <td className="py-6 px-8">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#64748b] group-hover:bg-[#3b82f6] group-hover:text-white transition-colors">
                             <User size={18} strokeWidth={2.5} />
                          </div>
                          <div className="flex flex-col">
                             <span className="font-black text-[#0f172a] text-[14px] uppercase tracking-tight group-hover:text-[#3b82f6] transition-colors">
                               {staffName}
                             </span>
                             <span className="text-[10px] font-bold text-[#94a3b8] uppercase">
                               <span suppressHydrationWarning>Date: {new Date(sub.submission_date).toLocaleDateString()}</span>
                             </span>
                          </div>
                       </div>
                    </td>
                    <td className="py-6">
                       <span className="text-[15px] font-bold text-[#64748b]">${Number(sub.money_collected).toFixed(2)}</span>
                    </td>
                    <td className="py-6">
                       <span className="text-[17px] font-black text-[#0f172a] tracking-tighter">${Number(sub.submitted_amount).toFixed(2)}</span>
                    </td>
                    <td className="py-6">
                       <span className="text-[15px] font-black text-red-500">
                          ${Number(sub.debt_amount || 0).toFixed(2)}
                       </span>
                    </td>
                    <td className="py-6">
                       <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] border-2 ${
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
                    <td className="py-6 pr-8 text-right">
                       <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <SubmissionReviewActions submissionId={sub.id} currentStatus={sub.status} />
                          <div className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#e2e8f0] text-[#94a3b8] transition-colors cursor-pointer" onClick={() => setSelectedSub(sub)}>
                             <ChevronRight size={18} />
                          </div>
                       </div>
                    </td>
                  </tr>
                )
              })}

              {submissions.length === 0 && (
                <tr>
                   <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                         <div className="w-16 h-16 rounded-full bg-[#f8fafc] flex items-center justify-center text-[#cbd5e1]">
                            <AlertCircle size={32} />
                         </div>
                         <p className="text-[14px] font-bold text-[#94a3b8] uppercase tracking-widest">No matching submissions found</p>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSub && (
        <SubmissionReviewModal 
          submission={selectedSub} 
          staffName={staffMap[selectedSub.staff_id] || 'Unknown Staff'}
          onClose={() => setSelectedSub(null)}
        />
      )}
    </>
  )
}
