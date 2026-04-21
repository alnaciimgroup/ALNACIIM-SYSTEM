import { Header } from '@/components/layout/header'
import { getTransactions } from './actions'
import { getFilterMetadata } from '../reports/actions'
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Filter, 
  Download, 
  ChevronRight, 
  Calendar,
  User,
  History,
  Tag,
  Banknote,
  Truck,
  AlertCircle,
  ListOrdered
} from 'lucide-react'
import Link from 'next/link'

export default async function TransactionsPage({
  searchParams
}: {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    staffId?: string;
    type?: string;
  }>
}) {
  const params = await searchParams
  const transactions = await getTransactions(params)
  const meta = await getFilterMetadata()

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="System Transactions" />
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full max-w-[1400px]">
          
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-[22px] font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-3">
                <ListOrdered className="text-[#3b82f6]" size={24} strokeWidth={2.5} />
                Unified Transaction Ledger
              </h2>
              <p className="text-[14px] font-medium text-[#64748b]">All chronologically recorded sales and payments across the organization.</p>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="h-10 px-4 rounded-[12px] bg-[#3b82f6] text-white text-[13px] font-semibold flex items-center gap-2 hover:bg-[#2563eb] transition-colors shadow-sm shadow-blue-500/20">
                <Download size={15} />
                Export
              </button>
            </div>
          </div>

          <form className="bg-white border border-[#e5e7eb] rounded-[24px] shadow-sm p-8 mb-8">
            <h3 className="text-[16px] font-bold text-[#0f172a] tracking-tight mb-6 flex items-center gap-2">
              <Filter size={18} className="text-[#3b82f6]" /> Unified Ledger Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-[#64748b] uppercase tracking-widest leading-none">From Date</label>
                <input 
                  type="date" 
                  name="startDate"
                  defaultValue={params.startDate || ''}
                  className="w-full h-11 px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[14px] text-[13px] font-bold text-[#0f172a] focus:outline-none focus:border-[#3b82f6] shadow-sm" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-[#64748b] uppercase tracking-widest leading-none">To Date</label>
                <input 
                  type="date" 
                  name="endDate"
                  defaultValue={params.endDate || ''}
                  className="w-full h-11 px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[14px] text-[13px] font-bold text-[#0f172a] focus:outline-none focus:border-[#3b82f6] shadow-sm" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-[#64748b] uppercase tracking-widest leading-none">Personnel</label>
                <select 
                  name="staffId"
                  defaultValue={params.staffId || ''}
                  className="w-full h-11 px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[14px] text-[13px] font-bold text-[#0f172a] focus:outline-none focus:border-[#3b82f6] appearance-none"
                >
                  <option value="">All Staff</option>
                  {meta.staff.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-[#64748b] uppercase tracking-widest leading-none">Tran Type</label>
                <select 
                  name="type"
                  defaultValue={params.type || ''}
                  className="w-full h-11 px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[14px] text-[13px] font-bold text-[#0f172a] focus:outline-none focus:border-[#3b82f6] appearance-none"
                >
                  <option value="">All Activities</option>
                  <option value="sale">Sales Only</option>
                  <option value="payment">Payments Only</option>
                  <option value="submission">Submissions Only</option>
                  <option value="distribution">Distributions Only</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <button type="submit" className="h-11 bg-[#0f172a] hover:bg-black text-white font-black text-[12px] uppercase tracking-widest rounded-[14px] transition-all shadow-lg active:scale-95 text-center">
                  Filter Ledger
                </button>
              </div>
            </div>
          </form>

          <div className="bg-white border border-[#e5e7eb] rounded-[24px] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#e5e7eb]">
                    <th className="px-6 py-5 text-[11px] font-black text-[#64748b] uppercase tracking-widest">Transaction ID</th>
                    <th className="px-6 py-5 text-[11px] font-black text-[#64748b] uppercase tracking-widest">Type</th>
                    <th className="px-6 py-5 text-[11px] font-black text-[#64748b] uppercase tracking-widest">Staff / Source</th>
                    <th className="px-6 py-5 text-[11px] font-black text-[#64748b] uppercase tracking-widest">Customer / Destination</th>
                    <th className="px-6 py-5 text-[11px] font-black text-[#64748b] uppercase tracking-widest text-right">Amount</th>
                    <th className="px-6 py-5 text-[11px] font-black text-[#64748b] uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-5 text-[11px] font-black text-[#64748b] uppercase tracking-widest text-right">Date / Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-[#94a3b8] text-[14px] font-medium">
                        No transactions found matching your criteria.
                      </td>
                    </tr>
                  ) : transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#f8fafc] transition-colors group">
                      <td className="px-6 py-5">
                        <span className="text-[13px] font-black text-[#0f172a] font-mono tracking-tighter">{tx.displayId}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-black uppercase tracking-widest border ${tx.typeColor}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-[14px] font-bold text-[#0f172a]">{tx.staffName}</span>
                            <span className="text-[11px] font-medium text-[#94a3b8] uppercase">Originator</span>
                          </div>
                      </td>
                      <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-[14px] font-bold text-[#334155]">{tx.customerName}</span>
                            <span className="text-[11px] font-medium text-[#94a3b8] uppercase">Entity</span>
                          </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className={`text-[15px] font-black ${tx.amount !== 0 ? 'text-[#0f172a]' : 'text-[#94a3b8]'}`}>
                          {tx.isCurrency 
                            ? `$${Number(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                            : `${tx.amount} Units`
                          }
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-black uppercase tracking-widest border ${
                          tx.status === 'completed' || tx.status === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          tx.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-[13px] font-bold text-[#475569]">{tx.date.toLocaleDateString()}</span>
                          <span className="text-[11px] font-medium text-[#94a3b8]">{tx.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-[#f1f5f9] bg-[#f8fafc]/50 text-center">
              <span className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider">Showing {transactions.length} recent transactions</span>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
