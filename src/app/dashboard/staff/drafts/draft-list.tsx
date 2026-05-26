'use client'

import { useState } from 'react'
import { resolveDraft } from './actions'
import { DollarSign, CreditCard, Clock, User, Package } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'

export function DraftList({ initialDrafts }: { initialDrafts: any[] }) {
  const [drafts, setDrafts] = useState(initialDrafts)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const { showToast } = useToast()
  const router = useRouter()

  const handleResolve = async (id: string, resolution: 'cash' | 'credit') => {
    setLoadingId(id)
    try {
      const result = await resolveDraft(id, resolution)
      if (result.error) {
        showToast(result.error, 'error')
      } else {
        showToast(`Draft marked as ${resolution.toUpperCase()}`, 'success')
        setDrafts(drafts.filter(d => d.id !== id))
        router.refresh()
      }
    } catch (e) {
      showToast('An error occurred', 'error')
    }
    setLoadingId(null)
  }

  return (
    <div className="space-y-4">
      {drafts.map(draft => {
        const qty = draft.sale_items?.reduce((acc: number, item: any) => acc + item.quantity + (item.free_quantity || 0), 0) || 0

        return (
          <div key={draft.id} className="bg-white border border-[#e2e8f0] rounded-[16px] p-5 shadow-sm hover:border-[#cbd5e1] transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="bg-[#f1f5f9] text-[#475569] px-2.5 py-1 rounded-[6px] text-[11px] font-black tracking-widest uppercase flex items-center gap-1.5">
                    <Clock size={12} strokeWidth={3} /> Draft
                  </span>
                  <span suppressHydrationWarning className="text-[12px] font-bold text-[#94a3b8]">
                    {new Date(draft.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <User size={16} className="text-[#3b82f6]" />
                  <span className="text-[15px] font-black text-[#0f172a]">{draft.customer?.name}</span>
                </div>

                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#64748b]">
                    <Package size={14} />
                    {qty} Liters
                  </div>
                  <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#0f172a]">
                    <DollarSign size={14} className="text-[#10b981]" />
                    ${Number(draft.total_amount).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <button
                  onClick={() => handleResolve(draft.id, 'cash')}
                  disabled={loadingId !== null}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#eff6ff] hover:bg-[#dbeafe] text-[#3b82f6] border border-[#bfdbfe] px-4 py-2.5 rounded-[10px] text-[13px] font-bold transition-colors disabled:opacity-50"
                >
                  <DollarSign size={16} />
                  Cash
                </button>
                <button
                  onClick={() => handleResolve(draft.id, 'credit')}
                  disabled={loadingId !== null}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#fff7ed] hover:bg-[#ffedd5] text-[#f59e0b] border border-[#fed7aa] px-4 py-2.5 rounded-[10px] text-[13px] font-bold transition-colors disabled:opacity-50"
                >
                  <CreditCard size={16} />
                  Debt
                </button>
              </div>

            </div>
          </div>
        )
      })}
    </div>
  )
}
