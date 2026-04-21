'use client'

import { useState } from 'react'
import { X, Download, Calendar, Clock, Filter, AlertCircle, CheckCircle2, Loader2, FileSpreadsheet, Package, ChevronRight, Hash, Database, History, UserCheck, ShoppingBag } from 'lucide-react'
import { generateUniversalExport, DatasetResult } from '@/app/dashboard/accountant/export/actions'
import { useToast } from '@/components/ui/toast'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
}

type ModalView = 'selector' | 'results'

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [view, setView] = useState<ModalView>('selector')
  const [range, setRange] = useState('7days')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [datasets, setDatasets] = useState<DatasetResult[]>([])
  const { showToast } = useToast()

  if (!isOpen) return null

  const handleClose = () => {
    setView('selector')
    setDatasets([])
    onClose()
  }

  const triggerDownload = (content: string, filename: string) => {
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
  }

  const handleGenerate = async () => {
    if (range === 'custom' && (!customStart || !customEnd)) {
      showToast('Please select both start and end dates', 'error')
      return
    }

    setIsPending(true)
    try {
      const results = await generateUniversalExport(range, range === 'custom' ? { start: customStart, end: customEnd } : undefined)
      setDatasets(results)
      setView('results')
      showToast(`Export engine processed ${results.length} system datasets.`, 'success')
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Export failed', 'error')
    } finally {
      setIsPending(false)
    }
  }

  const handleBatchDownload = async () => {
    // Only batch download Transactions in the filtered range
    const filtered = datasets.filter(d => d.category === 'Transactions' && d.count > 0)
    
    if (filtered.length === 0) {
      showToast('No transactional data found for this range.', 'error')
      return
    }

    showToast(`Starting batch download of ${filtered.length} datasets...`, 'success')
    
    for (const ds of filtered) {
      triggerDownload(ds.csvContent, `${ds.label.replace(/\s+/g, '_')}_${range}.csv`)
      await new Promise(resolve => setTimeout(resolve, 400))
    }
  }

  const presets = [
    { id: 'today', label: 'Today', icon: <Clock size={16} /> },
    { id: 'this_week', label: 'This Week', icon: <Calendar size={16} /> },
    { id: '7days', label: 'Last 7 Days', icon: <Filter size={16} /> },
    { id: 'this_month', label: 'This Month', icon: <Calendar size={16} /> },
    { id: 'last_month', label: 'Last Month', icon: <Clock size={16} /> },
    { id: 'all', label: 'All Time', icon: <Database size={16} /> },
    { id: 'custom', label: 'Custom Range', icon: <Calendar size={16} /> },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={handleClose} />
      
      <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-[600px] max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-6 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[18px] bg-[#3b82f6] text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Package size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[20px] font-black text-[#0f172a] leading-tight uppercase tracking-tight">
                {view === 'selector' ? 'Data Export Station' : 'Download Dashboard'}
              </h3>
              <p className="text-[13px] font-bold text-[#64748b] uppercase tracking-widest mt-0.5">
                {view === 'selector' ? 'Select Audit Timeframe' : `${range.toUpperCase()} System Snapshot`}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="p-2 text-[#94a3b8] hover:bg-[#eff6ff] hover:text-[#3b82f6] rounded-full transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* View Switcher: Selector */}
        {view === 'selector' ? (
          <>
            <div className="p-8 space-y-8 overflow-y-auto">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-[#94a3b8] uppercase tracking-[0.2em] block text-center mb-6">Choose Date Range</label>
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

              <div className="flex gap-4 p-5 bg-[#eff6ff]/50 rounded-[24px] border border-[#3b82f6]/10">
                <AlertCircle size={20} className="text-[#3b82f6] shrink-0" />
                <p className="text-[12px] font-medium text-[#1e40af] leading-relaxed">
                  The engine will scan all system tables for matching records using the **Somalia 4:00 AM work-day window** for maximum audit accuracy.
                </p>
              </div>
            </div>

            <div className="bg-[#f8fafc] px-8 py-6 flex gap-4 border-t border-[#e2e8f0] shrink-0">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-4 text-[14px] font-black text-[#64748b] hover:bg-[#e2e8f0] rounded-[18px] transition-all uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={isPending}
                className="flex-[2] px-6 py-4 bg-[#3b82f6] text-white text-[14px] font-black rounded-[18px] shadow-xl shadow-blue-500/20 transition-all hover:bg-[#2563eb] active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 uppercase tracking-widest"
              >
                {isPending ? (
                  <>
                    <Loader2 className="animate-spin" size={20} strokeWidth={3} />
                    Scanning System...
                  </>
                ) : (
                  <>
                    Generate Summary
                    <ChevronRight size={18} strokeWidth={3} />
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* View Switcher: Results Dashboard */
          <>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
              {/* Transactions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <History size={16} className="text-[#3b82f6]" />
                    <label className="text-[11px] font-black text-[#3b82f6] uppercase tracking-[0.2em]">Transaction Datasets</label>
                  </div>
                  <span className="text-[10px] font-bold text-[#94a3b8] uppercase">Matches found</span>
                </div>
                
                <div className="space-y-2">
                  {datasets.filter(d => d.category === 'Transactions').map(ds => (
                    <div key={ds.id} className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0] hover:border-[#3b82f6]/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ds.count > 0 ? 'bg-white text-[#0f172a] shadow-sm' : 'bg-gray-100 text-[#94a3b8] opacity-50'}`}>
                          {ds.id.includes('sale') ? <ShoppingBag size={18} /> : ds.id.includes('pay') ? <CheckCircle2 size={18} /> : <FileSpreadsheet size={18} />}
                        </div>
                        <div>
                          <p className={`text-[14px] font-black ${ds.count > 0 ? 'text-[#0f172a]' : 'text-[#94a3b8]'}`}>{ds.label}</p>
                          <p className="text-[11px] font-bold text-[#64748b] flex items-center gap-1.5 mt-0.5">
                            <span className={ds.count > 0 ? 'text-[#10b981]' : ''}>{ds.count} records</span>
                            {ds.count > 0 && <span className="w-1 h-1 rounded-full bg-[#10b981]" />}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => triggerDownload(ds.csvContent, `${ds.id}_${range}.csv`)}
                        disabled={ds.count === 0}
                        className="px-4 py-2 bg-white border border-[#e2e8f0] rounded-xl text-[12px] font-black text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95 flex items-center gap-2 uppercase tracking-tight"
                      >
                        <Download size={14} strokeWidth={2.5} />
                        Save
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Master Data Section */}
              <div className="space-y-4 pt-4 border-t border-[#e2e8f0]">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck size={16} className="text-[#64748b]" />
                  <label className="text-[11px] font-black text-[#64748b] uppercase tracking-[0.2em]">Registry & Master Data</label>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {datasets.filter(d => d.category === 'Registry').map(ds => (
                    <div key={ds.id} className="flex items-center justify-between p-4 bg-white border border-[#e2e8f0] rounded-2xl hover:bg-[#f8fafc] transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#f1f5f9] text-[#64748b] flex items-center justify-center group-hover:bg-[#e2e8f0]">
                          <Database size={18} />
                        </div>
                        <div>
                          <p className="text-[14px] font-black text-[#0f172a]">{ds.label}</p>
                          <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-tight">{ds.count} total entries</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => triggerDownload(ds.csvContent, `${ds.id}_registry.csv`)}
                        className="px-4 py-2 bg-white border border-[#e2e8f0] rounded-xl text-[12px] font-black text-[#64748b] hover:bg-[#0f172a] hover:text-white transition-all active:scale-95 flex items-center gap-2 uppercase tracking-tight"
                      >
                        <Download size={14} strokeWidth={2.5} />
                        Download Full
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Footers for Results */}
            <div className="bg-[#f8fafc] px-8 py-6 flex flex-col gap-4 border-t border-[#e2e8f0] shrink-0">
              <div className="flex gap-4">
                <button
                  onClick={() => setView('selector')}
                  className="flex-1 px-4 py-4 text-[14px] font-black text-[#64748b] hover:bg-[#e2e8f0] rounded-[18px] transition-all uppercase tracking-widest whitespace-nowrap"
                >
                  Change Range
                </button>
                <button
                  onClick={handleBatchDownload}
                  className="flex-[2] px-6 py-4 bg-[#0f172a] text-white text-[14px] font-black rounded-[18px] shadow-xl shadow-black/10 transition-all hover:bg-black active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest"
                >
                  <Package size={20} strokeWidth={3} />
                  Batch Download All
                </button>
              </div>
              <p className="text-center text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em]">
                Files are downloaded in sequence to avoid browser blocking
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
