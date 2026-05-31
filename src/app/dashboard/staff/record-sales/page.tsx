import { Header } from '@/components/layout/header'
import { RecordSaleForm } from '@/components/staff/record-sale-form-v2'
import { getCustomers } from '../customers/actions'
import { getStaffDashboardData, getMissingReportDate } from '../actions'
import { Tag, Info, ArrowLeft, ShoppingBag, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verifySession } from '@/utils/auth'
import { getCurrentWorkDate } from '@/utils/date-utils'

export default async function RecordSalesPage() {
  const { user } = await verifySession(['staff'])
  const currentWorkDate = getCurrentWorkDate()

  const customers = await getCustomers()
  const { metrics } = await getStaffDashboardData()

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="Sales Operations" />
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full max-w-[1200px] mx-auto">
          
          <div className="mb-8 flex justify-between items-end">
            <div>
              <Link href="/dashboard/staff" className="flex items-center gap-2 text-[#64748b] hover:text-[#3b82f6] font-bold text-[13px] mb-2 transition-colors uppercase tracking-widest group">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
              </Link>
              <h2 className="text-[28px] font-black text-[#0f172a] mb-1 tracking-tight uppercase">Record New Sale</h2>
              <p className="text-[15px] font-medium text-[#64748b]">Select a verified customer to initialize a sales transaction.</p>
            </div>
            
            <div className="hidden lg:flex flex-col items-end gap-1 px-5 py-3 bg-white border border-[#e2e8f0] rounded-[16px] shadow-sm">
                <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest leading-none">Global Unit Price</span>
                <span className="text-[18px] font-black text-[#0f172a] leading-none">$0.0233 <span className="text-[12px] text-[#64748b]">/ Liter</span></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-10">
             <div className="bg-white p-6 rounded-[24px] border border-[#e5e7eb] shadow-sm">
                <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-1 leading-none">Items Received</p>
                <div className="flex items-center justify-between">
                   <span className="text-[24px] font-black text-[#0f172a] leading-none">{metrics.tanksReceived}</span>
                   <div className="w-9 h-9 rounded-lg bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center">
                      <ShoppingBag size={18} />
                   </div>
                </div>
             </div>
             <div className="bg-white p-6 rounded-[24px] border border-[#e5e7eb] shadow-sm">
                <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-1 leading-none">Items Sold</p>
                <div className="flex items-center justify-between">
                   <span className="text-[24px] font-black text-[#0f172a] leading-none">{metrics.tanksSold}</span>
                   <div className="w-9 h-9 rounded-lg bg-[#ecfdf5] text-[#10b981] flex items-center justify-center">
                      <Tag size={18} />
                   </div>
                </div>
             </div>
             <div className="bg-white p-6 rounded-[24px] border border-[#e5e7eb] shadow-sm border-b-4 border-b-[#3b82f6]/20 transition-all hover:scale-[1.02]">
                <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-1 leading-none text-[#3b82f6]">Remaining Stock</p>
                <div className="flex items-center justify-between">
                   <span className="text-[24px] font-black text-[#3b82f6] leading-none">{metrics.remainingTanks}</span>
                   <div className="w-9 h-9 rounded-lg bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center">
                      <Info size={18} />
                   </div>
                </div>
             </div>
             <div className="bg-white p-6 rounded-[24px] border border-[#e5e7eb] shadow-sm transition-all hover:bg-[#ecfdf5]/30">
                <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-1 leading-none text-[#10b981]">Cash Collected</p>
                <div className="flex items-center justify-between">
                   <span className="text-[24px] font-black text-[#10b981] leading-none">${metrics.cashSalesToday.toFixed(2)}</span>
                   <div className="w-9 h-9 rounded-lg bg-[#ecfdf5] text-[#10b981] flex items-center justify-center">
                      <DollarSign size={18} />
                   </div>
                </div>
             </div>
             <div className="bg-white p-6 rounded-[24px] border border-[#e5e7eb] shadow-sm transition-all hover:bg-[#fef2f2]/30">
                <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-1 leading-none text-[#ef4444]">Discounts Given</p>
                <div className="flex items-center justify-between">
                   <span className="text-[24px] font-black text-[#ef4444] leading-none">${(metrics.totalDiscountsToday || 0).toFixed(2)}</span>
                   <div className="w-9 h-9 rounded-lg bg-[#fef2f2] text-[#ef4444] flex items-center justify-center">
                      <Tag size={18} />
                   </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <RecordSaleForm customers={customers} remainingStock={metrics.remainingTanks} />
            </div>
            
            <div className="flex flex-col gap-6">
              <div className="bg-white border border-[#e5e7eb] rounded-[24px] p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#f1f5f9]">
                  <div className="w-10 h-10 rounded-[12px] bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center">
                    <ShoppingBag size={20} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-[15px] font-black uppercase tracking-widest text-[#0f172a]">Stock Alert</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-bold text-[#64748b] uppercase tracking-wider">Today's Dispatch</span>
                    <span className="text-[20px] font-black text-[#0f172a]">{metrics.tanksSold} Units</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-bold text-[#64748b] uppercase tracking-wider">Physical Balance</span>
                    <span className={`text-[22px] font-black ${metrics.remainingTanks > 5 ? 'text-[#3b82f6]' : 'text-orange-500'}`}>{metrics.remainingTanks} Units</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#eff6ff]/30 border border-[#3b82f6]/10 rounded-[24px] p-8">
                <div className="flex items-center gap-3 mb-5">
                   <div className="w-8 h-8 rounded-full bg-[#3b82f6] text-white flex items-center justify-center">
                      <Info size={16} strokeWidth={3} />
                   </div>
                   <h3 className="text-[14px] font-black uppercase tracking-widest text-[#3b82f6]">Staff Compliance</h3>
                </div>
                <p className="text-[13px] text-[#475569] font-medium leading-relaxed">
                   Sales are Restricted to <strong>Active Accounts</strong>. Any attempt to record debt for inactive customers will be blocked and flagged for regional audit.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
