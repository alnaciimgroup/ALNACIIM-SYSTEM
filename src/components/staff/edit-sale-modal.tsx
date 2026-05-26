'use client'

import { useState } from 'react'
import { X, Droplet, Hash, Calculator, DollarSign } from 'lucide-react'
import { updateSale } from '@/app/dashboard/staff/actions'
import { useToast } from '@/components/ui/toast'

interface EditSaleModalProps {
  isOpen: boolean
  onClose: () => void
  sale: {
    id: string
    customerName: string
    quantity: number
    unitPrice: number
  }
}

export function EditSaleModal({ isOpen, onClose, sale }: EditSaleModalProps) {
  const [quantity, setQuantity] = useState(sale.quantity)
  const [unitPrice, setUnitPrice] = useState(sale.unitPrice)
  const [isPending, setIsPending] = useState(false)
  const { showToast } = useToast()

  if (!isOpen) return null

  const handleUpdate = async () => {
    setIsPending(true)
    try {
      await updateSale(sale.id, quantity, unitPrice)
      showToast('Sale updated successfully!', 'success')
      onClose()
    } catch (err: any) {
      showToast(err.message || 'Failed to update sale.', 'error')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-[420px] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-gray-50">
          <div>
            <h3 className="text-[18px] font-bold text-gray-900 leading-tight">Edit Transaction</h3>
            <p className="text-[12px] font-bold text-blue-500 uppercase tracking-widest mt-1">Customer: {sale.customerName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Quantity Field */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Calculator size={14} className="text-blue-500" />
              Quantity (Liters)
            </label>
            <div className="relative">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[15px] font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                placeholder="0"
                min="1"
              />
            </div>
          </div>

          {/* Unit Price Field */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <DollarSign size={14} className="text-blue-500" />
              Unit Price
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
              <input
                type="number"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-8 pr-4 py-3 text-[15px] font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 flex justify-between items-center">
            <span className="text-[12px] font-bold text-blue-600 uppercase tracking-wider">New Total</span>
            <span className="text-[18px] font-black text-blue-700 font-mono">${(quantity * unitPrice).toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-[14px] font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={isPending}
            className="flex-1 px-4 py-3 bg-[#3b82f6] text-white text-[14px] font-bold rounded-xl shadow-lg shadow-blue-100 transition-all hover:bg-blue-600 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isPending ? 'Saving...' : 'Confirm Update'}
          </button>
        </div>
      </div>
    </div>
  )
}
