import { Header } from '@/components/layout/header'
import { getAccountantCustomers } from './actions'
import Link from 'next/link'
import { Search, ChevronRight, Users as UsersIcon, ChevronLeft } from 'lucide-react'

export default async function AccountantCustomersPage({
  searchParams
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const { search, page } = await searchParams
  const currentPage = Number(page) || 1
  const { customers, totalCount, totalPages } = await getAccountantCustomers(search, currentPage)

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="Customer Accounts" />
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full max-w-[1400px]">
          
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-[22px] font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-3">
                <UsersIcon className="text-[#3b82f6]" size={24} strokeWidth={2.5} />
                Detailed Customer Registry
              </h2>
              <p className="text-[14px] font-medium text-[#64748b]">Comprehensive breakdown of customer accounts and financial balances.</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-[#94a3b8]" />
                </div>
                <form>
                  <input 
                    type="text" 
                    name="search"
                    defaultValue={search || ''}
                    placeholder="Search accounts..." 
                    className="h-10 pl-10 pr-4 bg-white border border-[#e2e8f0] rounded-[12px] text-[13px] font-medium text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] shadow-sm transition-all w-[250px]"
                  />
                </form>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e5e7eb] rounded-[24px] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider border-b border-[#f1f5f9]">Customer Name</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-[#3b82f6] uppercase tracking-wider border-b border-[#f1f5f9] text-center">Tag ID</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider border-b border-[#f1f5f9]">Staff Link</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider border-b border-[#f1f5f9]">Collected</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider border-b border-[#f1f5f9] text-center">Status</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider border-b border-[#f1f5f9] text-right">Total Debt</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-wider border-b border-[#f1f5f9] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f8fafc]">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-[#94a3b8] text-[14px] font-medium">
                        No records detected.
                      </td>
                    </tr>
                  ) : customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-[#f8fafc]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#eff6ff] text-[#3b82f6] font-bold text-[13px] flex items-center justify-center">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[14px] font-bold text-[#0f172a] uppercase">{customer.name}</span>
                            <span className="text-[11px] text-[#94a3b8] font-medium">{customer.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-[#eff6ff] text-[#3b82f6] px-3 py-1 rounded-[6px] text-[12px] font-black tracking-wider border border-[#dbeafe]">
                          {customer.tank_number || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[14px] font-bold text-[#475569]">
                        {(customer.staff as any)?.full_name || 'System Auto'}
                      </td>
                      <td className="px-6 py-4 text-[14px] font-black text-[#10b981]">
                        ${Number((customer as any).collected || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-[6px] text-[10px] font-black uppercase tracking-wider ${
                          customer.status === 'active' 
                            ? 'bg-[#ecfdf5] text-[#10b981]' 
                            : 'bg-[#fef2f2] text-[#ef4444]'
                        }`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[15px] font-black text-right">
                        <span className={Number(customer.debt) > 0 ? 'text-[#ef4444]' : 'text-[#94a3b8]'}>
                          ${Number(customer.debt || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/dashboard/accountant/customers/${customer.id}`}
                          className="inline-flex items-center gap-1 px-4 py-2 bg-white text-[#3b82f6] border border-[#e2e8f0] hover:bg-[#eff6ff] hover:border-[#3b82f6]/30 text-[12px] font-bold rounded-[8px] transition-colors shadow-sm"
                        >
                          View Details <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-5 border-t border-[#f1f5f9] flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-b-[24px]">
                <div className="text-[13px] font-bold text-[#64748b]">
                  Showing <span className="text-[#0f172a]">{((currentPage - 1) * 10) + 1}</span> to{' '}
                  <span className="text-[#0f172a]">{Math.min(currentPage * 10, totalCount)}</span> of{' '}
                  <span className="text-[#0f172a]">{totalCount.toLocaleString()}</span> accounts
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/accountant/customers?page=${currentPage - 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                    className={`inline-flex items-center gap-1 px-4 py-2 border rounded-[10px] text-[12px] font-bold transition-all shadow-sm ${
                      currentPage <= 1
                        ? 'bg-gray-50 border-gray-100 text-gray-400 pointer-events-none opacity-50'
                        : 'bg-white border-[#e2e8f0] text-[#3b82f6] hover:bg-[#f8fafc] hover:border-[#3b82f6]/30'
                    }`}
                  >
                    <ChevronLeft size={14} /> Previous
                  </Link>
                  <span className="text-[12px] font-bold text-[#0f172a] px-3 bg-slate-50 border border-slate-100 py-2 rounded-[10px]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Link
                    href={`/dashboard/accountant/customers?page=${currentPage + 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                    className={`inline-flex items-center gap-1 px-4 py-2 border rounded-[10px] text-[12px] font-bold transition-all shadow-sm ${
                      currentPage >= totalPages
                        ? 'bg-gray-50 border-gray-100 text-gray-400 pointer-events-none opacity-50'
                        : 'bg-white border-[#e2e8f0] text-[#3b82f6] hover:bg-[#f8fafc] hover:border-[#3b82f6]/30'
                    }`}
                  >
                    Next <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
