'use client'

import { useState } from 'react'
import { ArrowDownToLine, ShoppingBag, ClipboardList, Banknote, CreditCard, Users, DollarSign, Wallet, ArrowDownCircle, Gift, X } from 'lucide-react'

interface StaffMetricsProps {
  tanksReceived: number
  tanksSold: number
  remainingTanks: number
  remainingFreeTanks?: number
  cashSalesToday: number
  creditSalesToday: number
  debtPaymentsToday: number
  moneyCollectedToday: number
  outstandingDebt: number
  freeTanksToday?: number
  freeWaterDetails?: any[]
}

export function StaffMetricsCards({ metrics }: { metrics: StaffMetricsProps }) {
  const [showFreeModal, setShowFreeModal] = useState(false)

  const cards = [
    { title: 'Liters Received', value: metrics.tanksReceived, icon: ArrowDownToLine, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Liters Sold', value: metrics.tanksSold, icon: ShoppingBag, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { title: 'Available Liters', value: metrics.remainingTanks, icon: ClipboardList, color: 'text-amber-500', bg: 'bg-amber-50' },
    { title: 'Cash Collected', value: `$${metrics.moneyCollectedToday}`, icon: Banknote, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Credit (Debt)', value: `$${metrics.creditSalesToday}`, icon: CreditCard, color: 'text-orange-500', bg: 'bg-orange-50' },
    { title: 'Debt Payments', value: `$${metrics.debtPaymentsToday}`, icon: ArrowDownCircle, color: 'text-teal-500', bg: 'bg-teal-50' },
    { title: 'Total Money in Debt', value: `$${metrics.outstandingDebt}`, icon: Wallet, color: 'text-red-500', bg: 'bg-red-50' },
    { title: 'Free Liters Given', value: metrics.freeTanksToday || 0, icon: Gift, color: 'text-purple-500', bg: 'bg-purple-50', onClick: () => setShowFreeModal(true), cursor: 'cursor-pointer hover:border-purple-300' }
  ]

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, i) => (
          <div key={i} onClick={card.onClick} className={`bg-white p-6 rounded-[24px] border border-[#e5e7eb] shadow-sm flex items-center gap-5 transition-all hover:shadow-md ${card.cursor || ''}`}>
            <div className={`w-12 h-12 rounded-full ${card.bg} flex items-center justify-center shrink-0`}>
              <card.icon className={card.color} size={22} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-[#64748b] leading-none mb-1.5 uppercase tracking-wide opacity-80">{card.title}</span>
              <span className="text-[26px] font-black text-[#0f172a] leading-none tracking-tight">{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      {showFreeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-[#f1f5f9] flex justify-between items-center bg-[#f8fafc]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <Gift size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-[18px] font-black text-[#0f172a] uppercase tracking-tight leading-none mb-1">Free Water Audit</h2>
                  <p className="text-[13px] font-medium text-[#64748b] leading-none">Complete list of free liters distributed.</p>
                </div>
              </div>
              <button onClick={() => setShowFreeModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors">
                <X size={16} strokeWidth={3} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {metrics.freeWaterDetails && metrics.freeWaterDetails.length > 0 ? (
                <div className="space-y-3">
                  {metrics.freeWaterDetails.map((detail, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[16px]">
                      <div>
                        <div className="font-bold text-[#0f172a] text-[15px]">{detail.customerName}</div>
                        <div className="text-[12px] font-medium text-[#64748b]">{detail.customerPhone}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 text-[11px] font-black uppercase tracking-widest rounded-md ${detail.type === '100% Free' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'}`}>{detail.type}</span>
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
