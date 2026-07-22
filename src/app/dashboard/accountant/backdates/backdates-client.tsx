'use client'

import { useState, useTransition } from 'react'
import { approveBackdateSale, rejectBackdateSale } from './actions'
import { Calendar, User, UserCheck, Trash2, Clock, Check, X, Tag } from 'lucide-react'

type PendingBackdate = {
  id: string
  total_amount: number
  sale_type: string
  status: string
  created_at: string
  discount_amount: number
  requested_date: string | null
  backdate_reason: string | null
  staff: { id: string; full_name: string } | null
  customer: { id: string; name: string; tank_number: string } | null
  sale_items: { quantity: number; free_quantity: number; unit_price: number }[]
}

export function BackdatesClient({ initialRequests }: { initialRequests: PendingBackdate[] }) {
  const [requests, setRequests] = useState<PendingBackdate[]>(initialRequests)
  const [isPending, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const handleApprove = async (id: string) => {
    if (activeId) return
    setActiveId(id)
    setMessage(null)
    
    startTransition(async () => {
      try {
        const res = await approveBackdateSale(id)
        if (res.success) {
          setMessage({ text: res.message, type: 'success' })
          setRequests(prev => prev.filter(r => r.id !== id))
        } else {
          setMessage({ text: res.message, type: 'error' })
        }
      } catch (err) {
        setMessage({ text: 'An unexpected error occurred.', type: 'error' })
      } finally {
        setActiveId(null)
      }
    })
  }

  const handleReject = async (id: string) => {
    if (activeId) return
    if (!confirm('Are you sure you want to reject and cancel this backdate request?')) return
    setActiveId(id)
    setMessage(null)

    startTransition(async () => {
      try {
        const res = await rejectBackdateSale(id)
        if (res.success) {
          setMessage({ text: res.message, type: 'success' })
          setRequests(prev => prev.filter(r => r.id !== id))
        } else {
          setMessage({ text: res.message, type: 'error' })
        }
      } catch (err) {
        setMessage({ text: 'An unexpected error occurred.', type: 'error' })
      } finally {
        setActiveId(null)
      }
    })
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="w-full max-w-[1200px]">
      {message && (
        <div className={`p-4 rounded-[12px] text-[13px] font-bold mb-6 border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {message.text}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-[#e2e8f0] p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#e2e8f0]">
            <Clock size={28} strokeWidth={2} />
          </div>
          <h3 className="text-[16px] font-black text-[#0f172a] uppercase tracking-wider mb-1">No Pending Backdates</h3>
          <p className="text-[13px] text-[#64748b] font-medium max-w-sm mx-auto">All missed sale requests from staff members have been reviewed and audited.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {requests.map((req) => {
            const litersSold = req.sale_items?.reduce((acc, item) => acc + Number(item.quantity), 0) || 0
            const freeLiters = req.sale_items?.reduce((acc, item) => acc + Number(item.free_quantity), 0) || 0
            const isProcessing = activeId === req.id

            return (
              <div key={req.id} className="bg-white rounded-[24px] border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col md:flex-row md:items-center justify-between p-6 gap-6">
                
                {/* Sale info & details */}
                <div className="flex-1 flex flex-col md:flex-row gap-6 md:items-center">
                  {/* Left block: Customer and staff info */}
                  <div className="min-w-[220px]">
                    <span className="text-[10px] font-black text-[#3b82f6] uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      Box ID: {req.customer?.tank_number || 'N/A'}
                    </span>
                    <h3 className="text-[16px] font-black text-[#0f172a] tracking-tight mt-2 mb-1">
                      {req.customer?.name || 'Unknown Customer'}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#64748b]">
                      <User size={13} />
                      Staff: <span className="text-[#334155] font-bold">{req.staff?.full_name || 'System'}</span>
                    </div>
                  </div>

                  {/* Middle block: Liters & Total money */}
                  <div className="flex items-center gap-6 border-l border-r border-[#f1f5f9] px-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest">Liters</span>
                      <span className="text-[15px] font-bold text-[#0f172a]">
                        {litersSold}L {freeLiters > 0 && <span className="text-[#10b981] text-[11px] font-extrabold">(+{freeLiters} Free)</span>}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest">Total</span>
                      <span className="text-[18px] font-black text-[#3b82f6]">
                        ${req.total_amount.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest">Type</span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${req.sale_type === 'cash' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        {req.sale_type}
                      </span>
                    </div>
                  </div>

                  {/* Right block: Dates & Reason */}
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                        <Calendar size={12} />
                        Logged: <span className="text-slate-700">{formatDate(req.created_at)}</span>
                      </div>
                      <div className="text-[11px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100/50 flex items-center gap-1">
                        <Clock size={10} />
                        Requesting: {req.requested_date}
                      </div>
                    </div>

                    <div className="bg-[#f8fafc] rounded-[10px] p-3 border border-[#f1f5f9] text-[12px] font-medium text-[#475569]">
                      <span className="font-extrabold text-[#64748b] uppercase text-[9px] tracking-wider block mb-0.5">Reason for Backdating</span>
                      "{req.backdate_reason || 'No reason provided.'}"
                    </div>
                  </div>
                </div>

                {/* Approve/Reject Actions */}
                <div className="flex md:flex-col items-center gap-2 min-w-[120px]">
                  <button
                    onClick={() => handleApprove(req.id)}
                    disabled={isProcessing}
                    className="flex-1 md:w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-widest rounded-[12px] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Check size={14} strokeWidth={3} /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    disabled={isProcessing}
                    className="flex-1 md:w-full h-10 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 font-black text-[11px] uppercase tracking-widest rounded-[12px] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <X size={14} strokeWidth={3} /> Reject
                  </button>
                </div>

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
