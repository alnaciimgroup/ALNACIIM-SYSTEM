'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Download, Calendar, Clock, Search, Loader2, Printer, User, Phone, Tag } from 'lucide-react'
import { getAccountantCustomers } from '@/app/dashboard/accountant/customers/actions'
import { generateCustomerExport, CustomerExportResult } from '@/app/dashboard/accountant/export/customer-actions'
import { useToast } from '@/components/ui/toast'

interface ExportCustomerModalProps {
  isOpen: boolean
  onClose: () => void
}

type CustomerItem = {
  id: string
  name: string
  phone?: string
  tank_number?: string
  status: string
  debt: number
  guarantor?: string
  guarantor_phone?: string
  staff?: {
    full_name: string
  } | null
}

export function ExportCustomerModal({ isOpen, onClose }: ExportCustomerModalProps) {
  const [customers, setCustomers] = useState<CustomerItem[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null)
  
  const [range, setRange] = useState('this_month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [isPending, setIsPending] = useState(false)
  
  // Data holder to render into print layout
  const [printData, setPrintData] = useState<CustomerExportResult | null>(null)
  const [mounted, setMounted] = useState(false)
  
  const { showToast } = useToast()

  // Set mounted on client hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch customers on open
  useEffect(() => {
    if (isOpen) {
      setIsLoadingCustomers(true)
      setSelectedCustomer(null)
      setSearchTerm('')
      setRange('this_month')
      setCustomStart('')
      setCustomEnd('')
      setPrintData(null)
      
      getAccountantCustomers()
        .then((data: CustomerItem[]) => {
          setCustomers(data || [])
          setFilteredCustomers(data || [])
        })
        .catch((err) => {
          console.error(err)
          showToast('Failed to load customers list', 'error')
        })
        .finally(() => setIsLoadingCustomers(false))
    }
  }, [isOpen, showToast])

  // Filter customers in real-time
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCustomers(customers)
    } else {
      const lower = searchTerm.toLowerCase()
      const filtered = customers.filter(c => 
        c.name.toLowerCase().includes(lower) ||
        (c.phone && c.phone.toLowerCase().includes(lower)) ||
        (c.tank_number && c.tank_number.toLowerCase().includes(lower)) ||
        (c.guarantor && c.guarantor.toLowerCase().includes(lower))
      )
      setFilteredCustomers(filtered)
    }
  }, [searchTerm, customers])

  if (!mounted || !isOpen) return null

  const handleClose = () => {
    setSelectedCustomer(null)
    setPrintData(null)
    onClose()
  }

  const handleCsvDownload = async () => {
    if (!selectedCustomer) {
      showToast('Please select a customer first', 'error')
      return
    }
    if (range === 'custom' && (!customStart || !customEnd)) {
      showToast('Please select both start and end dates', 'error')
      return
    }

    setIsPending(true)
    try {
      const result = await generateCustomerExport(
        selectedCustomer.id,
        range,
        range === 'custom' ? { start: customStart, end: customEnd } : undefined
      )
      
      const blob = new Blob([result.csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      
      const cleanName = selectedCustomer.name.replace(/\s+/g, '_').toLowerCase()
      link.setAttribute('download', `${cleanName}_statement_${result.metadata.startDate}_to_${result.metadata.endDate}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      showToast('CSV statement downloaded successfully', 'success')
    } catch (err: unknown) {
      console.error(err)
      const errMsg = err instanceof Error ? err.message : 'Failed to download CSV'
      showToast(errMsg, 'error')
    } finally {
      setIsPending(false)
    }
  }

  const handlePrint = async () => {
    if (!selectedCustomer) {
      showToast('Please select a customer first', 'error')
      return
    }
    if (range === 'custom' && (!customStart || !customEnd)) {
      showToast('Please select both start and end dates', 'error')
      return
    }

    setIsPending(true)
    try {
      const result = await generateCustomerExport(
        selectedCustomer.id,
        range,
        range === 'custom' ? { start: customStart, end: customEnd } : undefined
      )
      
      setPrintData(result)
      
      // Allow react to render the print container before calling print
      setTimeout(() => {
        window.print()
      }, 300)
    } catch (err: unknown) {
      console.error(err)
      const errMsg = err instanceof Error ? err.message : 'Failed to initialize print statement'
      showToast(errMsg, 'error')
    } finally {
      setIsPending(false)
    }
  }

  const presets = [
    { id: 'today', label: 'Today', icon: <Clock size={14} /> },
    { id: 'this_week', label: 'This Week', icon: <Calendar size={14} /> },
    { id: 'last_week', label: 'Last Week', icon: <Clock size={14} /> },
    { id: 'this_month', label: 'This Month', icon: <Calendar size={14} /> },
    { id: 'last_month', label: 'Last Month', icon: <Clock size={14} /> },
    { id: 'custom', label: 'Custom Date', icon: <Calendar size={14} /> },
  ]

  const fmtCurrency = (val: string | number) => `$${Number(val || 0).toFixed(2)}`

  return createPortal(
    <>
      {/* Stylesheet specifically for window printing */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          /* Hide all standard elements in Next.js layout */
          body > *:not(#statement-print-root) {
            display: none !important;
            opacity: 0 !important;
          }
          /* Show printing statement wrapper */
          #statement-print-root {
            display: block !important;
            visibility: visible !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 24px;
          }
        }
        #statement-print-root {
          display: none;
        }
      ` }} />

      {/* Hidden Print-only Template */}
      {printData && (
        <div id="statement-print-root" className="font-sans text-black">
          <div className="border-b-2 border-gray-900 pb-4 mb-6 flex justify-between items-end">
            <div>
              <h1 className="text-[26px] font-black tracking-tight uppercase">AL-NACIIM WATER SYSTEM</h1>
              <p className="text-[12px] font-bold text-gray-600 uppercase tracking-widest mt-1">Official Customer Statement Ledger</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase text-gray-500">Statement Date</p>
              <p className="text-[14px] font-black">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8 border border-gray-200 rounded-xl p-4 bg-gray-50/50">
            <div>
              <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Customer Information</h2>
              <p className="text-[16px] font-black">{printData.customer.name}</p>
              {printData.customer.phone && <p className="text-[13px] text-gray-700 mt-0.5">Phone: {printData.customer.phone}</p>}
              {printData.customer.tankNumber && <p className="text-[13px] text-gray-700">Tank: {printData.customer.tankNumber}</p>}
            </div>
            <div>
              <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Guarantor & Representative</h2>
              <p className="text-[13px] text-gray-700">Guarantor Name: <strong>{printData.customer.guarantor}</strong></p>
              <p className="text-[13px] text-gray-700">Guarantor Phone: <strong>{printData.customer.guarantorPhone}</strong></p>
              <p className="text-[13px] text-gray-700 mt-1">Assigned Staff: <strong>{printData.customer.staffName}</strong></p>
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-gray-200 pt-3 mt-1">
              <div>
                <span className="text-[11px] font-bold uppercase text-gray-500 tracking-wide block">Audited Period</span>
                <span className="text-[13px] font-black">{printData.metadata.startDate} to {printData.metadata.endDate}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-gray-500 tracking-wide block">Outstanding Balance</span>
                <span className="text-[16px] font-black text-red-600">{fmtCurrency(printData.customer.debt)}</span>
              </div>
            </div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-900 bg-gray-100 text-[10px] font-black uppercase text-gray-600 tracking-wider">
                <th className="py-2.5 px-2">Date</th>
                <th className="py-2.5 px-2">Transaction Type</th>
                <th className="py-2.5 px-2">Reference ID</th>
                <th className="py-2.5 px-2">Staff</th>
                <th className="py-2.5 px-2 text-right">Liters</th>
                <th className="py-2.5 px-2 text-right">Value</th>
                <th className="py-2.5 px-2 text-right">Paid</th>
                <th className="py-2.5 px-2 text-right">Debt Impact</th>
              </tr>
            </thead>
            <tbody>
              {printData.transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[13px] text-gray-500 font-bold">No records found for this period.</td>
                </tr>
              ) : (
                printData.transactions.map((t, idx) => (
                  <tr key={idx} className="border-b border-gray-200 text-[12px] text-gray-800">
                    <td className="py-2.5 px-2 whitespace-nowrap">{t.date}</td>
                    <td className="py-2.5 px-2 font-bold">{t.type}</td>
                    <td className="py-2.5 px-2 text-gray-500 font-mono text-[11px] truncate max-w-[100px]">{t.referenceId.substring(0, 8)}...</td>
                    <td className="py-2.5 px-2 truncate max-w-[100px]">{t.staffName}</td>
                    <td className="py-2.5 px-2 text-right">{t.liters}{typeof t.bonusLiters === 'number' && t.bonusLiters > 0 && ` (+${t.bonusLiters})`}</td>
                    <td className="py-2.5 px-2 text-right">{t.totalAmount > 0 ? fmtCurrency(t.totalAmount) : '-'}</td>
                    <td className="py-2.5 px-2 text-right">{t.amountPaid > 0 ? fmtCurrency(t.amountPaid) : '-'}</td>
                    <td className={`py-2.5 px-2 text-right font-black ${t.debtImpact > 0 ? 'text-red-600' : t.debtImpact < 0 ? 'text-green-600' : ''}`}>
                      {t.debtImpact !== 0 ? `${t.debtImpact > 0 ? '+' : ''}${fmtCurrency(t.debtImpact)}` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="mt-12 flex justify-between items-start pt-6 border-t border-gray-200">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">System Statement Audit Log</p>
              <p className="text-[11px] text-gray-500 mt-1">Generated by Accountant Panel. Non-editable ledger record.</p>
            </div>
            <div className="border-t border-gray-900 pt-2 w-[180px] text-center mt-4">
              <p className="text-[11px] font-black uppercase tracking-wide">Accountant Signature</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal View */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={handleClose} />
        
        <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-[500px] max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
          
          {/* Header */}
          <div className="px-6 pt-6 pb-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-[15px] bg-[#3b82f6] text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <User size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-[18px] font-black text-[#0f172a] leading-tight uppercase tracking-tight">Customer Statement</h3>
                <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-widest mt-0.5">Export & Printer Manager</p>
              </div>
            </div>
            <button 
              onClick={handleClose} 
              className="p-2 text-[#94a3b8] hover:bg-[#eff6ff] hover:text-[#3b82f6] rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            
            {/* Step 1: Customer Selection */}
            {!selectedCustomer ? (
              <div className="space-y-4 flex flex-col">
                <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.2em] block">1. Search & Select Customer</label>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#94a3b8]">
                    <Search size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name, phone, tank # or guarantor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-[50px] pl-[46px] pr-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[16px] text-[14px] font-bold text-[#0f172a] focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all outline-none"
                  />
                </div>

                <div className="border border-[#e2e8f0] rounded-[20px] max-h-[220px] overflow-y-auto divide-y divide-[#f1f5f9] bg-white shadow-inner">
                  {isLoadingCustomers ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#64748b] font-bold text-[14px]">
                      <Loader2 className="animate-spin text-[#3b82f6]" size={24} />
                      Loading customers database...
                    </div>
                  ) : filteredCustomers.length === 0 ? (
                    <div className="px-4 py-8 text-[14px] text-[#64748b] font-medium text-center">No customers matching search terms.</div>
                  ) : (
                    filteredCustomers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCustomer(c)}
                        className="px-4 py-3 cursor-pointer hover:bg-[#f8fafc] flex flex-col transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] font-black text-[#0f172a] group-hover:text-[#3b82f6] transition-colors">{c.name}</span>
                          <span className="text-[11px] font-black text-[#ef4444]">{c.debt > 0 ? fmtCurrency(c.debt) : 'No Debt'}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {c.phone && (
                            <span className="text-[10px] font-bold text-[#64748b] bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Phone size={10} /> {c.phone}
                            </span>
                          )}
                          {c.tank_number && (
                            <span className="text-[10px] font-bold text-[#3b82f6] bg-[#eff6ff] border border-blue-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Tag size={10} /> Tank: {c.tank_number}
                            </span>
                          )}
                          {c.guarantor && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                              G: {c.guarantor}
                            </span>
                          )}
                          <span className="text-[10px] font-medium text-[#94a3b8] ml-auto">Rep: {c.staff?.full_name || 'N/A'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Selected Customer Header Card */
              <div className="bg-[#eff6ff]/40 border border-[#3b82f6]/20 rounded-[24px] p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-[10px] font-black text-[#3b82f6] uppercase tracking-[0.2em] mb-1">Selected Customer</h4>
                    <span className="text-[18px] font-black text-[#0f172a]">{selectedCustomer.name}</span>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="px-2.5 py-1 bg-white border border-[#3b82f6]/20 hover:bg-red-50 hover:border-red-200 hover:text-red-500 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                  >
                    Change
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t border-[#3b82f6]/10 pt-3.5 text-[12px] font-bold text-[#64748b]">
                  <div className="space-y-1">
                    <p className="flex items-center gap-1.5"><Phone size={12} className="text-[#94a3b8]" /> {selectedCustomer.phone || 'N/A'}</p>
                    <p className="flex items-center gap-1.5"><Tag size={12} className="text-[#94a3b8]" /> Tank: {selectedCustomer.tank_number || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p>Guarantor: <strong className="text-[#0f172a]">{selectedCustomer.guarantor || 'N/A'}</strong></p>
                    <p>G. Phone: <strong className="text-[#0f172a]">{selectedCustomer.guarantor_phone || 'N/A'}</strong></p>
                  </div>
                  <div className="col-span-2 border-t border-[#3b82f6]/10 pt-2 flex justify-between items-center text-[13px]">
                    <span className="text-[#94a3b8]">Debt Balance:</span>
                    <strong className={`font-black ${selectedCustomer.debt > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {fmtCurrency(selectedCustomer.debt)}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Date Range selector (Only when customer is selected) */}
            {selectedCustomer && (
              <div className="space-y-4 animate-in fade-in-50 duration-300">
                <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.2em] block text-center">2. Select Period</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {presets.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setRange(p.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-[16px] border-2 transition-all text-left group ${
                        range === p.id 
                          ? 'bg-[#eff6ff] border-[#3b82f6] text-[#3b82f6]' 
                          : 'bg-white border-[#f1f5f9] text-[#64748b] hover:border-[#e2e8f0] hover:bg-[#f8fafc]'
                      }`}
                    >
                      <div className={`p-1 rounded-md transition-colors ${
                        range === p.id ? 'bg-[#3b82f6] text-white' : 'bg-[#f8fafc] text-[#94a3b8] group-hover:bg-[#e2e8f0]'
                      }`}>
                        {p.icon}
                      </div>
                      <span className="text-[12px] font-black uppercase tracking-tight leading-none">{p.label}</span>
                    </button>
                  ))}
                </div>

                {range === 'custom' && (
                  <div className="space-y-4 p-4 bg-[#f8fafc] rounded-[20px] border border-[#e2e8f0] animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-[#64748b] uppercase tracking-widest leading-none">Start Date</label>
                        <input 
                          type="date"
                          value={customStart}
                          onChange={(e) => setCustomStart(e.target.value)}
                          className="w-full bg-white border border-[#e2e8f0] rounded-[12px] px-3 py-2.5 text-[13px] font-bold text-[#0f172a] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-[#64748b] uppercase tracking-widest leading-none">End Date</label>
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
            )}

          </div>

          {/* Action Footer */}
          {selectedCustomer && (
            <div className="bg-[#f8fafc] px-6 py-4 flex gap-4 border-t border-[#e2e8f0] shrink-0">
              <button
                onClick={handleCsvDownload}
                disabled={isPending}
                className="flex-1 h-[50px] bg-white border border-[#e2e8f0] hover:bg-slate-50 text-[#0f172a] text-[12px] font-black rounded-[16px] shadow-sm transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                {isPending ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Download size={16} strokeWidth={2.5} />
                )}
                CSV
              </button>

              <button
                onClick={handlePrint}
                disabled={isPending}
                className="flex-[2] h-[50px] bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[12px] font-black rounded-[16px] shadow-lg shadow-blue-500/15 transition-all flex items-center justify-center gap-2.5 uppercase tracking-wider"
              >
                {isPending ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Printer size={16} strokeWidth={2.5} />
                )}
                Print / Save PDF
              </button>
            </div>
          )}

        </div>
      </div>
    </>,
    document.body
  )
}
