import { Header } from '@/components/layout/header'
import { getDailySummary } from './actions'
import { DailySubmissionForm } from '@/components/staff/daily-submission-form'
import { ShoppingBag, Banknote, ArrowLeft, ArrowRight, Package, TrendingUp, HandCoins, CheckCircle2, ShieldAlert, Clock } from 'lucide-react'
import Link from 'next/link'
import { getStaffDashboardData } from '../actions'

export default async function DailyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date } = await searchParams
  const summary = await getDailySummary(date)
  const dashboardData = await getStaffDashboardData()
  
  const remainingTanks = dashboardData.metrics.remainingTanks

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="Daily Accountability" />
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full max-w-[1200px] mx-auto">
          
          <div className="mb-8 flex justify-between items-start">
            <div>
              <Link href="/dashboard/staff" className="flex items-center gap-2 text-[#64748b] hover:text-[#3b82f6] font-bold text-[12px] mb-3 transition-colors uppercase tracking-widest group">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Operational Dashboard
              </Link>
              <h2 className="text-[32px] font-black text-[#0f172a] mb-1 tracking-tight uppercase leading-none">End-of-Day Performance</h2>
              <p className="text-[15px] font-medium text-[#64748b]">Summary for {new Date(summary.date).toLocaleDateString()}.</p>
            </div>
            {summary.submissionStatus && (
              <div className="flex flex-col items-end">
                 <span className="text-[11px] font-black text-[#94a3b8] uppercase tracking-widest leading-none mb-2">Accountant Review</span>
                 <div className={`px-4 py-2 rounded-[12px] border-2 flex items-center gap-2 ${
                   summary.submissionStatus === 'verified' ? 'bg-[#ecfdf5] border-[#10b981]/20 text-[#10b981]' :
                   summary.submissionStatus === 'disputed' ? 'bg-red-50 border-red-200 text-red-600' :
                   'bg-[#f8fafc] border-[#e2e8f0] text-[#64748b]'
                 }`}>
                   {summary.submissionStatus === 'verified' ? <CheckCircle2 size={18} strokeWidth={2.5}/> :
                    summary.submissionStatus === 'disputed' ? <ShieldAlert size={18} strokeWidth={2.5}/> :
                    <Clock size={18} strokeWidth={2.5}/>}
                   <span className="text-[13px] font-black uppercase tracking-widest">{summary.submissionStatus}</span>
                 </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-6 mb-10">
            <div className="col-span-1 lg:col-span-1 bg-white p-5 rounded-[24px] border border-[#e5e7eb] shadow-sm flex flex-col items-center justify-center gap-2 text-center">
              <div className="w-10 h-10 rounded-full bg-[#eff6ff] flex items-center justify-center text-[#3b82f6]">
                <ShoppingBag size={20} strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest block mb-0.5">Tanks Sold</span>
                <span className="text-[20px] font-black text-[#0f172a] leading-none">{summary.tanksSold}</span>
              </div>
            </div>

            <div className="col-span-1 lg:col-span-1 bg-white p-5 rounded-[24px] border border-[#e5e7eb] shadow-sm flex flex-col items-center justify-center gap-2 text-center">
              <div className="w-10 h-10 rounded-full bg-[#ecfdf5] flex items-center justify-center text-[#10b981]">
                <TrendingUp size={20} strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest block mb-0.5">Cash Sales</span>
                <span className="text-[20px] font-black text-[#10b981] leading-none">${summary.cashSalesTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="col-span-1 lg:col-span-1 bg-white p-5 rounded-[24px] border border-[#e5e7eb] shadow-sm flex flex-col items-center justify-center gap-2 text-center">
              <div className="w-10 h-10 rounded-full bg-[#f0fdf4] flex items-center justify-center text-[#22c55e]">
                <HandCoins size={20} strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest block mb-0.5">Debt Payments</span>
                <span className="text-[20px] font-black text-[#22c55e] leading-none">${summary.debtPayments.toFixed(2)}</span>
              </div>
            </div>

            <div className="col-span-1 lg:col-span-1 bg-white p-5 rounded-[24px] border border-[#e5e7eb] shadow-sm flex flex-col items-center justify-center gap-2 text-center">
              <div className="w-10 h-10 rounded-full bg-[#fff7ed] flex items-center justify-center text-[#f59e0b]">
                <HandCoins size={20} strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest block mb-0.5">Credit Sold</span>
                <span className="text-[20px] font-black text-[#f59e0b] leading-none">${summary.creditSalesTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="col-span-1 lg:col-span-1 bg-white p-5 rounded-[24px] border border-[#e5e7eb] shadow-sm flex flex-col items-center justify-center gap-2 text-center">
              <div className="w-10 h-10 rounded-full bg-[#fef2f2] flex items-center justify-center text-[#ef4444]">
                <TrendingUp size={20} strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest block mb-0.5">Total Debt</span>
                <span className="text-[20px] font-black text-[#ef4444] leading-none">${summary.outstandingDebt.toFixed(2)}</span>
              </div>
            </div>

            <div className="col-span-1 lg:col-span-1 bg-white p-5 rounded-[24px] border border-[#e5e7eb] shadow-sm flex flex-col items-center justify-center gap-2 text-center">
              <div className="w-10 h-10 rounded-full bg-[#f8fafc] flex items-center justify-center text-[#64748b]">
                <Package size={20} strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest block mb-0.5">Remaining Stock</span>
                <span className="text-[20px] font-black text-[#0f172a] leading-none">{remainingTanks}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2">
                <DailySubmissionForm 
                  moneyCollected={summary.totalMoneyCollected}
                  date={summary.date}
                  tanksSold={summary.tanksSold}
                />
             </div>

             <div className="flex flex-col gap-6">
                <div className="bg-[#1e293b] p-8 rounded-[24px] text-white shadow-lg">
                   <div className="w-12 h-12 rounded-[14px] bg-white/10 flex items-center justify-center text-white mb-6">
                      <Banknote size={24} strokeWidth={2.5} />
                   </div>
                   <h3 className="text-[20px] font-black mb-2 uppercase tracking-tight">Financial Total</h3>
                   <p className="text-white/60 text-[13px] font-bold uppercase tracking-wider mb-8">Aggregate Money Collected</p>
                   
                   <div className="flex items-baseline gap-2">
                      <span className="text-[48px] font-black leading-none">${summary.totalMoneyCollected.toFixed(2)}</span>
                      <span className="text-[14px] font-black text-white/40 uppercase tracking-widest">USD</span>
                   </div>
                </div>

                <div className="bg-white p-8 rounded-[24px] border border-[#e5e7eb] shadow-sm">
                   <h4 className="text-[13px] font-black text-[#0f172a] uppercase tracking-widest mb-4">Submission Status</h4>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between text-[14px]">
                         <span className="font-bold text-[#64748b]">Tanks Distributed</span>
                         <span className="font-black text-[#0f172a]">{summary.tanksSold} Units</span>
                      </div>
                      <div className="flex items-center justify-between text-[14px]">
                         <span className="font-bold text-[#64748b]">Tanks Received</span>
                         <span className="font-black text-[#0f172a]">{summary.tanksReceived} Units</span>
                      </div>
                      <div className="pt-4 border-t border-[#f1f5f9] flex items-center justify-between">
                         <span className="text-[12px] font-black text-[#0f172a] uppercase tracking-widest">Inventory Balance</span>
                         <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${remainingTanks < 10 ? 'bg-red-50 text-red-600' : 'bg-[#ecfdf5] text-[#10b981]'}`}>
                            {remainingTanks < 10 ? 'Critical' : 'Stable'}
                         </span>
                      </div>
                   </div>
                </div>

                <Link href="/dashboard/staff/history/submissions" className="bg-[#f8fafc] border border-[#e2e8f0] p-6 rounded-[20px] flex items-center justify-between group hover:border-[#3b82f6] transition-all">
                   <div className="flex flex-col">
                      <span className="text-[14px] font-black text-[#0f172a] uppercase tracking-tight">Audit History</span>
                      <span className="text-[12px] font-bold text-[#64748b]">Review past submissions</span>
                   </div>
                   <ArrowRight size={18} className="text-[#94a3b8] group-hover:text-[#3b82f6] group-hover:translate-x-1 transition-all" />
                </Link>
             </div>
          </div>

        </div>
      </main>
    </div>
  )
}
