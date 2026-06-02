import { Header } from '@/components/layout/header'
import { createClient } from '@/utils/supabase/server'
import { ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'
import { SalesHistoryFilters } from '@/components/staff/sales-history-filters'
import { SalesHistoryTable } from '@/components/staff/sales-history-table'

export default async function SalesHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>
}) {
  const { q, type } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  let query = supabase
    .from('sales')
    .select(`
      id,
      created_at,
      sale_type,
      total_amount,
      status,
      customer:customers(id, name),
      customer_id,
      sale_items(
        quantity,
        unit_price,
        item:items(name)
      )
    `)
    .eq('staff_id', user.id)
    .order('created_at', { ascending: false })

  if (q) {
    query = query.or(`id.ilike.%${q}%`)
  }

  if (type && type !== 'all') {
    query = query.eq('sale_type', type)
  }

  const { data: sales } = await query

  // Client-side filtering fallback for customer name search
  const filteredSales = q 
    ? sales?.filter(s => 
        s.id.toLowerCase().includes(q.toLowerCase()) || 
        (s.customer as any)?.name.toLowerCase().includes(q.toLowerCase())
      )
    : sales

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="Sales Audit" />
      <main className="flex-1 overflow-y-auto px-4 lg:px-8 pt-6 pb-8">
        <div className="w-full max-w-[1200px] mx-auto">
          
          <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
            <div>
              <Link href="/dashboard/staff" className="flex items-center gap-2 text-[#64748b] hover:text-[#3b82f6] font-bold text-[12px] mb-3 transition-colors uppercase tracking-widest group">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Return to Dashboard
              </Link>
              <h2 className="text-[24px] lg:text-[32px] font-black text-[#0f172a] mb-1 tracking-tight uppercase leading-none">Sales Audit</h2>
              <p className="text-[14px] lg:text-[15px] font-medium text-[#64748b]">Comprehensive log of all distributions and sales.</p>
            </div>
            
            <div className="flex items-center gap-3">
               <button className="bg-white border border-[#e2e8f0] text-[#0f172a] font-bold h-[44px] lg:h-[48px] px-4 lg:px-6 rounded-[14px] flex items-center gap-2 transition-all shadow-sm hover:bg-[#f8fafc] active:scale-95">
                 <Download size={18} className="text-[#3b82f6]" /> 
                 <span className="text-[12px] lg:text-[14px] uppercase tracking-wider font-black">Export XML</span>
               </button>
            </div>
          </div>

          <div className="bg-white border border-[#e5e7eb] shadow-sm rounded-[20px] lg:rounded-[28px] overflow-hidden">
            <SalesHistoryFilters initialQ={q} initialType={type} />
            <SalesHistoryTable sales={filteredSales || []} />
          </div>
        </div>
      </main>
    </div>
  )
}
