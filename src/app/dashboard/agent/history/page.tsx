import { Header } from '@/components/layout/header'
import { Search, Filter, Download } from 'lucide-react'
import { getDistributionHistory } from '../actions'

export default async function HistoryPage() {
  const history = await getDistributionHistory()

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="Distribution History" />
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full">
          <section className="mb-6 flex justify-between items-end">
            <div>
              <h2 className="text-[18px] font-bold text-[#0f172a] mb-1">Historical Audit Trail</h2>
              <p className="text-[14px] font-medium text-[#64748b]">Review past distribution records and assignments.</p>
            </div>
            <button className="px-4 py-2 bg-white border border-[#e2e8f0] text-[#0f172a] font-bold rounded-md shadow-sm flex items-center gap-2 hover:bg-[#f8fafc] transition-colors text-[14px]">
              <Download size={16} className="text-[#64748b]"/> Export CSV
            </button>
          </section>

          <div className="bg-white border border-[#e5e7eb] shadow-sm rounded-[20px] p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-[#f8fafc] border border-[#e2e8f0] text-[#94a3b8] w-[300px] focus-within:ring-2 focus-within:ring-[#3b82f6]/20 transition-all">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search by ID or Staff..." 
                  className="bg-transparent border-none outline-none text-[13px] w-full text-[#0f172a] placeholder-[#94a3b8] font-medium"
                />
              </div>
              <button className="px-4 py-2.5 bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0] text-[13px] font-bold rounded-[12px] hover:bg-[#f1f5f9] transition-colors flex items-center gap-2">
                <Filter size={16} /> Filter by Date
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#f1f5f9]">
                    <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider">ID</th>
                    <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider">Staff Name</th>
                    <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider text-center">Volume Load</th>
                    <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider text-center">Zone</th>
                    <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider text-right">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {history.map(record => (
                    <tr key={record.id} className="hover:bg-[#f8fafc]/50 transition-colors">
                      <td className="py-4 font-bold text-[#0f172a] text-[12px] font-mono opacity-60">#{record.id.slice(0, 8)}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[11px] uppercase">{record.staff.charAt(0)}</div>
                           <span className="font-bold text-[#0f172a] text-[14px]">{record.staff}</span>
                        </div>
                      </td>
                      <td className="py-4 text-center font-black text-[#0f172a] text-[15px]">{record.liters ? `${record.liters.toLocaleString()} Liters` : `${record.quantity} Liters`}</td>
                      <td className="py-4 text-center">
                        <span className="px-3 py-1 bg-gray-100 text-[#475569] text-[11px] font-bold rounded-full uppercase tracking-tight">{record.zone}</span>
                      </td>
                      <td className="py-4 text-right text-[13px] text-[#64748b] font-medium">{record.date}</td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[14px] font-medium text-[#94a3b8]">
                        No distribution history found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
