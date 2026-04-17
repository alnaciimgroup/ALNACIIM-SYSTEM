import { Header } from '@/components/layout/header'
import { getStaffDetailReport } from './actions'
import { User as UserIcon, Users, Droplet, Tag, Banknote, ChevronLeft, Calendar } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AccountantSalesTable } from '@/components/accountant/accountant-sales-table'

export default async function StaffDetailReportPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ date?: string }>
}) {
  const { id } = await params
  const { date } = await searchParams
  const { profile, stats, customers, sales, distributions, submissions } = await getStaffDetailReport(id, date)

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="Staff Detail Report" />
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full max-w-[1400px]">
          
          <div className="mb-6">
            <Link href="/dashboard/accountant/staff-reports" className="inline-flex items-center gap-2 text-[13px] font-bold text-[#64748b] hover:text-[#0f172a] transition-colors mb-4">
              <ChevronLeft size={16} /> Back to Staff Reports
            </Link>
            <div className="flex justify-between items-start w-full">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[20px] bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center">
                  <UserIcon size={32} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-[28px] font-black text-[#0f172a] tracking-tight leading-none mb-1">{profile.full_name}</h2>
                  <div className="flex items-center gap-3 text-[14px] font-medium text-[#64748b]">
                    <span className="uppercase tracking-wider font-extrabold text-[#3b82f6]">Staff Member</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#cbd5e1]"></span>
                    <span>Field Operations Active</span>
                  </div>
                </div>
              </div>

              <form className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-[12px] border border-[#e2e8f0] shadow-sm relative">
                  <Calendar size={16} className="text-[#64748b]" />
                  <input 
                    type="date" 
                    name="date"
                    defaultValue={date || ''}
                    className="text-[13px] font-black text-[#0f172a] uppercase focus:outline-none bg-transparent appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full cursor-pointer relative"
                  />
                </div>
                <button type="submit" className="bg-[#0f172a] text-white px-4 py-2 rounded-[12px] text-[13px] font-bold shadow-sm hover:bg-[#1e293b] transition-colors">
                  Filter
                </button>
                {date && (
                  <Link href={`/dashboard/accountant/staff-reports/${id}`} className="px-4 py-2 rounded-[12px] text-[13px] font-bold text-[#64748b] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] transition-colors shadow-sm">
                    Clear
                  </Link>
                )}
              </form>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-[20px] p-6 border border-[#e5e7eb] shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-[12px] bg-[#f8fafc] text-[#0f172a] flex items-center justify-center">
                  <Users size={20} strokeWidth={2.5} />
                </div>
                <div className="bg-[#ecfdf5] text-[#10b981] px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-[#d1fae5]">Active</div>
              </div>
              <div>
                <div className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-wider mb-1">Assigned Customers</div>
                <div className="text-[28px] font-black text-[#0f172a] tracking-tighter leading-none">{customers.length} <span className="text-[14px] font-medium text-[#94a3b8]">accounts</span></div>
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-6 border border-[#e5e7eb] shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-[12px] bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center">
                  <Droplet size={20} strokeWidth={2.5} />
                </div>
                <div className="bg-[#eff6ff] text-[#3b82f6] px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-[#dbeafe]">Audited</div>
              </div>
              <div>
                <div className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-wider mb-1">Tanks Received</div>
                <div className="mb-1 flex items-end gap-2">
                  <span className="text-[28px] font-black text-[#0f172a] tracking-tighter leading-none block">{stats.auditedDistributed}</span>
                  <span className="text-[12px] font-black text-[#10b981] mb-1.5 uppercase tracking-widest">{stats.auditedFreeTanks || 0} Free</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-6 border border-[#e5e7eb] shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-[12px] bg-[#ecfdf5] text-[#10b981] flex items-center justify-center">
                  <Tag size={20} strokeWidth={2.5} />
                </div>
                <div className="bg-[#ecfdf5] text-[#10b981] px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-[#d1fae5]">Audited</div>
              </div>
              <div>
                <div className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-wider mb-1">Tanks Sold</div>
                <div className="mb-1 flex items-end gap-2">
                  <span className="text-[28px] font-black text-[#0f172a] tracking-tighter leading-none block">{stats.auditedSold}</span>
                  <span className="text-[12px] font-black text-[#10b981] mb-1.5 uppercase tracking-widest">Period</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-6 border border-[#e5e7eb] shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-[12px] bg-[#ecfeff] text-[#0ea5e9] flex items-center justify-center">
                  <Banknote size={20} strokeWidth={2.5} />
                </div>
                <div className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-orange-100 italic">Financial</div>
              </div>
              <div>
                <div className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-wider mb-1">Total Revenue Generated</div>
                <div className="text-[28px] font-black text-[#0f172a] tracking-tighter leading-none">
                  ${(stats.auditedCollected + stats.auditedCredit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Sales History */}
            <AccountantSalesTable sales={sales} />

            {/* Submissions History */}
            <div className="bg-white border border-[#e5e7eb] rounded-[24px] shadow-sm overflow-hidden flex flex-col h-[500px]">
              <div className="p-6 border-b border-[#f1f5f9]">
                <h3 className="text-[16px] font-bold text-[#0f172a] tracking-tight flex items-center gap-2"><Banknote size={18} className="text-[#3b82f6]" /> Daily Submissions</h3>
              </div>
              <div className="overflow-y-auto flex-1 p-0">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white shadow-[0_1px_0_#f1f5f9]">
                    <tr>
                      <th className="px-6 py-3 text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Diff</th>
                      <th className="px-6 py-3 text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f8fafc]">
                    {submissions.length === 0 ? (
                      <tr><td colSpan={3} className="px-6 py-8 text-center text-[#94a3b8] text-[13px]">No submissions recorded yet.</td></tr>
                    ) : submissions.map((sub: any) => (
                      <tr key={sub.id} className="hover:bg-[#f8fafc]/50">
                        <td className="px-6 py-4 text-[13px] font-bold text-[#0f172a]">{new Date(sub.submission_date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-[13px] font-black">
                          <span className={sub.difference_amount === 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}>
                            {sub.difference_amount < 0 ? '-' : ''}${Math.abs(sub.difference_amount).toFixed(0)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`px-2 py-1 rounded-[6px] text-[10px] font-black uppercase tracking-wider ${
                            sub.status === 'pending' ? 'bg-[#fff7ed] text-[#ea580c] border border-[#ea580c]/30' :
                            sub.status === 'verified' ? 'bg-[#ecfdf5] text-[#10b981] border border-[#10b981]/30' :
                            'bg-[#fef2f2] text-[#ef4444] border border-[#ef4444]/30'
                          }`}>{sub.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e5e7eb] rounded-[24px] shadow-sm overflow-hidden flex flex-col mb-8">
            <div className="p-6 border-b border-[#f1f5f9]">
              <h3 className="text-[16px] font-bold text-[#0f172a] tracking-tight flex items-center gap-2">
                <Users size={18} className="text-[#8b5cf6]" /> Assigned Customers & Debts
              </h3>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                  <tr>
                    <th className="px-6 py-3 text-[11px] font-extrabold text-[#64748b] uppercase tracking-wider">Customer Name</th>
                    <th className="px-6 py-3 text-[11px] font-extrabold text-[#64748b] uppercase tracking-wider">Contact Number</th>
                    <th className="px-6 py-3 text-[11px] font-extrabold text-[#64748b] uppercase tracking-wider">Address / Zone</th>
                    <th className="px-6 py-3 text-[11px] font-extrabold text-[#64748b] uppercase tracking-wider text-right">Current Debt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {customers?.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-[#94a3b8] text-[13px]">No customers assigned to this staff member.</td></tr>
                  ) : customers?.map((c: any) => (
                    <tr key={c.id} className="hover:bg-[#f8fafc]/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-[14px] font-bold text-[#0f172a] block">{c.name}</span>
                        <span className="text-[11px] font-medium text-[#94a3b8]">Status: <span className="uppercase">{c.status}</span></span>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-medium text-[#475569]">{c.phone || '-'}</td>
                      <td className="px-6 py-4 text-[13px] text-[#64748b]">{c.address || '-'}</td>
                      <td className="px-6 py-4 text-[14px] font-black text-right">
                        {c.debt > 0 
                          ? <span className="text-[#ef4444]">${Number(c.debt).toFixed(2)}</span>
                          : <span className="text-[#10b981]">$0.00</span>
                        }
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
