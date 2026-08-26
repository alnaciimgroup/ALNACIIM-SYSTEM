'use client'

import { useState, useTransition } from 'react'
import { approveBackdateSale, rejectBackdateSale } from './actions'
import { Calendar, User, Clock, Check, X, Tag, DollarSign, ShoppingBag, ArrowRight } from 'lucide-react'

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
      } catch (e) { const err = e as any;
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
      } catch (e) { const err = e as any;
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
        <div className={`p-4 rounded-[16px] text-[13px] font-bold mb-6 border animate-fadeIn shadow-sm ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          {message.text}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md rounded-[28px] border border-[#e2e8f0]/60 p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-[24px] flex items-center justify-center mx-auto mb-6 border border-[#e2e8f0]/40 shadow-inner">
            <Clock size={32} strokeWidth={2} className="text-[#3b82f6]" />
          </div>
          <h3 className="text-[18px] font-black text-[#0f172a] uppercase tracking-wider mb-2">All Caught Up</h3>
          <p className="text-[14px] text-[#64748b] font-semibold max-w-sm mx-auto">No pending backdate requests are waiting. All logged sales are fully audited!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {requests.map((req) => {
            const litersSold = req.sale_items?.reduce((acc, item) => acc + Number(item.quantity), 0) || 0
            const freeLiters = req.sale_items?.reduce((acc, item) => acc + Number(item.free_quantity), 0) || 0
            const isProcessing = activeId === req.id

            return (
              <div 
                key={req.id} 
                className="bg-white rounded-[28px] border border-[#e2e8f0]/80 shadow-[0_10px_30px_rgba(15,23,42,0.02)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.05)] transition-all duration-500 overflow-hidden p-6 md:p-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative border-t-4 border-t-[#3b82f6]"
              >
                {/* Main Card Info Block */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 xl:gap-8 items-stretch">
                  
                  {/* Left Column: Customer & Staff details */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-black text-[#2563eb] uppercase tracking-widest bg-blue-50 border border-blue-100 px-3 py-1 rounded-full shadow-sm inline-block mb-3">
                        Box ID: {req.customer?.tank_number || 'N/A'}
                      </span>
                      <h3 className="text-[18px] font-black text-[#0f172a] tracking-tight leading-snug mb-2">
                        {req.customer?.name || 'Unknown Customer'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-black text-[#64748b] border border-slate-200">
                        {req.staff?.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-[#94a3b8] uppercase tracking-widest leading-none">Logged By</span>
                        <span className="text-[13px] font-bold text-[#334155]">{req.staff?.full_name || 'System'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Volume (Liters) & Financial Metrics */}
                  <div className="flex items-center justify-around bg-[#f8fafc] rounded-[20px] p-4 border border-[#e2e8f0]/40">
                    <div className="text-center">
                      <span className="text-[9px] font-black text-[#64748b] uppercase tracking-widest block mb-1">Quantity</span>
                      <div className="text-[20px] font-black text-[#0f172a] tracking-tight">
                        {litersSold}L
                      </div>
                      {freeLiters > 0 && (
                        <span className="text-[10px] font-black text-[#10b981] bg-[#ecfdf5] border border-[#d1fae5] px-2 py-0.5 rounded-full mt-1 inline-block">
                          +{freeLiters}L Free
                        </span>
                      )}
                    </div>

                    <div className="h-10 w-[1px] bg-slate-200" />

                    <div className="text-center">
                      <span className="text-[9px] font-black text-[#64748b] uppercase tracking-widest block mb-1">Total Due</span>
                      <div className="text-[22px] font-black text-[#2563eb] tracking-tight leading-none">
                        ${req.total_amount.toFixed(2)}
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border mt-2 inline-block ${
                        req.sale_type === 'cash' 
                          ? 'bg-[#ecfdf5] text-emerald-600 border-[#d1fae5]' 
                          : 'bg-[#fffbeb] text-amber-600 border-[#fef3c7]'
                      }`}>
                        {req.sale_type}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Date adjustments & Backdate Reason */}
                  <div className="flex flex-col justify-between gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748b]">
                        <Calendar size={13} className="text-[#94a3b8]" />
                        System Time: {formatDate(req.created_at)}
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px] font-black text-rose-600 bg-rose-50 border border-rose-100 p-2 rounded-[10px] w-fit shadow-sm">
                        <Clock size={14} />
                        Requesting Date: {req.requested_date}
                      </div>
                    </div>

                    <div className="bg-[#fefaf3] rounded-[16px] p-4 border border-[#fdf2e2] relative">
                      <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block mb-1">Staff Note / Reason</span>
                      <p className="text-[13px] font-bold text-slate-700 italic leading-snug">
                        "{req.backdate_reason || 'No reason provided.'}"
                      </p>
                    </div>
                  </div>

                </div>

                {/* Right Side: Action Buttons */}
                <div className="flex xl:flex-col gap-3 min-w-[140px] pt-4 xl:pt-0 border-t xl:border-t-0 xl:border-l border-[#e2e8f0]/60 xl:pl-6">
                  <button
                    onClick={() => handleApprove(req.id)}
                    disabled={isProcessing}
                    className="flex-1 xl:w-full h-12 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-black text-[12px] uppercase tracking-widest rounded-[14px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-[0.98] disabled:opacity-50"
                  >
                    <Check size={16} strokeWidth={3} /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    disabled={isProcessing}
                    className="flex-1 xl:w-full h-12 bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-300 text-rose-600 font-black text-[12px] uppercase tracking-widest rounded-[14px] transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                  >
                    <X size={16} strokeWidth={3} /> Reject
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
