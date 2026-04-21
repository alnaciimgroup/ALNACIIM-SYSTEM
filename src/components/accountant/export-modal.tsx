'use client'

import { useState } from 'react'
import { X, Download, Calendar, Clock, Filter, AlertCircle, CheckCircle2, Loader2, FileSpreadsheet, Package, ChevronRight, Database, History, UserCheck, ShoppingBag, FolderArchive } from 'lucide-react'
import { generateUniversalExport, DatasetResult, ExportResult } from '@/app/dashboard/accountant/export/actions'
import { useToast } from '@/components/ui/toast'
import JSZip from 'jszip'

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
  const [exportData, setExportData] = useState<ExportResult | null>(null)
  const { showToast } = useToast()

  if (!isOpen) return null

  const handleClose = () => {
    setView('selector')
    setExportData(null)
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
      const result = await generateUniversalExport(range, range === 'custom' ? { start: customStart, end: customEnd } : undefined)
      setExportData(result)
      setView('results')
      showToast('System audit complete. Data ready for download.', 'success')
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Export failed', 'error')
    } finally {
      setIsPending(false)
    }
  }

  const handleBatchZip = async () => {
    if (!exportData) return
    
    setIsPending(true)
    try {
      const zip = new JSZip()
      const folder = zip.folder(`alnaciim_audit_${exportData.metadata.startDate}_to_${exportData.metadata.endDate}`)
      
      let filesAdded = 0
      exportData.datasets.forEach(ds => {
        if (ds.count > 0 || ds.category === 'Registry') {
          const filename = ds.category === 'Transactions' 
            ? `${ds.id}_${exportData.metadata.startDate}_to_${exportData.metadata.endDate}.csv`
            : `${ds.id}_current_registry.csv`
          
          folder?.file(filename, ds.csvContent)
          filesAdded++
        }
      })

      if (filesAdded === 0) {
        showToast('No records found to package.', 'error')
        return
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const zipUrl = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = zipUrl
      link.download = `alnaciim_audit_package_${exportData.metadata.startDate}_to_${exportData.metadata.endDate}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(zipUrl)
      
      showToast('Audit ZIP package generated successfully!', 'success')
    } catch (err: any) {
      console.error('ZIP ERROR:', err)
      showToast('Failed to generate ZIP package.', 'error')
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
    { id: 'all', label: 'All Time', icon: <Database size={16} /> },
    { id: 'custom', label: 'Custom Range', icon: <Calendar size={16} /> },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={handleClose} />
      
      <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-[480px] max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-[15px] bg-[#3b82f6] text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Package size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[18px] font-black text-[#0f172a] leading-tight uppercase tracking-tight">
                {view === 'selector' ? 'Universal Export' : 'Audit Package'}
              </h3>
              <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-widest mt-0.5">
                {view === 'selector' ? 'Select Audit Window' : `${exportData?.metadata.startDate} TO ${exportData?.metadata.endDate}`}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="p-2 text-[#94a3b8] hover:bg-[#eff6ff] hover:text-[#3b82f6] rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {view === 'selector' ? (
          <>
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.2em] block text-center mb-2">Auditing Period</label>
                <div className="grid grid-cols-2 gap-3">
                  {presets.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setRange(p.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-[20px] border-2 transition-all text-left group ${
                        range === p.id 
                          ? 'bg-[#eff6ff] border-[#3b82f6] text-[#3b82f6]' 
                          : 'bg-white border-[#f1f5f9] text-[#64748b] hover:border-[#e2e8f0] hover:bg-[#f8fafc]'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg transition-colors ${
                        range === p.id ? 'bg-[#3b82f6] text-white' : 'bg-[#f8fafc] text-[#94a3b8] group-hover:bg-[#e2e8f0]'
                      }`}>
                        {p.icon}
                      </div>
                      <span className="text-[13px] font-black uppercase tracking-tight leading-none">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {range === 'custom' && (
                <div className="space-y-4 p-5 bg-[#f8fafc] rounded-[22px] border border-[#e2e8f0] animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-[#64748b] uppercase tracking-widest leading-none">Start</label>
                      <input 
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full bg-white border border-[#e2e8f0] rounded-[12px] px-3 py-2.5 text-[13px] font-bold text-[#0f172a] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-[#64748b] uppercase tracking-widest leading-none">End</label>
                      <input 
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full bg-white border border-[#e2e8f0] rounded-[12px] px-3 py-2.5 text-[13px] font-bold text-[#0f172a] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#f8fafc] px-6 py-4 flex gap-4 border-t border-[#e2e8f0] shrink-0">
              <button
                onClick={handleGenerate}
                disabled={isPending}
                className="w-full px-6 py-4 bg-[#3b82f6] text-white text-[13px] font-black rounded-[18px] shadow-xl shadow-blue-500/20 transition-all hover:bg-[#2563eb] active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 uppercase tracking-widest"
              >
                {isPending ? (
                  <>
                    <Loader2 className="animate-spin" size={18} strokeWidth={3} />
                    Processing...
                  </>
                ) : (
                  <>
                    Scan System
                    <ChevronRight size={18} strokeWidth={3} />
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* View Switcher: Results Dashboard */
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <History size={14} className="text-[#3b82f6]" />
                    <label className="text-[10px] font-black text-[#3b82f6] uppercase tracking-[0.2em]">Transactions</label>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {exportData?.datasets.filter(d => d.category === 'Transactions').map(ds => (
                    <div key={ds.id} className="flex items-center justify-between p-3.5 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] hover:border-[#3b82f6]/30 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ds.count > 0 ? 'bg-white text-[#0f172a] shadow-sm' : 'bg-gray-100 text-[#94a3b8] opacity-50'}`}>
                          {ds.id.includes('sale') ? <ShoppingBag size={14} /> : ds.id.includes('pay') ? <Hash size={14} /> : <FileSpreadsheet size={14} />}
                        </div>
                        <div>
                          <p className={`text-[13px] font-black ${ds.count > 0 ? 'text-[#0f172a]' : 'text-[#94a3b8]'}`}>{ds.label}</p>
                          <p className="text-[10px] font-bold text-[#64748b] flex items-center gap-1.5 mt-0.5 uppercase tracking-tighter">
                            <span className={ds.count > 0 ? 'text-[#10b981]' : ''}>{ds.count} records</span>
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => triggerDownload(ds.csvContent, `${ds.id}_${exportData.metadata.startDate}_to_${exportData.metadata.endDate}.csv`)}
                        disabled={ds.count === 0}
                        className="px-3 py-1.5 bg-white border border-[#e2e8f0] rounded-lg text-[11px] font-black text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95 flex items-center gap-2 uppercase tracking-tight"
                      >
                        <Download size={12} strokeWidth={2.5} />
                        CSV
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#e2e8f0]">
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck size={14} className="text-[#64748b]" />
                  <label className="text-[10px] font-black text-[#64748b] uppercase tracking-[0.2em]">Registries</label>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {exportData?.datasets.filter(d => d.category === 'Registry').map(ds => (
                    <div key={ds.id} className="flex items-center justify-between p-3.5 bg-white border border-[#e2e8f0] rounded-xl hover:bg-[#f8fafc] transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#f1f5f9] text-[#64748b] flex items-center justify-center group-hover:bg-[#e2e8f0]">
                          <Database size={14} />
                        </div>
                        <div>
                          <p className="text-[13px] font-black text-[#0f172a]">{ds.label}</p>
                          <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-tight">{ds.count} entries</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => triggerDownload(ds.csvContent, `${ds.id}_registry.csv`)}
                        className="px-3 py-1.5 bg-white border border-[#e2e8f0] rounded-lg text-[11px] font-black text-[#64748b] hover:bg-[#0f172a] hover:text-white transition-all active:scale-95 flex items-center gap-2 uppercase tracking-tight"
                      >
                        <Download size={12} strokeWidth={2.5} />
                        CSV
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#f8fafc] px-6 py-4 flex flex-col gap-3 border-t border-[#e2e8f0] shrink-0">
              <div className="flex gap-4">
                <button
                  onClick={() => setView('selector')}
                  className="flex-1 px-4 py-4 text-[13px] font-black text-[#64748b] hover:bg-[#e2e8f0] rounded-[18px] transition-all uppercase tracking-widest whitespace-nowrap"
                >
                  Back
                </button>
                <button
                  onClick={handleBatchZip}
                  disabled={isPending}
                  className="flex-[2] px-6 py-4 bg-[#3b82f6] text-white text-[13px] font-black rounded-[18px] shadow-xl shadow-blue-500/20 transition-all hover:bg-[#2563eb] active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 uppercase tracking-widest"
                >
                  {isPending ? (
                    <Loader2 className="animate-spin" size={18} strokeWidth={3} />
                  ) : (
                    <FolderArchive size={18} strokeWidth={3} />
                  )}
                  {isPending ? 'Packaging...' : 'Full Audit ZIP'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
