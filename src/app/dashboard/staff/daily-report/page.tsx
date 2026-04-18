import { Header } from '@/components/layout/header'
import { getDailySummary } from './actions'
import { EndOfDayReport } from '@/components/staff/end-of-day-report'
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

          <div className="max-w-[600px] mx-auto">
             <EndOfDayReport 
                report={{
                  tanksSold: summary.tanksSold,
                  moneySubmitted: summary.totalMoneyCollected,
                  moneyCollected: summary.totalMoneyCollected,
                  cashSales: summary.cashSalesTotal,
                  debtPayments: summary.debtPayments,
                  creditSold: summary.creditSalesTotal,
                  outstandingDebt: summary.outstandingDebt,
                  freeTanksSold: dashboardData.metrics.freeTanksToday || 0,
                  status: summary.submissionStatus === 'verified' ? 'VERIFIED' : (summary.submissionStatus === 'submitted' || summary.submissionStatus === 'disputed' ? 'SUBMITTED' : 'PENDING'),
                  date: summary.date
                }}
             />
          </div>

        </div>
      </main>
    </div>
  )
}
