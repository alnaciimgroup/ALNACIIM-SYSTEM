'use client'

import { ShoppingCart, Wallet, Gift, User, Calendar, Tag } from 'lucide-react'

interface SaleItem {
  quantity: number
  items: { name: string } | null
}

interface Sale {
  id: string
  created_at: string
  total_amount: number
  sale_type: string
  customer: { name: string } | null
  items: SaleItem[]
}

interface Payment {
  amount: number
  payment_method: string
  created_at: string
  sale: {
    customer_id: string
    customers: { name: string } | null
  } | null
}

interface Props {
  sales: Sale[]
  payments: Payment[]
}

export function SubmissionBreakdownList({ sales, payments }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* Sales Section */}
      <div className="flex flex-col gap-3">
        <h4 className="text-[12px] font-black text-[#64748b] uppercase tracking-widest flex items-center gap-2 px-1">
          <ShoppingCart size={14} /> Transactions Breakdwon
        </h4>
        <div className="flex flex-col gap-3">
          {sales.length === 0 && (
            <div className="p-4 rounded-[18px] bg-gray-50 text-gray-400 text-[13px] font-medium text-center border-2 border-dashed border-gray-100">
              No sales recorded for this period.
            </div>
          )}
          {sales.map((sale) => (
            <div key={sale.id} className="bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-[22px] flex items-center justify-between transition-all hover:border-[#3b82f6]/30">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  sale.sale_type === 'free' ? 'bg-indigo-50 text-indigo-500' : 
                  sale.sale_type === 'credit' ? 'bg-orange-50 text-orange-500' : 'bg-emerald-50 text-emerald-500'
                }`}>
                  {sale.sale_type === 'free' ? <Gift size={18} /> : <Tag size={18} />}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-black text-[#0f172a] uppercase tracking-tight">
                      {sale.customer?.name || 'Walk-in Customer'}
                    </span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-[6px] border ${
                      sale.sale_type === 'free' ? 'bg-indigo-500 text-white border-indigo-600' :
                      sale.sale_type === 'credit' ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-emerald-100 text-emerald-600 border-emerald-200'
                    }`}>
                      {sale.sale_type.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#64748b]">
                    {sale.items.map(i => `${i.quantity}x ${i.items?.name || 'Tank'}`).join(', ')}
                  </span>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className={`text-[16px] font-black ${sale.sale_type === 'free' ? 'text-indigo-500 line-through opacity-50' : 'text-[#0f172a]'}`}>
                  ${Number(sale.total_amount).toFixed(2)}
                </span>
                <span suppressHydrationWarning className="text-[10px] font-bold text-[#94a3b8] uppercase">
                  {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Debt Payments Section */}
      {payments.length > 0 && (
        <div className="flex flex-col gap-3">
          <h4 className="text-[12px] font-black text-[#64748b] uppercase tracking-widest flex items-center gap-2 px-1">
            <Wallet size={14} /> Debt Repayments
          </h4>
          <div className="flex flex-col gap-3">
            {payments.map((p, idx) => (
              <div key={idx} className="bg-[#f0f9ff] border border-[#bae6fd] p-4 rounded-[22px] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#0ea5e9] shadow-sm">
                    <Wallet size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-black text-[#0f172a] uppercase tracking-tight">
                      {p.sale?.customers?.name || 'Unknown Customer'}
                    </span>
                    <span className="text-[10px] font-bold text-[#0ea5e9] uppercase tracking-wider">Historical Debt Collection</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-[16px] font-black text-[#0ea5e9]">
                    +${Number(p.amount).toFixed(2)}
                  </span>
                   <span suppressHydrationWarning className="text-[10px] font-bold text-[#94a3b8] uppercase">
                    {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
