'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, ChevronDown, Check, Clock, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const FILTERS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7days', label: 'Last 7 Days' },
  { id: 'all', label: 'All Time' },
]

export function DashboardFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentFilter = searchParams.get('date') || 'all'
  const customDate = searchParams.get('customDate') || ''
  
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleFilterSelect = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('date', id)
    params.delete('customDate')
    router.push(`?${params.toString()}`)
    setIsOpen(false)
  }

  const handleCustomDateChange = (date: string) => {
    if (!date) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('date', 'custom')
    params.set('customDate', date)
    router.push(`?${params.toString()}`)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    const params = new URLSearchParams(searchParams.toString())
    params.set('date', 'all')
    params.delete('customDate')
    router.push(`?${params.toString()}`)
    setIsOpen(false)
  }

  const activeLabel = currentFilter === 'custom' 
    ? `Date: ${customDate}` 
    : FILTERS.find(f => f.id === currentFilter)?.label || 'All Time'

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-white border border-[#e2e8f0] rounded-[16px] shadow-sm hover:border-[#3b82f6] hover:shadow-md transition-all duration-300 group min-w-[180px]"
      >
        <div className="w-8 h-8 rounded-[10px] bg-[#f8fafc] text-[#64748b] flex items-center justify-center group-hover:bg-[#eff6ff] group-hover:text-[#3b82f6] transition-colors shrink-0">
          <Calendar size={18} />
        </div>
        <div className="flex flex-col items-start overflow-hidden">
          <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest leading-none mb-0.5">Audit Period</span>
          <span className="text-[13px] font-bold text-[#0f172a] flex items-center gap-2 truncate">
            {activeLabel} <ChevronDown size={14} className={`transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[260px] bg-white border border-[#e2e8f0] rounded-[24px] shadow-2xl p-2 z-[999] animate-in fade-in zoom-in duration-200">
          <div className="p-2 mb-1 flex justify-between items-center">
            <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest px-2">Select Range</span>
            {(currentFilter !== 'all' || customDate) && (
              <button 
                onClick={handleClear}
                className="text-[10px] font-black text-red-500 uppercase tracking-widest px-2 hover:bg-red-50 rounded py-1 transition-colors flex items-center gap-1"
              >
                Clear <X size={10} />
              </button>
            )}
          </div>
          
          <div className="space-y-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleFilterSelect(f.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-[16px] transition-all hover:bg-[#f8fafc] group ${currentFilter === f.id ? 'bg-[#eff6ff] text-[#3b82f6]' : 'text-[#64748b]'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center transition-colors ${currentFilter === f.id ? 'bg-white' : 'bg-[#f8fafc] group-hover:bg-white'}`}>
                    {f.id === 'all' ? <Clock size={16} /> : <Calendar size={16} />}
                  </div>
                  <span className="text-[14px] font-bold">{f.label}</span>
                </div>
                {currentFilter === f.id && <Check size={16} className="text-[#3b82f6]" />}
              </button>
            ))}
          </div>

          <div className="my-2 border-t border-[#f1f5f9]" />
          
          <div className="p-2">
            <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest px-2 mb-2 block">Custom Date Audit</span>
            <div className="relative group">
              <input 
                type="date" 
                value={customDate}
                onChange={(e) => handleCustomDateChange(e.target.value)}
                className="w-full px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[16px] text-[14px] font-bold text-[#0f172a] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] cursor-pointer"
              />
              <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none group-focus-within:text-[#3b82f6] transition-colors" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

