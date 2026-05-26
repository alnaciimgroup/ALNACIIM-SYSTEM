'use client'

import { ShoppingCart, Gift, X } from 'lucide-react'
import { useState } from 'react'

export function AccountantFreeSoldCard({ 
  todayFree, 
  auditedFree, 
  isFullyAudited, 
  freeWaterDetails 
}: { 
  todayFree: number
  auditedFree: number
  isFullyAudited: boolean
  freeWaterDetails: any[]
}) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div 
        onClick={() => setShowModal(true)}
        className="bg-white rounded-[24px] p-6 border border-[#e2e8f0] shadow-sm flex flex-col hover:shadow-md transition-all duration-300 cursor-pointer hover:border-[#db2777]/30"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-[16px] bg-[#fdf2f8] text-[#db2777] flex items-center justify-center">
            <ShoppingCart size={24} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col items-end gap-1">
             {isFullyAudited ? (
               <div className="bg-[#ecfdf5] text-[#10b981] px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-[#d1fae5]">Audited</div>
             ) : (
               <div className="bg-[#fff7ed] text-[#f59e0b] px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-[#fed7aa] italic">Pending Review</div>
             )}
             <div className="text-[10px] font-bold text-[#db2777] uppercase tracking-tighter">Free Assets</div>
          </div>
        </div>
        <div className="mt-auto">
          <span className="text-[11px] font-black text-[#64748b] uppercase tracking-widest leading-none mb-1.5 block">Free Sold</span>
          <div className="flex items-baseline gap-2">
            <div className="text-[32px] font-black text-[#0f172a] leading-none tracking-tighter">{todayFree?.toLocaleString() ?? 0}</div>
            {auditedFree > 0 && (
              <div className="text-[14px] font-bold text-[#10b981] tracking-tight">/ {auditedFree.toLocaleString()} Audited</div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-[#f1f5f9] flex justify-between items-center bg-[#f8fafc]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                  <Gift size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-[18px] font-black text-[#0f172a] uppercase tracking-tight leading-none mb-1">Free Water Audit</h2>
                  <p className="text-[13px] font-medium text-[#64748b] leading-none">Complete list of free liters distributed.</p>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setShowModal(false) }} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors">
                <X size={16} strokeWidth={3} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {freeWaterDetails && freeWaterDetails.length > 0 ? (
                <div className="space-y-3">
                  {freeWaterDetails.map((detail, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[16px]">
                      <div>
                        <div className="font-bold text-[#0f172a] text-[15px]">{detail.customerName}</div>
                        <div className="text-[12px] font-medium text-[#64748b]">{detail.customerPhone}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 text-[11px] font-black uppercase tracking-widest rounded-md ${detail.type === '100% Free' ? 'bg-emerald-100 text-emerald-600' : 'bg-pink-100 text-pink-600'}`}>{detail.type}</span>
                        <span className="text-[18px] font-black text-[#0f172a]">{detail.amount} <span className="text-[12px] text-[#64748b]">Liters</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[#64748b]">
                  <Gift size={48} strokeWidth={1.5} className="mx-auto mb-4 opacity-20" />
                  <p className="text-[15px] font-bold">No free liters distributed yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
