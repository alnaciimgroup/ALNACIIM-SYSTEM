import { Header } from '@/components/layout/header'
import { getReportsSummary, getDetailedReport, getFilterMetadata } from './actions'
import { FileText, Download, TrendingUp, Calendar, ChevronRight, PieChart, Users, Banknote, Search, ArrowRight, Truck, Tag, ClipboardList, Wallet, AlertCircle, ShoppingCart, Clock, Gift } from 'lucide-react'
import Link from 'next/link'

export default async function ReportsPage({
  searchParams
}: {
  searchParams: Promise<{ 
    startDate?: string; 
    endDate?: string; 
    staffId?: string; 
    customerId?: string;
    itemId?: string;
    type?: string;
    saleType?: string;
    status?: string;
  }>
}) {
  const params = await searchParams
  const meta = await getFilterMetadata()
  const summary = await getReportsSummary(params)
  const reportData = params.type ? await getDetailedReport(params.type, params) : []
  
  const reportCategories = [
    {
      id: 'sales',
      title: 'Sales & Revenue Report',
      description: 'Detailed breakdown of cash and credit sales, grouped by staff or customer.',
      icon: TrendingUp,
      color: 'text-[#3b82f6]',
      bg: 'bg-[#eff6ff]',
      border: 'border-[#3b82f6]/20'
    },
    {
      id: 'distribution',
      title: 'Inventory & Distribution',
      description: 'Track tank movements from agents to staff, including inventory balances.',
      icon: PieChart,
      color: 'text-[#10b981]',
      bg: 'bg-[#ecfdf5]',
      border: 'border-[#10b981]/20'
    },
    {
      id: 'debt',
      title: 'Customer Debt Summary',
      description: 'Outstanding credit balances and payment history across all customers.',
      icon: Users,
      color: 'text-[#f59e0b]',
      bg: 'bg-[#fff7ed]',
      border: 'border-[#f59e0b]/20'
    },
    {
      id: 'submissions',
      title: 'Daily Submissions Audit',
      description: 'Reconciliation reports showing and verifying daily staff cash deposits.',
      icon: Banknote,
      color: 'text-[#ef4444]',
      bg: 'bg-[#fef2f2]',
      border: 'border-[#ef4444]/20'
    },
    {
      id: 'payments',
      title: 'Payment History',
      description: 'Audit log of all cash collected for credit sales across the system.',
      icon: ShoppingCart,
      color: 'text-[#06b6d4]',
      bg: 'bg-[#ecfeff]',
      border: 'border-[#06b6d4]/20'
    },
    {
      id: 'performance',
      title: 'Staff Performance',
      description: 'Efficiency metrics: sales volume vs collections for all field staff.',
      icon: Clock,
      color: 'text-[#6366f1]',
      bg: 'bg-[#eef2ff]',
      border: 'border-[#6366f1]/20'
    }
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="System Reports" />
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full max-w-[1200px]">
          
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-[22px] font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-3">
                <FileText className="text-[#3b82f6]" size={24} strokeWidth={2.5} />
                Analytics & Reporting Engine
              </h2>
              <p className="text-[14px] font-medium text-[#64748b]">Generate, filter, and export system-wide operational and financial reports.</p>
            </div>
          </div>

          <form className="bg-white border border-[#e5e7eb] rounded-[24px] shadow-sm p-8 mb-8">
            <h3 className="text-[16px] font-bold text-[#0f172a] tracking-tight mb-6 flex items-center gap-2">
               <Search size={18} className="text-[#3b82f6]" /> Global Report Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-[#64748b] uppercase tracking-widest leading-none">Start Date</label>
                <input 
                  type="date" 
                  name="startDate"
                  defaultValue={params.startDate || ''}
                  className="w-full h-11 px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[14px] text-[13px] font-bold text-[#0f172a] focus:outline-none focus:border-[#3b82f6] shadow-sm appearance-none" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-[#64748b] uppercase tracking-widest leading-none">End Date</label>
                <input 
                  type="date" 
                  name="endDate"
                  defaultValue={params.endDate || ''}
                  className="w-full h-11 px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[14px] text-[13px] font-bold text-[#0f172a] focus:outline-none focus:border-[#3b82f6] shadow-sm appearance-none" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-[#64748b] uppercase tracking-widest leading-none">Staff Member</label>
                <select 
                  name="staffId"
                  defaultValue={params.staffId || ''}
                  className="w-full h-11 px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[14px] text-[13px] font-bold text-[#0f172a] focus:outline-none focus:border-[#3b82f6] shadow-sm appearance-none"
                >
                  <option value="">All Personnel</option>
                  {meta.staff.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-[#64748b] uppercase tracking-widest leading-none">Customer</label>
                <select 
                  name="customerId"
                  defaultValue={params.customerId || ''}
                  className="w-full h-11 px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[14px] text-[13px] font-bold text-[#0f172a] focus:outline-none focus:border-[#3b82f6] shadow-sm appearance-none"
                >
                  <option value="">All Customers</option>
                  {meta.customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-[#64748b] uppercase tracking-widest leading-none">Item / Product</label>
                <select 
                  name="itemId"
                  defaultValue={params.itemId || ''}
                  className="w-full h-11 px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[14px] text-[13px] font-bold text-[#0f172a] focus:outline-none focus:border-[#3b82f6] shadow-sm appearance-none"
                >
                  <option value="">All Items</option>
                  {meta.items.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-[#64748b] uppercase tracking-widest leading-none">Sale Type</label>
                <select 
                  name="saleType"
                  defaultValue={params.saleType || ''}
                  className="w-full h-11 px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[14px] text-[13px] font-bold text-[#0f172a] focus:outline-none focus:border-[#3b82f6] shadow-sm appearance-none"
                >
                  <option value="">All Types</option>
                  <option value="cash">Cash Only</option>
                  <option value="credit">Credit Only</option>
                  <option value="free">Free Items Only</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-[#64748b] uppercase tracking-widest leading-none">Status</label>
                <select 
                  name="status"
                  defaultValue={params.status || ''}
                  className="w-full h-11 px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[14px] text-[13px] font-bold text-[#0f172a] focus:outline-none focus:border-[#3b82f6] shadow-sm appearance-none"
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <button type="submit" className="h-11 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-black text-[13px] uppercase tracking-widest rounded-[14px] transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                  Update All Data
                </button>
              </div>
            </div>
            <input type="hidden" name="type" value={params.type || ''} />
          </form>

          {/* 7-Metric Header Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
             {/* 1. Distributed */}
             <div className="bg-white p-6 rounded-[24px] border border-[#e2e8f0] shadow-sm flex flex-col hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-[12px] bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center mb-4">
                   <Truck size={20} />
                </div>
                <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-1.5 block">Total Distributed</span>
                <div className="text-[24px] font-black text-[#0f172a] tracking-tight">{summary?.totalDistributed?.toLocaleString() ?? 0}</div>
             </div>

             {/* 2. Sold */}
             <div className="bg-white p-6 rounded-[24px] border border-[#e2e8f0] shadow-sm flex flex-col hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-[12px] bg-[#ecfdf5] text-[#10b981] flex items-center justify-center mb-4">
                   <Tag size={20} />
                </div>
                <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-1.5 block">Total Tanks Sold</span>
                <div className="text-[24px] font-black text-[#0f172a] tracking-tight">{summary?.totalSold?.toLocaleString() ?? 0}</div>
             </div>

             {/* 3. Remaining */}
             <div className="bg-white p-6 rounded-[24px] border border-[#e2e8f0] shadow-sm flex flex-col hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-[12px] bg-[#fff7ed] text-[#f59e0b] flex items-center justify-center mb-4">
                   <ClipboardList size={20} />
                </div>
                <span className="text-[10px] font-black text-[#64748b] uppercase tracking_widest mb-1.5 block">Remaining Stock</span>
                <div className="text-[24px] font-black text-[#0f172a] tracking-tight">{summary?.remainingTanks?.toLocaleString() ?? 0}</div>
             </div>

             {/* 4. Collected */}
             <div className="bg-white p-6 rounded-[24px] border border-[#e2e8f0] shadow-sm flex flex-col hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-[12px] bg-[#ecfeff] text-[#0ea5e9] flex items-center justify-center mb-4">
                   <ShoppingCart size={20} />
                </div>
                <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-1.5 block">Money Collected</span>
                <div className="text-[24px] font-black text-[#0f172a] tracking-tight">${summary?.totalCollected?.toLocaleString() ?? 0}</div>
             </div>

             {/* 5. Submitted */}
             <div className="bg-white p-6 rounded-[24px] border border-[#e2e8f0] shadow-sm flex flex-col hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-[12px] bg-[#f0fdf4] text-[#16a34a] flex items-center justify-center mb-4">
                   <Banknote size={20} />
                </div>
                <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-1.5 block">Money Submitted</span>
                <div className="text-[24px] font-black text-[#0f172a] tracking-tight">${summary?.totalSubmitted?.toLocaleString() ?? 0}</div>
             </div>

             {/* 6. Difference */}
             <div className={`p-6 rounded-[24px] border shadow-sm flex flex-col hover:shadow-md transition-all ${summary.totalDifference !== 0 ? 'bg-[#fef2f2] border-red-200' : 'bg-white border-[#e2e8f0]'}`}>
                <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center mb-4 ${summary.totalDifference !== 0 ? 'bg-[#ef4444] text-white' : 'bg-[#f8fafc] text-[#64748b]'}`}>
                   <AlertCircle size={20} />
                </div>
                <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-1.5 block">Total Difference</span>
                <div className={`text-[24px] font-black tracking-tight ${summary.totalDifference !== 0 ? 'text-[#ef4444]' : 'text-[#0f172a]'}`}>
                  ${summary?.totalDifference?.toLocaleString() ?? 0}
                </div>
             </div>

             {/* 7. Outstanding */}
             <div className="bg-white p-6 rounded-[24px] border border-[#e2e8f0] shadow-sm flex flex-col hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-[12px] bg-[#fffbeb] text-[#d97706] flex items-center justify-center mb-4">
                   <Wallet size={20} />
                </div>
                <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-1.5 block">Total Debt Balance</span>
                <div className="text-[24px] font-black text-[#d97706] tracking-tight">${summary?.outstandingBalance?.toLocaleString() ?? 0}</div>
             </div>

             {/* 8. Free Distribution */}
             <div className="bg-[#f0f9ff] p-6 rounded-[24px] border border-blue-100 shadow-sm flex flex-col hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-[12px] bg-blue-500 text-white flex items-center justify-center mb-4">
                   <Gift size={20} />
                </div>
                <span className="text-[10px] font-black text-[#0369a1] uppercase tracking-widest mb-1.5 block">Free Tanks Given</span>
                <div className="text-[24px] font-black text-[#0369a1] tracking-tight">{summary?.totalFreeTanks?.toLocaleString() ?? 0}</div>
             </div>
          </div>

          {/* Reports Results Section */}
          <div className="space-y-8">
            <h3 className="text-[18px] font-extrabold text-[#0f172a] tracking-tight uppercase border-b-2 border-black/5 pb-4 mb-8">Selected Report: {params.type ? reportCategories.find(c => c.id === params.type)?.title : 'Select a category below'}</h3>
            
            {params.type && (
               <div className="bg-white border border-[#e5e7eb] rounded-[24px] shadow-sm overflow-hidden mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[#f8fafc]">
                          {params.type === 'sales' && (
                            <>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b">Date</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b">Customer</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b">Staff</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b">Items</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b text-right">Total</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b text-center">Type</th>
                            </>
                          )}
                          {params.type === 'distribution' && (
                            <>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b">Date</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b">Agent</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b">Staff</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b">Item</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b text-right">Qty</th>
                            </>
                          )}
                          {params.type === 'debt' && (
                            <>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b">Customer</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b">Staff</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b text-right">Total Credit</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b text-right">Total Paid</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b text-right text-red-600">Balance</th>
                            </>
                          )}
                          {params.type === 'submissions' && (
                            <>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b">Date</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b">Staff</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b text-right">Amount</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b text-center">Status</th>
                            </>
                          )}
                          {params.type === 'payments' && (
                            <>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b">Date</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b">Customer</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b">Staff</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b text-right">Amount</th>
                            </>
                          )}
                          {params.type === 'performance' && (
                            <>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b">Staff</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b text-right">Dist</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b text-right">Sold</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b text-right text-blue-600">Free</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b text-right">Stock</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b text-right">Coll</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b text-right text-emerald-600">Subm</th>
                              <th className="px-6 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest border-b text-right text-red-600">Diff</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f1f5f9]">
                        {reportData.length === 0 ? (
                           <tr><td colSpan={10} className="px-6 py-12 text-center text-[#94a3b8] font-bold">No data found matching current filters.</td></tr>
                        ) : reportData.map((row: any) => (
                           <tr key={row.id} className="hover:bg-[#f8fafc] transition-colors">
                             {params.type === 'sales' && (
                               <>
                                 <td className="px-6 py-4 text-[13px] font-bold text-[#475569]">{new Date(row.created_at).toLocaleDateString()}</td>
                                 <td className="px-6 py-4 text-[13px] font-black text-[#0f172a]">{row.customer?.name}</td>
                                 <td className="px-6 py-4 text-[13px] font-bold text-[#64748b]">{row.staff?.full_name}</td>
                                 <td className="px-6 py-4 text-[12px] font-medium text-[#475569]">
                                   {row.items?.map((i: any) => `${i.quantity}x ${i.items?.name}`).join(', ')}
                                 </td>
                                 <td className="px-6 py-4 text-[14px] font-black text-[#10b981] text-right">${Number(row.total_amount).toLocaleString()}</td>
                                 <td className="px-6 py-4 text-center">
                                   <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-black uppercase tracking-widest border ${
                                     row.sale_type === 'cash' ? 'bg-[#ecfdf5] text-[#10b981] border-emerald-200' : 
                                     row.sale_type === 'free' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                     'bg-[#fff7ed] text-[#ea580c] border-amber-200'
                                   }`}>{row.sale_type === 'free' ? '🎁 FREE' : row.sale_type}</span>
                                 </td>
                               </>
                             )}
                             {params.type === 'distribution' && (
                               <>
                                 <td className="px-6 py-4 text-[13px] font-bold text-[#475569]">{new Date(row.created_at).toLocaleDateString()}</td>
                                 <td className="px-6 py-4 text-[13px] font-black text-[#0f172a]">{row.agent?.full_name}</td>
                                 <td className="px-6 py-4 text-[13px] font-bold text-[#64748b]">{row.staff?.full_name}</td>
                                 <td className="px-6 py-4 text-[13px] font-black text-[#0ea5e9]">{row.item?.name}</td>
                                 <td className="px-6 py-4 text-[15px] font-black text-[#0f172a] text-right">{row.quantity}</td>
                               </>
                             )}
                             {params.type === 'debt' && (
                               <>
                                 <td className="px-6 py-4 text-[13px] font-black text-[#0f172a]">{row.customerName}</td>
                                 <td className="px-6 py-4 text-[13px] font-bold text-[#64748b]">{row.staffName}</td>
                                 <td className="px-6 py-4 text-[13px] font-bold text-[#475569] text-right">${row.totalCredit.toLocaleString()}</td>
                                 <td className="px-6 py-4 text-[13px] font-bold text-[#10b981] text-right">${row.totalPaid.toLocaleString()}</td>
                                 <td className="px-6 py-4 text-[14px] font-black text-[#ef4444] text-right font-mono">${row.balance.toLocaleString()}</td>
                               </>
                             )}
                             {params.type === 'submissions' && (
                               <>
                                 <td className="px-6 py-4 text-[13px] font-bold text-[#475569]">{new Date(row.created_at).toLocaleDateString()}</td>
                                 <td className="px-6 py-4 text-[13px] font-black text-[#0f172a]">{row.staff?.full_name}</td>
                                 <td className="px-6 py-4 text-[14px] font-black text-[#10b981] text-right">${row.amount.toLocaleString()}</td>
                                 <td className="px-6 py-4 text-center">
                                   <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-black uppercase tracking-widest border ${row.status === 'verified' ? 'bg-[#ecfdf5] text-[#10b981] border-emerald-200' : 'bg-[#fff7ed] text-[#ea580c] border-amber-200'}`}>{row.status}</span>
                                 </td>
                               </>
                             )}
                             {params.type === 'payments' && (
                               <>
                                 <td className="px-6 py-4 text-[13px] font-bold text-[#475569]">{new Date(row.created_at).toLocaleDateString()}</td>
                                 <td className="px-6 py-4 text-[13px] font-black text-[#0f172a]">{row.sale?.customers?.name}</td>
                                 <td className="px-6 py-4 text-[13px] font-bold text-[#64748b]">{row.sale?.users?.full_name}</td>
                                 <td className="px-6 py-4 text-[14px] font-black text-[#10b981] text-right">${Number(row.amount).toLocaleString()}</td>
                               </>
                             )}
                             {params.type === 'performance' && (
                               <>
                                 <td className="px-6 py-4 text-[13px] font-black text-[#0f172a]">{row.staffName}</td>
                                 <td className="px-6 py-4 text-[14px] font-bold text-right text-[#475569]">{row.totalDistributed}</td>
                                 <td className="px-6 py-4 text-[14px] font-bold text-right text-[#475569]">{row.totalSold}</td>
                                 <td className="px-6 py-4 text-[14px] font-black text-right text-blue-600">{row.totalFreeTanks}</td>
                                 <td className="px-6 py-4 text-[14px] font-bold text-right text-[#475569]">{row.remainingTanks}</td>
                                 <td className="px-6 py-4 text-[14px] font-black text-right text-[#0f172a]">${row.totalCollected.toLocaleString()}</td>
                                 <td className="px-6 py-4 text-[14px] font-black text-right text-[#16a34a]">${row.totalSubmitted.toLocaleString()}</td>
                                 <td className="px-6 py-4 text-[14px] font-black text-right text-[#ef4444]">${row.totalDifference.toLocaleString()}</td>
                               </>
                             )}
                           </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reportCategories.map(cat => (
                <div key={cat.id} className={`bg-white border rounded-[24px] p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group ${params.type === cat.id ? 'ring-2 ring-[#3b82f6] border-[#3b82f6]/30' : 'border-[#e5e7eb]'}`}>
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center ${cat.bg} ${cat.color} ${cat.border} border-2`}>
                      <cat.icon size={26} strokeWidth={2.5} />
                    </div>
                    <button className="h-9 px-4 rounded-[12px] bg-white border border-[#e2e8f0] text-[#64748b] text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#f8fafc] hover:text-[#0f172a] transition-all">
                      <Download size={14} /> CSV
                    </button>
                  </div>
                  
                  <h3 className="text-[18px] font-black text-[#0f172a] mb-2 uppercase tracking-tight">{cat.title}</h3>
                  <p className="text-[13px] font-medium text-[#64748b] mb-8 leading-relaxed">
                    {cat.description}
                  </p>
  
                  <Link 
                    href={`/dashboard/accountant/reports?${new URLSearchParams({ ...params, type: cat.id }).toString()}`}
                    className={`flex items-center gap-2 text-[13px] font-black uppercase tracking-widest transition-colors ${params.type === cat.id ? 'text-[#3b82f6]' : 'text-[#94a3b8] group-hover:text-[#3b82f6]'}`}
                  >
                    {params.type === cat.id ? 'Active View' : 'Generate Full Report'} <ChevronRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
