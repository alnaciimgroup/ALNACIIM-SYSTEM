'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, ShieldAlert, Clock, MoreVertical, Loader2 } from 'lucide-react'
import { updateSubmissionStatus } from '@/app/dashboard/accountant/submissions/actions'

interface Props {
  submissionId: string
  currentStatus: string
}

import { useToast } from '@/components/ui/toast'

export function SubmissionReviewActions({ submissionId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { showToast } = useToast()

  const handleUpdate = (status: string) => {
    setIsMenuOpen(false)
    
    // Add confirmation for sensitive actions
    if (status === 'verified' || status === 'disputed') {
      const confirmed = window.confirm(
        `Are you sure you want to mark this submission as ${status.toUpperCase()}? This action will be audited.`
      )
      if (!confirmed) return
    }

    startTransition(async () => {
      try {
        await updateSubmissionStatus(submissionId, status)
        showToast(`Submission marked as ${status}`, 'success')
      } catch (err) {
        showToast('Failed to update status. Please try again.', 'error')
      }
    })
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {currentStatus !== 'verified' && (
        <>
          <button 
            onClick={() => handleUpdate('verified')}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-white text-[11px] font-black uppercase tracking-widest rounded-[8px] transition-colors shadow-sm disabled:opacity-50 active:scale-95"
          >
            {isPending ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />} Approve
          </button>
          
          <button 
             onClick={() => handleUpdate('disputed')}
             disabled={isPending}
             className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-black uppercase tracking-widest rounded-[8px] transition-colors disabled:opacity-50"
             title="Flag Discrepancy"
          >
             Dispute
          </button>
        </>
      )}

      {currentStatus === 'verified' && (
         <button 
             onClick={() => handleUpdate('pending')}
             disabled={isPending}
             className="flex items-center gap-1.5 px-3 py-2 border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc] text-[11px] font-black uppercase tracking-widest rounded-[8px] transition-colors disabled:opacity-50"
             title="Revert to Pending"
          >
             <Clock size={14} /> Revert
          </button>
      )}
    </div>
  )
}
