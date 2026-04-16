'use client'

import { useState } from 'react'
import { Droplet, Pencil } from 'lucide-react'
import Link from 'next/link'
import { EditSaleModal } from './edit-sale-modal'

type SaleRecord = {
  id: string
  reference: string
  time: string
  quantity: number
  amount: number
  sale_type?: string
  customer_name?: string
}

export function RecentSales({ sales }: { sales: SaleRecord[] }) {
  const [editingItem, setEditingItem] = useState<SaleRecord | null>(null)

  return (
    <div className="bg-white border border-[#e5e7eb] shadow-sm rounded-[20px] p-4 lg:p-8 flex-1">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[16px] lg:text-[18px] font-bold text-[#0f172a] tracking-tight">Recent Sales</h2>
        <Link href="/dashboard/staff/history" className="text-[12px] lg:text-[13px] font-bold text-[#3b82f6] hover:text-blue-600 transition-colors">
          View All
        </Link>
      </div>

      <div className="overflow-x-auto -mx-4 lg:mx-0">
        <div className="inline-block min-w-full align-middle px-4 lg:px-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#f1f5f9]">
                <th className="pb-4 text-[10px] lg:text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest text-left">Reference</th>
                <th className="pb-4 text-[10px] lg:text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest text-left">Quantity</th>
                <th className="pb-4 text-[10px] lg:text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest text-left">Amount</th>
                <th className="pb-4 text-[10px] lg:text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {sales.map((record) => (
                <tr key={record.id} className="hover:bg-[#f8fafc] transition-colors group">
                  <td className="py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#0f172a] text-[13px] lg:text-[14px] leading-tight mb-1">{record.reference}</span>
                      <span className="text-[10px] lg:text-[11px] font-medium text-[#94a3b8]">{record.time}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="px-2 lg:px-3.5 py-1 lg:py-1.5 bg-[#f1f5f9] text-[#475569] text-[12px] lg:text-[13px] font-medium rounded-[8px] whitespace-nowrap">
                      {record.quantity} tanks
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`text-[13px] lg:text-[14px] font-bold whitespace-nowrap ${record.sale_type === 'free' || record.amount === 0 ? 'text-blue-600 font-black' : 'text-[#0f172a]'}`}>
                      {record.sale_type === 'free' || record.amount === 0 ? '🎁 FREE' : `$${record.amount.toFixed(2)}`}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button 
                      onClick={() => setEditingItem(record)}
                      className="p-2 text-[#94a3b8] hover:text-[#3b82f6] hover:bg-[#eff6ff] rounded-lg transition-colors inline-block"
                    >
                      <Pencil size={18} strokeWidth={2.5} />
                    </button>
                  </td>
                </tr>
              ))}

              {sales.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[14px] font-medium text-[#94a3b8]">
                    No sales recorded today.
                  </td>
                </tr>
              )}
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
            customerName: editingItem.customer_name || editingItem.reference,
            quantity: editingItem.quantity,
            unitPrice: editingItem.amount / editingItem.quantity
          }}
        />
      )}
    </div>
  )
}
