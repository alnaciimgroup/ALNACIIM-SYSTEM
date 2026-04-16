'use client'

import { useState } from 'react'
import { Hash, Pencil, Trash2 } from 'lucide-react'
import { EditSaleModal } from './edit-sale-modal'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { deleteSale } from '@/app/dashboard/staff/actions'
import { useToast } from '@/components/ui/toast'

interface SalesHistoryTableProps {
  sales: any[]
}

export function SalesHistoryTable({ sales }: SalesHistoryTableProps) {
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { showToast } = useToast()

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await deleteSale(deletingId)
      showToast('Sale deleted successfully!', 'success')
    } catch (err: any) {
      showToast(err.message || 'Failed to delete sale.', 'error')
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#f8fafc]">
            <th className="py-5 px-4 lg:px-8 text-[11px] font-black text-[#94a3b8] uppercase tracking-widest border-b border-[#f1f5f9]">Identity</th>
            <th className="py-5 text-[11px] font-black text-[#94a3b8] uppercase tracking-widest border-b border-[#f1f5f9]">Stakeholder</th>
            <th className="py-5 text-[11px] font-black text-[#94a3b8] uppercase tracking-widest border-b border-[#f1f5f9] hidden md:table-cell">Itemization</th>
            <th className="py-5 text-[11px] font-black text-[#94a3b8] uppercase tracking-widest border-b border-[#f1f5f9] hidden lg:table-cell">Unit Price</th>
            <th className="py-5 text-[11px] font-black text-[#94a3b8] uppercase tracking-widest border-b border-[#f1f5f9]">Aggregate</th>
            <th className="py-5 text-[11px] font-black text-[#94a3b8] uppercase tracking-widest border-b border-[#f1f5f9] hidden sm:table-cell">Method</th>
            <th className="py-5 pr-4 lg:pr-8 text-[11px] font-black text-[#94a3b8] uppercase tracking-widest border-b border-[#f1f5f9] text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1f5f9]">
          {sales.map(sale => {
            const firstItem = sale.sale_items?.[0] as any
            const itemName = firstItem?.item?.name || 'Water Tank'
            const qty = firstItem?.quantity || 0
            const price = firstItem?.unit_price || 0

            return (
              <tr key={sale.id} className="hover:bg-[#f8fafc]/80 transition-all border-l-4 border-transparent hover:border-[#3b82f6]">
                <td className="py-6 px-4 lg:px-8">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-[10px] bg-[#f1f5f9] flex flex-shrink-0 items-center justify-center text-[#64748b]">
                         <Hash size={14} className="lg:w-4 lg:h-4" strokeWidth={2.5} />
                      </div>
                      <span className="font-extrabold text-[#0f172a] text-[12px] lg:text-[13px] uppercase tracking-tighter whitespace-nowrap">{sale.id.slice(0, 8)}</span>
                   </div>
                </td>
                <td className="py-6">
                  <div className="flex flex-col">
                     <span className="font-black text-[#3b82f6] text-[14px] lg:text-[15px] uppercase tracking-tight whitespace-nowrap">{(sale.customer as any)?.name}</span>
                     <span className="text-[10px] lg:text-[11px] font-bold text-[#94a3b8] uppercase">Institutional Lead</span>
                  </div>
                </td>
                <td className="py-6 hidden md:table-cell">
                   <div className="flex items-center gap-2">
                      <span className="text-[13px] lg:text-[14px] font-bold text-[#1e293b] whitespace-nowrap">{itemName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#1e293b] text-white text-[9px] lg:text-[10px] font-black uppercase tracking-widest">{qty}X</span>
                   </div>
                </td>
                <td className="py-6 hidden lg:table-cell">
                   <span className="text-[13px] lg:text-[14px] font-bold text-[#64748b] whitespace-nowrap">${Number(price).toFixed(2)}</span>
                </td>
                <td className="py-6">
                   <span className="text-[15px] lg:text-[17px] font-black text-[#0f172a] tracking-tighter whitespace-nowrap">${Number(sale.total_amount).toFixed(2)}</span>
                </td>
                <td className="py-6 hidden sm:table-cell">
                  <span className={`inline-flex items-center px-2 lg:px-3 py-1 lg:py-1.5 rounded-[10px] text-[9px] lg:text-[10px] font-black uppercase tracking-widest border-2 whitespace-nowrap ${
                    sale.sale_type === 'cash' 
                      ? 'bg-[#ecfdf5] text-[#10b981] border-[#10b981]/10' 
                      : sale.sale_type === 'free'
                      ? 'bg-blue-50 text-blue-600 border-blue-100'
                      : 'bg-[#fff7ed] text-[#f59e0b] border-[#f59e0b]/10'
                  }`}>
                    {sale.sale_type === 'free' ? '🎁 FREE' : sale.sale_type}
                  </span>
                </td>
                <td className="py-6 pr-4 lg:pr-8 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button 
                      onClick={() => setEditingItem(sale)}
                      className="p-2 text-[#94a3b8] hover:text-[#3b82f6] hover:bg-[#eff6ff] rounded-lg transition-colors"
                    >
                      <Pencil size={18} strokeWidth={2.5} />
                    </button>
                    <button 
                      onClick={() => setDeletingId(sale.id)}
                      className="p-2 text-[#94a3b8] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}

          {sales.length === 0 && (
            <tr>
               <td colSpan={7} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                     <p className="text-[14px] font-bold text-[#94a3b8] uppercase tracking-widest">No matching transactions discovered</p>
                  </div>
               </td>
            </tr>
          )}
        </tbody>
      </table>

      {editingItem && (
        <EditSaleModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          sale={{
            id: editingItem.id,
            customerName: editingItem.customer?.name || 'Customer',
            quantity: editingItem.sale_items?.[0]?.quantity || 0,
            unitPrice: editingItem.sale_items?.[0]?.unit_price || 0
          }}
        />
      )}

      <ConfirmationDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Transaction?"
        description="This will permanently delete this sale and all associated item records. This cannot be undone."
      />
    </div>
  )
}
