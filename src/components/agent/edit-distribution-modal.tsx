'use client'

import { useState } from 'react'
import { X, Droplet, MapPin, Calculator } from 'lucide-react'
import { updateDistribution } from '@/app/dashboard/agent/actions'
import { useToast } from '@/components/ui/toast'

interface EditDistributionModalProps {
  isOpen: boolean
  onClose: () => void
  distribution: {
    id: string
    quantity: number
    zone?: string
    staffName: string
  }
}

export function EditDistributionModal({ isOpen, onClose, distribution }: EditDistributionModalProps) {
  const [quantity, setQuantity] = useState(distribution.quantity)
  const [zone, setZone] = useState(distribution.zone || '')
  const [isPending, setIsPending] = useState(false)
  const { showToast } = useToast()

  if (!isOpen) return null

  const handleUpdate = async () => {
    setIsPending(true)
    try {
      await updateDistribution(distribution.id, quantity, zone)
      showToast('Distribution updated successfully!', 'success')
      onClose()
    } catch (err) {
      showToast('Failed to update distribution.', 'error')
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
            <h3 className="text-[18px] font-bold text-gray-900 leading-tight">Edit Assignment</h3>
            <p className="text-[12px] font-bold text-blue-500 uppercase tracking-widest mt-1">Staff: {distribution.staffName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Quantity Field */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Calculator size={14} className="text-blue-500" />
              Number of Liters
            </label>
            <div className="relative">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-[15px] font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="0"
                min="1"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-gray-400">
                LITERS
              </div>
            </div>
          </div>

          {/* Zone Field */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <MapPin size={14} className="text-blue-500" />
              Assigned Zone / Area
            </label>
            <input
              type="text"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-[15px] font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-300 placeholder:font-medium"
              placeholder="e.g. Zone A, North Street"
            />
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
            {isPending ? 'Saving...' : 'Update Records'}
          </button>
        </div>
      </div>
    </div>
  )
}
