import { Header } from '@/components/layout/header'
import { getStaffReportsList } from './actions'
import Link from 'next/link'
import { Search, ChevronRight, FileSpreadsheet } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export default async function StaffReportsPage() {
  const reports = await getStaffReportsList()

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="Staff Reports" />
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full max-w-[1400px]">
          
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-[22px] font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-3">
                <FileSpreadsheet className="text-[#3b82f6]" size={24} strokeWidth={2.5} />
                Detailed Performance Reports
              </h2>
              <p className="text-[14px] font-medium text-[#64748b]">Comprehensive breakdown of staff daily activity and financial reconciliation.</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-[#94a3b8]" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search staff..." 
                  className="h-10 pl-10 pr-4 bg-white border border-[#e2e8f0] rounded-[12px] text-[13px] font-medium text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] shadow-sm transition-all w-[250px]"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e5e7eb] rounded-[24px] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider border-b border-[#f1f5f9]">Staff Name</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider border-b border-[#f1f5f9]">Received Today</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider border-b border-[#f1f5f9]">Sold</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider border-b border-[#f1f5f9]">Cash Sales</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider border-b border-[#f1f5f9]">Credit Sales</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider border-b border-[#f1f5f9]">Collected</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider border-b border-[#f1f5f9]">Submitted</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider border-b border-[#f1f5f9]">Difference</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider border-b border-[#f1f5f9]">Total Debt</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider border-b border-[#f1f5f9] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f8fafc]">
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-8 text-center text-[#94a3b8] text-[14px] font-medium">
                        No staff activity recorded today.
                      </td>
                    </tr>
                  ) : reports.map((staff) => (
                    <tr key={staff.id} className="hover:bg-[#f8fafc]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#eff6ff] text-[#3b82f6] font-bold text-[13px] flex items-center justify-center">
                            {staff.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[14px] font-bold text-[#0f172a]">{staff.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[14px] font-bold text-[#475569]">{staff.received}</td>
                      <td className="px-6 py-4 text-[14px] font-bold text-[#10b981]">{staff.sold}</td>
                      <td className="px-6 py-4 text-[14px] font-black text-[#0f172a]">${staff.cashSales.toFixed(2)}</td>
                      <td className="px-6 py-4 text-[14px] font-black text-[#f59e0b]">${staff.creditSales.toFixed(2)}</td>
                      <td className="px-6 py-4 text-[14px] font-black text-[#0ea5e9]">${staff.collected.toFixed(2)}</td>
                      <td className="px-6 py-4 text-[14px] font-black text-[#0f172a]">${staff.submitted.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-[6px] text-[12px] font-black tracking-wide ${
                          staff.difference === 0 
                            ? 'bg-[#ecfdf5] text-[#10b981]' 
                            : 'bg-[#fef2f2] text-[#ef4444]'
                        }`}>
                          {staff.difference < 0 ? '-' : ''}${Math.abs(staff.difference).toFixed(0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[14px] font-black text-[#ef4444]">
                        ${staff.outstandingDebt.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/dashboard/accountant/staff-reports/${staff.id}`}
                          className="inline-flex items-center gap-1 px-4 py-2 bg-white text-[#3b82f6] border border-[#e2e8f0] hover:bg-[#eff6ff] hover:border-[#3b82f6]/30 text-[12px] font-bold rounded-[8px] transition-colors"
                        >
                          View Details <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
