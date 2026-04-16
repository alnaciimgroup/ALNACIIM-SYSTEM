'use client'

import { useState } from 'react'
import { Calendar, Tag, Pencil } from 'lucide-react'
import { EditSaleModal } from '@/components/staff/edit-sale-modal'

export function AccountantSalesTable({ sales }: { sales: any[] }) {
  const [editingItem, setEditingItem] = useState<any | null>(null)

  return (
    <>
      <div className="bg-white border border-[#e5e7eb] rounded-[24px] shadow-sm overflow-hidden flex flex-col h-[500px]">
        <div className="p-6 border-b border-[#f1f5f9]">
          <h3 className="text-[16px] font-bold text-[#0f172a] tracking-tight flex items-center gap-2">
            <Tag size={18} className="text-[#10b981]" /> Recent Sales
          </h3>
        </div>
        <div className="overflow-y-auto flex-1 p-0">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-white shadow-[0_1px_0_#f1f5f9] z-10">
              <tr>
                <th className="px-6 py-3 text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-3 text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f8fafc]">
              {sales.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-[#94a3b8] text-[13px]">No sales recorded yet.</td></tr>
              ) : sales.map((sale: any) => (
                <tr key={sale.id} className="hover:bg-[#f8fafc]/50">
                  <td className="px-6 py-4 text-[13px] font-medium text-[#475569]">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-[#94a3b8]"/>
                      <span suppressHydrationWarning>{new Date(sale.created_at).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[13px] font-bold text-[#0f172a]">
                    {(sale.customer as any)?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-[13px] font-bold uppercase tracking-wider">
                    <span className={sale.sale_type === 'cash' ? 'text-[#3b82f6]' : sale.sale_type === 'free' ? 'text-[#10b981] bg-[#ecfdf5] px-2 py-1 rounded-md' : 'text-[#f59e0b]'}>{sale.sale_type}</span>
                  </td>
                  <td className="px-6 py-4 text-[14px] font-black text-[#0f172a] text-right">${Number(sale.total_amount).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                     <button 
                       onClick={() => setEditingItem(sale)}
                       className="p-1.5 text-[#94a3b8] hover:text-[#3b82f6] hover:bg-[#eff6ff] rounded-lg transition-colors inline-block"
                       title="Edit Sale"
                     >
                       <Pencil size={16} strokeWidth={2.5} />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingItem && (
        <EditSaleModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          sale={{
            id: editingItem.id,
            customerName: editingItem.customer?.name || 'Customer',
            quantity: editingItem.sale_items?.[0]?.quantity || parseInt(editingItem.total_amount) / 5 || 0,
            unitPrice: (Number(editingItem.total_amount) / (editingItem.sale_items?.[0]?.quantity || 1)) || 5
          }}
        />
      )}
    </>
  )
}
