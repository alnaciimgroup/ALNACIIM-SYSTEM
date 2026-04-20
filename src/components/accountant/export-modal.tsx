'use client'

import { useState } from 'react'
import { X, Download, Calendar, Clock, Filter, AlertCircle, CheckCircle2, Loader2, FileSpreadsheet, Package } from 'lucide-react'
import { generateFinancialExport } from '@/app/dashboard/accountant/export/actions'
import { useToast } from '@/components/ui/toast'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [range, setRange] = useState('7days')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [isPending, setIsPending] = useState(false)
  const { showToast } = useToast()

  if (!isOpen) return null

  const triggerDownload = (content: string, filename: string) => {
    if (!content || content.split('\n').length <= 1) return false
    
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    return true
  }

  const handleExport = async () => {
    if (range === 'custom' && (!customStart || !customEnd)) {
      showToast('Please select both start and end dates', 'error')
      return
    }

    setIsPending(true)
    try {
      const result = await generateFinancialExport(range, range === 'custom' ? { start: customStart, end: customEnd } : undefined)
      
      const timestamp = new Date().toISOString().split('T')[0]
      let downloadedCount = 0

      // Individual file naming map
      const fileNames: Record<string, string> = {
        sales: `Sales_Report_${range}_${timestamp}.csv`,
        payments: `Payments_Received_${range}_${timestamp}.csv`,
        submissions: `Staff_Cash_Submissions_${range}_${timestamp}.csv`,
        distributions: `Inventory_Distributions_${range}_${timestamp}.csv`,
        ledger: `Unified_Financial_Ledger_${range}_${timestamp}.csv`
      }

      // Download each dataset sequentially
      for (const [key, content] of Object.entries(result)) {
        const success = triggerDownload(content, fileNames[key] || `${key}.csv`)
        if (success) {
          downloadedCount++
          // Optional small delay for browser stability
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }
      
      if (downloadedCount === 0) {
        showToast('No records found for the selected range', 'error')
      } else {
        showToast(`Successfully prepared ${downloadedCount} datasets for download!`, 'success')
        onClose()
      }
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Failed to generate export', 'error')
    } finally {
      setIsPending(false)
    }
  }

  const presets = [
    { id: 'today', label: 'Today', icon: <Clock size={16} /> },
    { id: 'this_week', label: 'This Week', icon: <Calendar size={16} /> },
    { id: '7days', label: 'Last 7 Days', icon: <Filter size={16} /> },
    { id: 'this_month', label: 'This Month', icon: <Calendar size={16} /> },
    { id: 'last_month', label: 'Last Month', icon: <Clock size={16} /> },
    { id: 'all', label: 'All Time', icon: <Calendar size={16} /> },
    { id: 'custom', label: 'Custom Range', icon: <Calendar size={16} /> },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-[520px] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[18px] bg-[#3b82f6] text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Package size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[20px] font-black text-[#0f172a] leading-tight uppercase tracking-tight">Structured Export</h3>
              <p className="text-[13px] font-bold text-[#64748b] uppercase tracking-widest mt-0.5">Multi-Dataset Download</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-[#94a3b8] hover:bg-[#eff6ff] hover:text-[#3b82f6] rounded-full transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Preset Selector */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-[#94a3b8] uppercase tracking-[0.2em] block">Timeframe Selection</label>
            <div className="grid grid-cols-2 gap-3">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setRange(p.id)}
                  className={`flex items-center gap-3 p-4 rounded-[22px] border-2 transition-all text-left group ${
                    range === p.id 
                      ? 'bg-[#eff6ff] border-[#3b82f6] text-[#3b82f6]' 
                      : 'bg-white border-[#f1f5f9] text-[#64748b] hover:border-[#e2e8f0] hover:bg-[#f8fafc]'
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-colors ${
                    range === p.id ? 'bg-[#3b82f6] text-white' : 'bg-[#f8fafc] text-[#94a3b8] group-hover:bg-[#e2e8f0]'
                  }`}>
                    {p.icon}
                  </div>
                  <span className="text-[14px] font-black uppercase tracking-tight leading-none">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range Picker */}
          {range === 'custom' && (
            <div className="space-y-4 p-6 bg-[#f8fafc] rounded-[24px] border border-[#e2e8f0] animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest leading-none">Start Date</label>
                  <input 
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full bg-white border border-[#e2e8f0] rounded-[14px] px-4 py-3 text-[14px] font-bold text-[#0f172a] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest leading-none">End Date</label>
                  <input 
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full bg-white border border-[#e2e8f0] rounded-[14px] px-4 py-3 text-[14px] font-bold text-[#0f172a] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Alert / Notice */}
          <div className="flex gap-4 p-5 bg-[#f0f9ff] rounded-[24px] border border-[#bae6fd]">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-[#bae6fd]">
              <FileSpreadsheet size={20} className="text-[#0369a1]" />
            </div>
            <div>
              <p className="text-[13px] font-black text-[#0369a1] uppercase tracking-tight mb-1">Batch Export Mode</p>
              <p className="text-[12px] font-medium text-[#0c4a6e] leading-relaxed">
                The system will generate separate, clean CSV files for **Sales, Payments, Submissions, and Distributions**.
              </p>
              <p className="text-[10px] font-bold text-[#0369a1] mt-2 flex items-center gap-1.5 grayscale opacity-70 italic">
                <AlertCircle size={10} /> Note: Your browser might request permission for multiple downloads.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#f8fafc] px-8 py-6 flex gap-4 border-t border-[#e2e8f0]">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-4 text-[14px] font-black text-[#64748b] hover:bg-[#e2e8f0] rounded-[18px] transition-all uppercase tracking-widest"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isPending}
            className="flex-[2] px-6 py-4 bg-[#3b82f6] text-white text-[14px] font-black rounded-[18px] shadow-xl shadow-blue-500/20 transition-all hover:bg-[#2563eb] active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 uppercase tracking-widest"
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" size={20} strokeWidth={3} />
                Extracting Data...
              </>
            ) : (
              <>
                <Download size={20} strokeWidth={3} />
                Download All Files
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
