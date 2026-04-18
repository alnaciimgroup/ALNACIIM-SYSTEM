import { Header } from '@/components/layout/header'
import { Search, UserCheck } from 'lucide-react'

import { getStaffNetworkDetails } from '../actions'

export default async function StaffListPage() {
  const staffList = await getStaffNetworkDetails()

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="Staff Management" />
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full">
          <section className="mb-6 flex justify-between items-end">
            <div>
              <h2 className="text-[18px] font-bold text-[#0f172a] mb-1">Active Staff List</h2>
              <p className="text-[14px] font-medium text-[#64748b]">Monitor assigned tanks and distribution activity across your staff network.</p>
            </div>
          </section>

          <div className="bg-white border border-[#e5e7eb] shadow-sm rounded-[20px] p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-[#f8fafc] border border-[#e2e8f0] text-[#94a3b8] w-[300px] focus-within:ring-2 focus-within:ring-[#3b82f6]/20 transition-all">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search staff members..." 
                  className="bg-transparent border-none outline-none text-[13px] w-full text-[#0f172a] placeholder-[#94a3b8] font-medium"
                />
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0] text-[13px] font-bold rounded-[10px] hover:bg-[#f1f5f9] transition-colors">
                  Filter: Active Only
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#f1f5f9]">
                    <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider">Staff Member</th>
                    <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider">Phone</th>
                    <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider">Status</th>
                    <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider">Lifetime Tanks</th>
                    <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider">Current Stock</th>
                    <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {staffList.map(staff => (
                    <tr key={staff.id} className="hover:bg-[#f8fafc]/50 transition-colors">
                      <td className="py-4 font-bold text-[#0f172a] text-[15px]">{staff.name}</td>
                      <td className="py-4 text-[14px] text-[#64748b] font-medium">{staff.phone}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 text-[12px] font-bold rounded-full ${staff.status === 'Active' ? 'bg-[#ecfdf5] text-[#10b981]' : 'bg-[#f1f5f9] text-[#94a3b8]'}`}>
                          {staff.status}
                        </span>
                      </td>
                      <td className="py-4 font-bold text-[#0f172a]">{staff.tanksReceived}</td>
                      <td className="py-4">
                         <span className={`font-bold ${staff.currentStock < 10 && staff.status === 'Active' ? 'text-[#ef4444]' : 'text-[#3b82f6]'}`}>
                            {staff.currentStock} tanks
                         </span>
                      </td>
                      <td className="py-4 text-right">
                        <button className="text-[13px] font-bold text-[#3b82f6] hover:text-[#2563eb] transition-colors">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {staffList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[14px] font-medium text-[#94a3b8]">
                        No staff members found.
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
