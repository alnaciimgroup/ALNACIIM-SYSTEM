import { Header } from '@/components/layout/header'
import { getStaffDashboardData } from '../actions'
import { ArrowDownLeft, ArrowUpRight, Droplet, Package } from 'lucide-react'

export default async function MyTanksPage() {
  const { metrics, recentDistributions } = await getStaffDashboardData()

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="" />
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full">
          
          <div className="mb-8">
            <h2 className="text-[28px] font-black text-[#0f172a] mb-1 tracking-tight">Inventory Management (My Tanks)</h2>
            <p className="text-[15px] font-medium text-[#64748b]">Track your stock levels, distributions received, and sales depleted.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border border-[#e5e7eb] rounded-[24px] p-8 shadow-sm flex flex-col justify-between h-[180px]">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-[16px] bg-[#eff6ff] flex items-center justify-center text-[#3b82f6]">
                  <ArrowDownLeft size={24} strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-black text-[#3b82f6] bg-[#eff6ff] px-3 py-1 rounded-full uppercase">Total In</span>
              </div>
              <div>
                <span className="text-[36px] font-black text-[#0f172a] leading-none">{metrics.tanksReceivedLifetime}</span>
                <p className="text-[14px] text-[#64748b] font-medium mt-1">Tanks Received Lifetime</p>
              </div>
            </div>

            <div className="bg-white border border-[#e5e7eb] rounded-[24px] p-8 shadow-sm flex flex-col justify-between h-[180px]">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-[16px] bg-[#ecfdf5] flex items-center justify-center text-[#10b981]">
                  <ArrowUpRight size={24} strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-black text-[#10b981] bg-[#ecfdf5] px-3 py-1 rounded-full uppercase">Total Out</span>
              </div>
              <div>
                <span className="text-[36px] font-black text-[#0f172a] leading-none">{metrics.tanksSoldLifetime}</span>
                <p className="text-[14px] text-[#64748b] font-medium mt-1">Tanks Sold Lifetime</p>
              </div>
            </div>

            <div className="bg-[#3b82f6] rounded-[24px] p-8 shadow-xl shadow-blue-500/20 flex flex-col justify-between h-[180px] text-white">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-[16px] bg-white/20 flex items-center justify-center text-white">
                  <Package size={24} strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-black text-white bg-white/10 px-3 py-1 rounded-full uppercase">Current Stock</span>
              </div>
              <div>
                <span className="text-[42px] font-black text-white leading-none">{metrics.remainingTanks}</span>
                <p className="text-[14px] text-white/70 font-medium mt-1">Tanks Available for Sale</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e5e7eb] shadow-sm rounded-[24px] p-8">
            <h3 className="text-[18px] font-black text-[#0f172a] tracking-tight mb-6">Recent Distributions from Agent</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#f1f5f9]">
                    <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider">Reference</th>
                    <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider">Date & Time</th>
                    <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider">Quantity</th>
                    <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider">Zone</th>
                    <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {recentDistributions.map(dist => (
                    <tr key={dist.id} className="hover:bg-[#f8fafc]/50 transition-colors">
                      <td className="py-5 font-bold text-[#0f172a] text-[14px]">{(dist.id as string).slice(0, 8)}...</td>
                      <td className="py-5">
                        <span className="text-[14px] font-bold text-[#1e293b] block">{new Date(dist.created_at || '').toLocaleDateString()}</span>
                        <span className="text-[12px] text-[#94a3b8] font-medium">{new Date(dist.created_at || '').toLocaleTimeString()}</span>
                      </td>
                      <td className="py-5">
                         <span className="px-3 py-1 bg-[#eff6ff] text-[#3b82f6] text-[13px] font-black rounded-full">
                            {dist.quantity} TANKS
                         </span>
                      </td>
                      <td className="py-5 text-[14px] text-[#64748b] font-medium">Standard</td>
                      <td className="py-5 text-right">
                        <span className="text-[11px] font-black text-[#10b981] uppercase tracking-widest px-2 py-1 bg-[#ecfdf5] rounded-[6px] border border-[#10b981]/10">
                          COMPLETED
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentDistributions.length === 0 && (
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
