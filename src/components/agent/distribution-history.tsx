'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { EditDistributionModal } from './edit-distribution-modal'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { deleteDistribution } from '@/app/dashboard/agent/actions'
import { useToast } from '@/components/ui/toast'

export type DistributionRecord = {
  id: string
  created_at: string
  quantity: number
  liters?: number
  status: string
  zone?: string
  staff: {
    full_name: string
  }
}

export function DistributionHistory({ distributions }: { distributions: DistributionRecord[] }) {
  const [editingItem, setEditingItem] = useState<DistributionRecord | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { showToast } = useToast()

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <span className="px-3 py-1.5 bg-[#ecfdf5] text-[#10b981] text-[13px] font-bold rounded-full">Completed</span>
      case 'in transit':
        return <span className="px-3 py-1.5 bg-[#fffbeb] text-[#f59e0b] text-[13px] font-bold rounded-full">In Transit</span>
      default:
        return <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-[13px] font-bold rounded-full capitalize">{status}</span>
    }
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await deleteDistribution(deletingId)
      showToast('Distribution deleted successfully!', 'success')
    } catch (err) {
      showToast('Failed to delete distribution.', 'error')
    }
  }

  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-[20px] p-4 lg:p-8 flex-1">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg lg:text-xl font-bold text-gray-900 tracking-tight">Today's Distributions</h2>
        <Link href="/dashboard/agent/history" className="text-[13px] lg:text-[14px] font-bold text-blue-500 hover:text-blue-600 transition-colors">
          View All
        </Link>
      </div>

      <div className="overflow-x-auto -mx-4 lg:mx-0">
        <div className="inline-block min-w-full align-middle px-4 lg:px-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-4 text-[11px] lg:text-[13px] font-semibold text-gray-400 uppercase tracking-wider">Staff Member</th>
                <th className="pb-4 text-[11px] lg:text-[13px] font-semibold text-gray-400 uppercase tracking-wider">Volume Load</th>
                <th className="pb-4 text-[11px] lg:text-[13px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Time</th>
                <th className="pb-4 text-[11px] lg:text-[13px] font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/80">
              {distributions.map((record) => (
                <tr key={record.id} className="hover:bg-[#f8fafc] transition-colors group">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-[#eff6ff] text-[#3b82f6] flex flex-shrink-0 items-center justify-center font-bold text-[12px] lg:text-[14px]">
                        {record.staff.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-gray-900 text-[14px] lg:text-[15px] whitespace-nowrap">{record.staff.full_name}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-[14px] lg:text-[15px] text-gray-900 font-bold whitespace-nowrap">
                      {record.liters ? `${record.liters.toLocaleString()} Liters` : `${record.quantity} Tanks`}
                    </span>
                  </td>
                  <td className="py-4 text-[14px] lg:text-[15px] font-medium text-gray-500 hidden sm:table-cell">
                    {formatTime(record.created_at)}
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => setEditingItem(record)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => setDeletingId(record.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {distributions.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[15px] font-medium text-gray-400">
                    No distributions recorded today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingItem && (
        <EditDistributionModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          distribution={{
            id: editingItem.id,
            quantity: editingItem.quantity,
            zone: editingItem.zone,
            staffName: editingItem.staff.full_name
          }}
        />
      )}

      <ConfirmationDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Distribution?"
        description="This action will permanently remove this tank assignment. This cannot be undone."
      />
    </div>
  )
}
