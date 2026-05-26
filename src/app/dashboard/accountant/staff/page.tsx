import { Header } from '@/components/layout/header'
import { getStaffList } from './actions'
import { Users, Mail, Phone, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default async function StaffDirectoryPage() {
  const staffArray = await getStaffList()

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="Staff Directory" />
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full max-w-[1200px]">
          
          <div className="mb-8">
            <h2 className="text-[22px] font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-3">
              <Users className="text-[#3b82f6]" size={24} strokeWidth={2.5} />
              Organization Staff Directory
            </h2>
            <p className="text-[14px] font-medium text-[#64748b]">Complete list of active sales staff, contact details, and assigned portfolios.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staffArray.map(staff => (
              <div key={staff.id} className="bg-white border border-[#e5e7eb] rounded-[24px] p-6 shadow-sm hover:shadow-md hover:border-[#3b82f6]/30 transition-all group flex flex-col">
                <div className="flex items-start gap-4 mb-6">
                   <div className="w-14 h-14 rounded-full bg-[#eff6ff] text-[#3b82f6] font-black text-[22px] flex items-center justify-center shrink-0">
                     {staff.name.charAt(0).toUpperCase()}
                   </div>
                   <div>
                     <h3 className="text-[18px] font-bold text-[#0f172a] leading-tight mb-1 group-hover:text-[#3b82f6] transition-colors">{staff.name}</h3>
                     <span className={`inline-block px-2 py-0.5 rounded-[6px] text-[10px] font-black uppercase tracking-widest border border-current ${
                       staff.role === 'agent' ? 'bg-[#eff6ff] text-[#3b82f6]' : 'bg-[#ecfdf5] text-[#10b981]'
                     }`}>
                       {staff.role}
                     </span>
                   </div>
                </div>

                <div className="flex flex-col gap-3 mb-6 flex-1">
                  <div className="flex items-center gap-3 text-[13px] font-medium text-[#64748b]">
                    <Mail size={16} className="text-[#94a3b8]" /> {staff.email}
                  </div>
                  <div className="flex items-center gap-3 text-[13px] font-medium text-[#64748b]">
                    <Phone size={16} className="text-[#94a3b8]" /> {staff.phone}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-[#f8fafc] rounded-[16px] border border-[#e2e8f0]">
                  <div>
                    <div className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider mb-1">Customers</div>
                    <div className="text-[18px] font-black text-[#0f172a]">{staff.assignedCustomers}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider mb-1">Total Sales</div>
                    <div className="text-[18px] font-black text-[#10b981]">${Number(staff.totalSales).toFixed(2)}</div>
                  </div>
                </div>

                <Link href={`/dashboard/accountant/staff-reports/${staff.id}`} className="w-full flex items-center justify-center gap-2 h-11 bg-white border border-[#e2e8f0] hover:bg-[#eff6ff] hover:text-[#3b82f6] hover:border-[#3b82f6]/30 rounded-[12px] text-[13px] font-bold text-[#64748b] transition-colors mt-auto">
                  View Performance <ChevronRight size={16} />
                </Link>
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  )
}
