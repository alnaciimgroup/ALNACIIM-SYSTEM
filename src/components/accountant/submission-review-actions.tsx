'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { updateSubmissionStatus, approveAndCreateMissingSubmission } from '@/app/dashboard/accountant/submissions/actions'
import { useToast } from '@/components/ui/toast'

interface Props {
  submissionId: string
  currentStatus: string
  // Extra props for MISSING (unsubmitted) rows
  isMissingRow?: boolean
  staffId?: string
  submissionDate?: string
  systemExpectedCash?: number
  systemExpectedCredit?: number
}

export function SubmissionReviewActions({ 
  submissionId, 
  currentStatus,
  isMissingRow,
  staffId,
  submissionDate,
  systemExpectedCash = 0,
  systemExpectedCredit = 0
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [localStatus, setLocalStatus] = useState(currentStatus)
  const { showToast } = useToast()

  // --- APPROVE handler ---
  const handleApprove = () => {
    const confirmed = window.confirm(
      'Are you sure you want to APPROVE this submission? This action will be audited.'
    )
    if (!confirmed) return

    startTransition(async () => {
      try {
        if (isMissingRow && staffId && submissionDate) {
          // MISSING row: create + verify in one step
          await approveAndCreateMissingSubmission(staffId, submissionDate, systemExpectedCash, systemExpectedCredit)
        } else {
          await updateSubmissionStatus(submissionId, 'verified')
        }
        setLocalStatus('verified')
        showToast('Submission approved and verified ✓', 'success')
      } catch (err: any) {
        console.error(err)
        showToast(err?.message || 'Failed to approve submission. Please try again.', 'error')
      }
    })
  }

  // --- DISPUTE handler ---
  const handleDispute = () => {
    const confirmed = window.confirm(
      'Are you sure you want to DISPUTE this submission? This will flag it for review.'
    )
    if (!confirmed) return

    startTransition(async () => {
      try {
        await updateSubmissionStatus(submissionId, 'disputed')
        setLocalStatus('disputed')
        showToast('Submission flagged as disputed.', 'success')
      } catch (err: any) {
        showToast(err?.message || 'Failed to update status. Please try again.', 'error')
      }
    })
  }

  // VERIFIED: show locked badge only — no revert in the table (use detail modal)
  if (localStatus === 'verified') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-4 py-2 bg-[#ecfdf5] text-[#10b981] text-[11px] font-black uppercase tracking-widest rounded-[8px] border border-[#10b981]/20">
          <CheckCircle2 size={14} /> Verified
        </div>
      </div>
    )
  }

  // PENDING or MISSING: show Approve + Dispute
  return (
    <div className="flex items-center justify-end gap-2">
      <button 
        onClick={handleApprove}
        disabled={isPending}
        className="flex items-center gap-1.5 px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-white text-[11px] font-black uppercase tracking-widest rounded-[8px] transition-colors shadow-sm disabled:opacity-50 active:scale-95"
      >
        {isPending ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />} Approve
      </button>

      {/* Only show Dispute for real submissions (not virtual missing rows) */}
      {!isMissingRow && (
        <button 
          onClick={handleDispute}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-black uppercase tracking-widest rounded-[8px] transition-colors disabled:opacity-50"
        >
          Dispute
        </button>
      )}
    </div>
  )
}
