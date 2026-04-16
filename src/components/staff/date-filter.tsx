'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Calendar } from 'lucide-react'

export function DateFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentDate = searchParams.get('date') || new Date().toISOString().split('T')[0]

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams)
    const newDate = e.target.value
    if (newDate) {
      params.set('date', newDate)
    } else {
      params.delete('date')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleQuickSelect = (type: 'today' | 'yesterday' | 'all') => {
    const params = new URLSearchParams(searchParams)
    if (type === 'all') {
      params.set('date', 'all')
    } else {
      const d = new Date()
      if (type === 'yesterday') {
        d.setDate(d.getDate() - 1)
      }
      const dateString = d.toISOString().split('T')[0]
      params.set('date', dateString)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const isAllTime = currentDate === 'all'

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-1.5 rounded-[16px] shadow-sm border border-[#e2e8f0]">
      <div className="flex bg-[#f1f5f9] p-1 rounded-[12px]">
        <button
          onClick={() => handleQuickSelect('today')}
          className={`px-4 py-1.5 text-[13px] font-bold rounded-[8px] transition-all capitalize ${
            currentDate === new Date().toISOString().split('T')[0]
              ? 'bg-white text-[#0f172a] shadow-sm'
              : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => handleQuickSelect('yesterday')}
          className={`px-4 py-1.5 text-[13px] font-bold rounded-[8px] transition-all capitalize ${
            currentDate === new Date(Date.now() - 86400000).toISOString().split('T')[0]
              ? 'bg-white text-[#0f172a] shadow-sm'
              : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          Yesterday
        </button>
        <button
          onClick={() => handleQuickSelect('all')}
          className={`px-4 py-1.5 text-[13px] font-bold rounded-[8px] transition-all capitalize ${
            isAllTime
              ? 'bg-white text-[#0f172a] shadow-sm'
              : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          All Time
        </button>
      </div>

      <div className="w-[1px] h-6 bg-[#cbd5e1] hidden sm:block"></div>

      <div className="relative pr-2">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" size={16} />
        <input
          type="date"
          value={isAllTime ? '' : currentDate}
          onChange={handleDateChange}
          className="pl-9 pr-3 py-1.5 min-w-[140px] text-[13px] font-bold text-[#0f172a] bg-transparent outline-none cursor-pointer"
        />
      </div>
    </div>
  )
}
