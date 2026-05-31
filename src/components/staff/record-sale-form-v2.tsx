'use client'

import { ShoppingBag, User, Hash, DollarSign, CreditCard, Loader2, Clock, Search, ChevronDown, Check } from 'lucide-react'
import { recordSale } from '@/app/dashboard/staff/actions'
import { useActionState, useState, useEffect } from 'react'
import { useToast } from '@/components/ui/toast'

type Customer = {
  id: string
  name: string
  status: string
  phone?: string
  tank_number?: string
}

export function RecordSaleForm({ customers, remainingStock }: { customers: Customer[], remainingStock: number }) {
  const [state, formAction, isPending] = useActionState(recordSale, null)
  const { showToast } = useToast()
  const [salesType, setSalesType] = useState('cash')
  const [qty, setQty] = useState<number>(0)
  const [freeQty, setFreeQty] = useState<number>(0)
  const [price, setPrice] = useState<number>(0.0233)
  const [agreedTotal, setAgreedTotal] = useState<string>('')
  
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')

  useEffect(() => {
    if (salesType === 'free') {
      setPrice(0.00)
      setAgreedTotal('0')
      setFreeQty(0)
    } else if (price === 0) {
      setPrice(0.0233)
      setAgreedTotal('')
    }
  }, [salesType])

  useEffect(() => {
    if (state) {
      if (state.errors) {
        showToast(state.message, 'error')
      } else if (state.message) {
        showToast(state.message, 'success')
        setQty(0)
        setFreeQty(0)
      }
    }
  }, [state, showToast])

  const activeCustomers = customers.filter(c => c.status === 'active')
  const filteredCustomers = activeCustomers.filter(c => {
    const search = searchTerm.toLowerCase()
    return (
      c.name.toLowerCase().includes(search) || 
      (c.phone && c.phone.includes(search)) || 
      (c.tank_number && c.tank_number.toLowerCase().includes(search))
    )
  })
  const selectedCustomer = activeCustomers.find(c => c.id === selectedCustomerId)

  const totalDepletion = qty + freeQty
  const isOverStock = totalDepletion > remainingStock
  const standardTotal = qty * price
  const agreedTotalParsed = parseFloat(agreedTotal)
  const hasAgreedTotal = agreedTotal !== '' && !isNaN(agreedTotalParsed)
  const finalTotal = hasAgreedTotal ? agreedTotalParsed : standardTotal
  const discountAmount = hasAgreedTotal ? Math.max(0, standardTotal - finalTotal) : 0

  return (
    <div className="bg-white border border-[#e5e7eb] shadow-sm rounded-[24px] p-8 mb-8">
      <div className="mb-8 pb-4 border-b border-[#f1f5f9] flex justify-between items-end">
        <div>
          <h2 className="text-[20px] font-black text-[#0f172a] tracking-tight mb-1 uppercase">New Sales Transaction</h2>
          <p className="text-[14px] font-medium text-[#64748b]">Complete the ledger entry for this institutional sale.</p>
        </div>
        <div className="flex flex-col items-end">
           <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Available Stock</span>
           <span className={`text-[18px] font-black ${remainingStock > 0 ? 'text-[#3b82f6]' : 'text-red-500'}`}>{remainingStock} Units</span>
        </div>
      </div>

      <form action={formAction} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {state?.errors && (
          <div className="md:col-span-2 p-4 bg-red-100/50 text-red-600 rounded-[12px] text-[13px] font-bold border border-red-200 mb-2 flex items-center gap-3">
             <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">!</div>
             {state.message}
          </div>
        )}

        {/* Customer Selection */}
        <div className="flex flex-col gap-2.5 relative">
          <label htmlFor="customer_id" className="text-[12px] font-extrabold text-[#1e293b] uppercase tracking-wider">Target Customer</label>
          <input type="hidden" name="customer_id" value={selectedCustomerId} required />
          
          <div 
            className="relative w-full h-[50px] bg-[#f8fafc] border border-[#e2e8f0] rounded-[12px] flex items-center px-4 cursor-pointer focus-within:ring-2 focus-within:ring-[#3b82f6]/20 focus-within:border-[#3b82f6] transition-all"
            onClick={() => setIsDropdownOpen(true)}
          >
            <User size={18} className="text-[#94a3b8] mr-3 shrink-0" />
            
            {isDropdownOpen ? (
              <input
                type="text"
                className="w-full bg-transparent border-none focus:outline-none text-[15px] font-bold text-[#0f172a] placeholder-[#94a3b8]"
                placeholder="Search by name, phone, or tank..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <span className={`text-[15px] font-bold truncate ${selectedCustomer ? 'text-[#0f172a]' : 'text-[#94a3b8]'}`}>
                {selectedCustomer ? `${selectedCustomer.name} ${selectedCustomer.tank_number ? `(Tank: ${selectedCustomer.tank_number})` : ''}` : 'Search or choose a customer...'}
              </span>
            )}
            
            {isDropdownOpen ? (
              <Search size={18} className="text-[#94a3b8] ml-2 shrink-0" />
            ) : (
              <ChevronDown size={18} className="text-[#94a3b8] ml-2 shrink-0" />
            )}
          </div>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute top-[80px] left-0 w-full max-h-[250px] overflow-y-auto bg-white border border-[#e2e8f0] rounded-[12px] shadow-2xl z-50 py-2">
                {filteredCustomers.length === 0 ? (
                  <div className="px-4 py-3 text-[14px] text-[#64748b] font-medium text-center">No customers found.</div>
                ) : (
                  filteredCustomers.map(c => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomerId(c.id)
                        setIsDropdownOpen(false)
                        setSearchTerm('')
                      }}
                      className={`px-4 py-3 cursor-pointer hover:bg-[#f8fafc] flex flex-col transition-colors border-b border-gray-50 last:border-0 ${selectedCustomerId === c.id ? 'bg-[#eff6ff]' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] font-bold text-[#0f172a]">{c.name}</span>
                        {selectedCustomerId === c.id && <Check size={16} className="text-[#3b82f6]" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {c.phone && <span className="text-[11px] font-medium text-[#64748b] bg-slate-100 px-2 py-0.5 rounded-md">{c.phone}</span>}
                        {c.tank_number && <span className="text-[11px] font-bold text-[#3b82f6] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">Tank: {c.tank_number}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Sale Type */}
        <div className="flex flex-col gap-2.5">
          <label className="text-[12px] font-extrabold text-[#1e293b] uppercase tracking-wider">Payment Method</label>
          <div className="flex gap-3 h-[50px]">
            <label className={`flex-1 flex items-center justify-center gap-1.5 lg:gap-2 rounded-[12px] border-2 cursor-pointer transition-all font-bold text-[12px] lg:text-[14px] ${salesType === 'cash' ? 'bg-[#eff6ff] border-[#3b82f6] text-[#3b82f6]' : 'bg-white border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'}`}>
              <input type="radio" name="sale_type" value="cash" checked={salesType === 'cash'} onChange={() => setSalesType('cash')} className="hidden" />
              <DollarSign size={16} className="hidden sm:block" />
              CASH
            </label>
            <label className={`flex-1 flex items-center justify-center gap-1.5 lg:gap-2 rounded-[12px] border-2 cursor-pointer transition-all font-bold text-[12px] lg:text-[14px] ${salesType === 'credit' ? 'bg-[#fff7ed] border-[#f59e0b] text-[#f59e0b]' : 'bg-white border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'}`}>
              <input type="radio" name="sale_type" value="credit" checked={salesType === 'credit'} onChange={() => setSalesType('credit')} className="hidden" />
              <CreditCard size={16} className="hidden sm:block" />
              CREDIT
            </label>
            <label className={`flex-1 flex items-center justify-center gap-1.5 lg:gap-2 rounded-[12px] border-2 cursor-pointer transition-all font-bold text-[12px] lg:text-[14px] ${salesType === 'free' ? 'bg-[#ecfdf5] border-[#10b981] text-[#10b981]' : 'bg-white border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'}`}>
              <input type="radio" name="sale_type" value="free" checked={salesType === 'free'} onChange={() => setSalesType('free')} className="hidden" />
              <ShoppingBag size={16} className="hidden sm:block" />
              FREE
            </label>
            <label className={`flex-1 flex items-center justify-center gap-1.5 lg:gap-2 rounded-[12px] border-2 cursor-pointer transition-all font-bold text-[12px] lg:text-[14px] ${salesType === 'draft' ? 'bg-[#f8fafc] border-[#94a3b8] text-[#475569]' : 'bg-white border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'}`}>
              <input type="radio" name="sale_type" value="draft" checked={salesType === 'draft'} onChange={() => setSalesType('draft')} className="hidden" />
              <Clock size={16} className="hidden sm:block" />
              DRAFT
            </label>
          </div>
        </div>

        {/* Quantity (PAID) */}
        <div className="flex flex-col gap-2.5">
          <label htmlFor="quantity" className="text-[12px] font-extrabold text-[#1e293b] uppercase tracking-wider">Paid Volume (Liters)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <ShoppingBag size={18} className="text-[#94a3b8]" />
            </div>
            <input 
              type="number" 
              id="quantity" 
              name="quantity" 
              min="1"
              required
              placeholder="0"
              value={qty || ''}
              onChange={(e) => setQty(parseInt(e.target.value) || 0)}
              className={`w-full h-[50px] pl-[44px] pr-4 bg-[#f8fafc] border rounded-[12px] text-[15px] font-bold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all ${isOverStock ? 'border-red-500' : 'border-[#e2e8f0]'}`}
            />
          </div>
        </div>

        {/* Unit Price (Locked) */}
        <div className="flex flex-col gap-2.5">
          <label className="text-[12px] font-extrabold text-[#1e293b] uppercase tracking-wider">Standard Price / Liter ($)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <DollarSign size={18} className="text-[#94a3b8]" />
            </div>
            <input 
              type="number" 
              value={price}
              disabled
              className="w-full h-[50px] pl-[44px] pr-4 bg-gray-100 border border-[#e2e8f0] rounded-[12px] text-[15px] font-bold text-[#64748b] opacity-70 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Agreed Final Total (Optional) */}
        <div className="flex flex-col gap-2.5">
          <label htmlFor="final_total" className="text-[12px] font-extrabold text-[#1e293b] uppercase tracking-wider">Agreed Final Total (Optional) ($)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <DollarSign size={18} className={salesType === 'free' ? 'text-[#10b981]' : 'text-[#3b82f6]'} />
            </div>
            <input 
              type="number" 
              id="final_total" 
              name="final_total" 
              step="any"
              min="0"
              placeholder={standardTotal.toFixed(2)}
              value={agreedTotal}
              onChange={(e) => setAgreedTotal(e.target.value)}
              disabled={salesType === 'free' || qty === 0}
              className={`w-full h-[50px] pl-[44px] pr-4 bg-[#f8fafc] border rounded-[12px] text-[15px] font-bold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all ${(salesType === 'free' || qty === 0) ? 'bg-gray-100 opacity-60 cursor-not-allowed' : 'border-[#e2e8f0]'}`}
            />
          </div>
        </div>

        {/* Free Quantity (BONUS) */}
        <div className="flex flex-col gap-2.5">
          <label htmlFor="free_quantity" className="text-[12px] font-extrabold text-[#10b981] uppercase tracking-wider italic">Free Liters (Bonus)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <ShoppingBag size={18} className="text-[#10b981]" />
            </div>
            <input 
              type="number" 
              id="free_quantity" 
              name="free_quantity" 
              min="0"
              placeholder="0"
              value={freeQty || ''}
              onChange={(e) => setFreeQty(parseInt(e.target.value) || 0)}
              className={`w-full h-[50px] pl-[44px] pr-4 bg-[#ecfdf5]/30 border rounded-[12px] text-[15px] font-bold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all ${isOverStock ? 'border-red-500' : 'border-[#10b981]/20'}`}
            />
          </div>
        </div>

        {/* Total Amount (Auto-Calculated) */}
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <label className="text-[12px] font-extrabold text-[#1e293b] uppercase tracking-wider">Total Transaction Amount ($)</label>
            {discountAmount > 0 && (
              <span className="text-[10px] font-black text-[#10b981] bg-[#ecfdf5] px-2 py-0.5 rounded-full border border-[#10b981]/20">
                -${discountAmount.toFixed(2)} DISCOUNT
              </span>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Hash size={18} className={salesType === 'free' ? 'text-[#10b981]' : 'text-[#3b82f6]'} />
            </div>
            <div className={`w-full h-[50px] pl-[44px] pr-4 border rounded-[12px] text-[20px] font-black flex items-center transition-all ${salesType === 'free' ? 'border-[#10b981]/20 text-[#10b981] bg-[#ecfdf5]' : 'border-[#3b82f6]/20 text-[#3b82f6] bg-[#eff6ff]'}`}>
              {finalTotal.toFixed(2)}
            </div>
          </div>
        </div>

        {isOverStock && (
          <div className="md:col-span-2 p-3 bg-red-50 text-red-600 rounded-[10px] text-[11px] font-extrabold border border-red-100 flex items-center gap-2">
            ⚠️ TOTAL DEPLETION ({totalDepletion} LITERS) EXCEEDS AVAILABLE STOCK!
          </div>
        )}

        <div className="md:col-span-2 pt-6 border-t border-[#f1f5f9] mt-2 flex flex-col gap-4">
          {totalDepletion > 0 && (
            <div className="flex items-center gap-2 py-2 px-4 rounded-[10px] bg-slate-50 border border-slate-200 text-[12px] font-bold text-slate-600">
               <Hash size={14} />
               Inventory Impact: <span className="text-[#0f172a] font-black">{qty} Paid + {freeQty} Bonus = {totalDepletion} Liters Total</span>
            </div>
          )}
          <button 
            type="submit" 
            disabled={isPending || isOverStock || (qty === 0 && freeQty === 0) || remainingStock <= 0}
            className="w-full h-[54px] bg-[#3b82f6] hover:bg-[#2563eb] text-white font-black text-[15px] rounded-[14px] transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-wider"
          >
            {isPending ? <Loader2 className="animate-spin" size={20} /> : <ShoppingBag size={20} strokeWidth={2.5} />}
            {isPending ? 'Processing transaction...' : 'COMPLETE SALE TRANSACTION'}
          </button>
        </div>
      </form>
    </div>
  )
}
