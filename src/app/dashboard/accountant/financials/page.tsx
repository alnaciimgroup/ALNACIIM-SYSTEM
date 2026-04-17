import { Header } from '@/components/layout/header'
import { getFinancialOverview } from './actions'
import { Banknote, CreditCard, DollarSign, Activity, AlertTriangle, Scale, Target, Wallet } from 'lucide-react'

export default async function FinancialsPage() {
  const { totals, topDebtors } = await getFinancialOverview()

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="Financial Overview" />
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full max-w-[1200px]">
          
          <div className="mb-8">
            <h2 className="text-[22px] font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-3">
              <Scale className="text-[#3b82f6]" size={24} strokeWidth={2.5} />
              System Financial Overview
            </h2>
            <p className="text-[14px] font-medium text-[#64748b]">High-level reconciliation of all-time sales, collections, and outstanding debt.</p>
          </div>

          {/* Top Master Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-[20px] p-6 border border-[#e5e7eb] shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-[12px] bg-[#ecfdf5] text-[#10b981] flex items-center justify-center">
                  <Banknote size={20} className="w-5 h-5" />
                </div>
                <div className="text-[12px] font-extrabold text-[#64748b] uppercase tracking-wider">Total Cash Sales</div>
              </div>
              <div className="text-[32px] font-black text-[#0f172a] tracking-tighter leading-none">${totals.totalCashSales.toFixed(2)}</div>
            </div>

            <div className="bg-white rounded-[20px] p-6 border border-[#e5e7eb] shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-[12px] bg-[#fff7ed] text-[#f59e0b] flex items-center justify-center">
                  <CreditCard size={20} className="w-5 h-5" />
                </div>
                <div className="text-[12px] font-extrabold text-[#64748b] uppercase tracking-wider">Total Credit Sales</div>
              </div>
              <div className="text-[32px] font-black text-[#0f172a] tracking-tighter leading-none">${totals.totalCreditSales.toFixed(2)}</div>
            </div>

            <div className="bg-white rounded-[20px] p-6 border border-[#e5e7eb] shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-[12px] bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center">
                  <DollarSign size={20} className="w-5 h-5" />
                </div>
                <div className="text-[12px] font-extrabold text-[#64748b] uppercase tracking-wider">Total Collected</div>
              </div>
              <div className="text-[32px] font-black text-[#0f172a] tracking-tighter leading-none">${totals.totalMoneyCollected.toFixed(2)}</div>
            </div>

            <div className="bg-white rounded-[20px] p-6 border border-[#e5e7eb] shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-[#3b82f6] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-[12px] bg-[#f8fafc] text-[#3b82f6] flex items-center justify-center">
                  <Wallet size={20} className="w-5 h-5" />
                </div>
                <div className="text-[12px] font-extrabold text-[#64748b] uppercase tracking-wider">Total Global Debt</div>
              </div>
              <div className="text-[32px] font-black text-[#0f172a] tracking-tighter leading-none">${totals.totalOutstandingBalance.toFixed(2)}</div>
              <div className="text-[11px] font-bold text-[#64748b]/60 mt-1 uppercase tracking-wider">Outstanding Liability</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
            
            {/* Left Graph / Deep dive area */}
            <div className="bg-white border border-[#e5e7eb] rounded-[24px] shadow-sm p-8 flex flex-col justify-center items-center h-[400px] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#f8fafc] to-white z-0"></div>
              <div className="relative z-10 text-center flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-[#eff6ff] flex items-center justify-center mb-6 shadow-inner border border-[#3b82f6]/10">
                  <Activity size={32} className="text-[#3b82f6]" strokeWidth={2.5}/>
                </div>
                <h3 className="text-[24px] font-black text-[#0f172a] tracking-tight mb-2">Total System Turnover</h3>
                <div className="text-[54px] font-black text-[#3b82f6] tracking-tighter leading-none mb-4">
                  ${(totals.totalCashSales + totals.totalCreditSales).toFixed(2)}
                </div>
                <p className="text-[#64748b] font-medium max-w-[300px]">Combined value of all recorded transactions in the Alnaciim system.</p>
              </div>
            </div>

            {/* Right Risk Area: Top Debtors */}
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-[24px] shadow-xl p-8 flex flex-col h-[400px] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#ef4444]/10 rounded-full blur-3xl"></div>
               <h3 className="text-[16px] font-bold text-white tracking-tight flex items-center gap-2 mb-6 relative z-10">
                 <Target size={18} className="text-[#ef4444]" /> Highest Outstanding Debt
               </h3>
               
               <div className="flex-1 overflow-y-auto pr-2 relative z-10">
                 {topDebtors.length === 0 ? (
                   <p className="text-[#94a3b8] text-[13px]">No outstanding customer debts found.</p>
                 ) : (
                   <div className="flex flex-col gap-4">
                     {topDebtors.map((debtor, idx) => (
                       <div key={debtor.id} className="flex items-center justify-between p-4 rounded-[14px] bg-[#1e293b]/50 border border-[#334155] hover:bg-[#1e293b] transition-colors">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-[#334155] text-[#94a3b8] flex items-center justify-center text-[12px] font-bold">
                             {idx + 1}
                           </div>
                           <div>
                             <div className="text-[14px] font-bold text-white">{debtor.name}</div>
                             <div className="text-[12px] font-medium text-[#94a3b8] flex items-center gap-2">
                               {debtor.phone}
                               {debtor.staff && (
                                 <>
                                   <span className="w-1 h-1 rounded-full bg-[#334155]"></span>
                                   <span className="text-[#3b82f6]">Staff: {Array.isArray(debtor.staff) ? debtor.staff[0]?.full_name : (debtor.staff as any).full_name}</span>
                                 </>
                               )}
                             </div>
                           </div>
                         </div>
                         <div className="text-[16px] font-black text-[#ef4444]">${Number(debtor.debt).toFixed(2)}</div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>

               <div className="mt-6 pt-5 border-t border-[#334155] flex justify-between items-center relative z-10">
                 <span className="text-[12px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Total Market Debt</span>
                 <span className="text-[20px] font-black text-white">${totals.totalOutstandingBalance.toFixed(2)}</span>
               </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  )
}
