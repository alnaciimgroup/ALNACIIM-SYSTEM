'use client'

import { ShoppingBag, User, Hash, DollarSign, CreditCard, Loader2 } from 'lucide-react'
import { recordSale } from '@/app/dashboard/staff/actions'
import { useActionState, useState, useEffect } from 'react'
import { useToast } from '@/components/ui/toast'

type Customer = {
  id: string
  name: string
  status: string
}

export function RecordSaleForm({ customers, remainingStock }: { customers: Customer[], remainingStock: number }) {
  const [state, formAction, isPending] = useActionState(recordSale, null)
  const { showToast } = useToast()
  const [salesType, setSalesType] = useState('cash')
  const [qty, setQty] = useState<number>(0)
  const [freeQty, setFreeQty] = useState<number>(0)
  const [price, setPrice] = useState<number>(5.00)

  useEffect(() => {
    if (salesType === 'free') {
      setPrice(0.00)
      setFreeQty(0)
    } else if (price === 0) {
      setPrice(5.00)
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
  const totalDepletion = qty + freeQty
  const isOverStock = totalDepletion > remainingStock

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
        <div className="flex flex-col gap-2.5">
          <label htmlFor="customer_id" className="text-[12px] font-extrabold text-[#1e293b] uppercase tracking-wider">Target Customer</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <User size={18} className="text-[#94a3b8]" />
            </div>
            <select
              id="customer_id"
              name="customer_id"
              required
              className="w-full h-[50px] pl-[44px] pr-10 bg-[#f8fafc] border border-[#e2e8f0] rounded-[12px] text-[15px] font-bold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all appearance-none cursor-pointer"
            >
              <option value="">Choose a customer...</option>
              {activeCustomers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
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
          </div>
        </div>

        {/* Quantity (PAID) */}
        <div className="flex flex-col gap-2.5">
          <label htmlFor="quantity" className="text-[12px] font-extrabold text-[#1e293b] uppercase tracking-wider">Paid Volume (Tanks)</label>
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

        {/* Unit Price (Editable) */}
        <div className="flex flex-col gap-2.5">
          <label htmlFor="unit_price" className="text-[12px] font-extrabold text-[#1e293b] uppercase tracking-wider">Price per Tank ($)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <DollarSign size={18} className={salesType === 'free' ? 'text-[#10b981]' : 'text-[#3b82f6]'} />
            </div>
            <input 
              type="number" 
              id="unit_price" 
              name="unit_price" 
              step="0.01"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              disabled={salesType === 'free'}
              className={`w-full h-[50px] pl-[44px] pr-4 bg-[#f8fafc] border rounded-[12px] text-[15px] font-bold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all ${salesType === 'free' ? 'bg-gray-100 opacity-60' : 'border-[#e2e8f0]'}`}
            />
          </div>
        </div>

        {/* Free Quantity (BONUS) */}
        <div className="flex flex-col gap-2.5">
          <label htmlFor="free_quantity" className="text-[12px] font-extrabold text-[#10b981] uppercase tracking-wider italic">Free Tanks (Bonus)</label>
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
          <label className="text-[12px] font-extrabold text-[#1e293b] uppercase tracking-wider">Total Transaction Amount ($)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Hash size={18} className={salesType === 'free' ? 'text-[#10b981]' : 'text-[#3b82f6]'} />
            </div>
            <div className={`w-full h-[50px] pl-[44px] pr-4 border rounded-[12px] text-[20px] font-black flex items-center transition-all ${salesType === 'free' ? 'border-[#10b981]/20 text-[#10b981] bg-[#ecfdf5]' : 'border-[#3b82f6]/20 text-[#3b82f6] bg-[#eff6ff]'}`}>
              {(qty * price).toFixed(2)}
            </div>
          </div>
        </div>

        {isOverStock && (
          <div className="md:col-span-2 p-3 bg-red-50 text-red-600 rounded-[10px] text-[11px] font-extrabold border border-red-100 flex items-center gap-2">
            ⚠️ TOTAL DEPLETION ({totalDepletion} TANKS) EXCEEDS AVAILABLE STOCK!
          </div>
        )}

        <div className="md:col-span-2 pt-6 border-t border-[#f1f5f9] mt-2 flex flex-col gap-4">
          {totalDepletion > 0 && (
            <div className="flex items-center gap-2 py-2 px-4 rounded-[10px] bg-slate-50 border border-slate-200 text-[12px] font-bold text-slate-600">
               <Hash size={14} />
               Inventory Impact: <span className="text-[#0f172a] font-black">{qty} Paid + {freeQty} Bonus = {totalDepletion} Tanks Total</span>
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
