'use client'

import { useActionState, useEffect } from 'react'
import { logProduction } from '@/app/dashboard/superadmin/actions'
import { Droplet, Plus, Factory } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

export function ProductionTracker({ totalInventory }: { totalInventory: number }) {
  const [state, formAction, isPending] = useActionState(logProduction, null)
  const { showToast } = useToast()

  useEffect(() => {
    if (state?.message) {
      if (state.error) {
        showToast(state.message, 'error')
      } else {
        showToast(state.message, 'success')
      }
    }
  }, [state, showToast])

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[24px] p-6 shadow-sm flex flex-col md:flex-row gap-8 items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 rounded-[18px] bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center shrink-0">
          <Factory size={32} strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-[12px] font-black text-[#94a3b8] uppercase tracking-[0.2em] mb-1">Main Liquid Reservoir</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-[36px] font-black text-[#0f172a] tabular-nums tracking-tighter leading-none">
              {totalInventory.toLocaleString()}
            </span>
            <span className="text-[14px] font-bold text-[#3b82f6] uppercase tracking-widest">Liters</span>
          </div>
        </div>
      </div>

      <form action={formAction} className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
        <div className="relative w-full sm:w-[250px]">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Droplet size={16} className="text-[#94a3b8]" />
          </div>
          <input
            type="number"
            name="liters"
            required
            placeholder="Enter Liters Produced..."
            className="w-full h-12 pl-11 pr-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[12px] text-[14px] font-bold text-[#0f172a] placeholder:text-[#94a3b8] placeholder:font-medium focus:outline-none focus:border-[#3b82f6] focus:ring-4 focus:ring-[#3b82f6]/10 transition-all"
            min="1"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="h-12 px-6 bg-[#0f172a] hover:bg-black text-white font-bold text-[13px] rounded-[12px] flex items-center justify-center gap-2 transition-all w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Plus size={16} strokeWidth={2.5} />
          {isPending ? 'Logging...' : 'Log Production'}
        </button>
      </form>
    </div>
  )
}
