import { Header } from '@/components/layout/header'
import { BarChart, CalendarDays, Filter, Download } from 'lucide-react'
import { getAgentReportsData } from '../actions'

export default async function ReportsPage() {
  const { reports, metrics } = await getAgentReportsData()

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="Operational Reports" />
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full">
          <section className="mb-6 flex justify-between items-end">
            <div>
              <h2 className="text-[18px] font-bold text-[#0f172a] mb-1">Distribution Analytics</h2>
              <p className="text-[14px] font-medium text-[#64748b]">Generate and review non-financial operational distribution patterns.</p>
            </div>
            
            <button className="bg-[#4fa0ff] hover:bg-[#3b82f6] text-white font-bold h-[44px] px-6 rounded-[12px] flex items-center gap-2 transition-colors shadow-sm text-[14px]">
              <Download size={16} /> Export Selected Report
            </button>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             <div className="p-6 rounded-[20px] bg-white border border-[#e5e7eb] flex flex-col justify-between h-[150px] shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-[12px] bg-[#eff6ff] flex items-center justify-center text-[#3b82f6]">
                    <BarChart size={20} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-[#64748b] font-medium text-[15px] leading-snug">Highest Volume Period</h3>
                </div>
                <div>
                  <span className="text-[28px] font-extrabold text-[#0f172a] tracking-tight leading-none block mb-1">{metrics.highestPeriod}</span>
                  <p className="text-[13px] text-[#3b82f6] font-semibold">{metrics.highestVolume} liters assigned</p>
                </div>
             </div>
             
             <div className="p-6 rounded-[20px] bg-white border border-[#e5e7eb] flex flex-col justify-between h-[150px] shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-[12px] bg-[#f1f5f9] flex items-center justify-center text-[#64748b]">
                    <CalendarDays size={20} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-[#64748b] font-medium text-[15px] leading-snug">Average Daily Run-rate</h3>
                </div>
                <div>
                  <span className="text-[28px] font-extrabold text-[#0f172a] tracking-tight leading-none block mb-1">{metrics.averageDaily}</span>
                  <p className="text-[13px] text-[#94a3b8] font-semibold">Liters per day</p>
                </div>
             </div>
          </div>

          <div className="bg-white border border-[#e5e7eb] shadow-sm rounded-[20px] p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[16px] font-bold text-[#0f172a] tracking-tight">Periodic Breakdown</h3>
              <div className="flex gap-2">
                <button className="px-4 py-2.5 bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0] text-[13px] font-bold rounded-[12px] hover:bg-[#f1f5f9] transition-colors flex items-center gap-2">
                  <Filter size={16} /> Customize Filters
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#f1f5f9]">
                    <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider">Time Period</th>
                    <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider">Total Liters Distributed</th>
                    <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider">Active Staff Count</th>
                    <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider text-right">Most Active Zone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {reports.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[#f8fafc]/50 transition-colors">
                      <td className="py-4 font-bold text-[#0f172a] text-[15px]">{row.period}</td>
                      <td className="py-4 font-bold text-[#3b82f6] text-[15px]">{row.totalTanks}</td>
                      <td className="py-4 text-[14px] text-[#0f172a] font-medium">{row.activeStaff} members</td>
                      <td className="py-4 text-right text-[14px] text-[#64748b] font-medium">{row.mostActiveZone}</td>
                    </tr>
                  ))}
                  {reports.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-[14px] font-medium text-[#94a3b8]">
                        No distribution reports found.
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
