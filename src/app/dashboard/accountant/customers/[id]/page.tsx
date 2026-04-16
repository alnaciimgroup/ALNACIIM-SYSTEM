import { Header } from '@/components/layout/header'
import { getCustomerDetailedData } from '../actions'
import { 
  ShoppingCart, 
  Banknote, 
  User as UserIcon, 
  Phone, 
  MapPin, 
  ArrowLeft,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Hash,
  ChevronRight,
  Droplets,
  PackageCheck
} from 'lucide-react'
import Link from 'next/link'

export default async function CustomerDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getCustomerDetailedData(id)

  if (!data) {
    return (
      <div className="flex flex-col h-full w-full bg-[#f8fafc]">
        <Header title="Customer Record" />
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="bg-white border border-[#e5e7eb] rounded-[24px] p-12 shadow-sm max-w-[440px] w-full text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-6 border border-slate-100">
              <UserIcon size={32} strokeWidth={1.5} />
            </div>
            <h2 className="text-[20px] font-black text-[#0f172a] mb-2 tracking-tight">Record Not Found</h2>
            <p className="text-[14px] font-medium text-[#64748b] mb-8 leading-relaxed">
              We couldn't locate this customer profile. It may have been archived or moved.
            </p>
            <Link 
              href="/dashboard/accountant/customers"
              className="inline-flex h-10 px-6 bg-[#0f172a] hover:bg-black text-white font-bold text-[12px] rounded-[10px] items-center justify-center gap-2 transition-all active:scale-95"
            >
              <ArrowLeft size={14} /> Back to Directory
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const { profile, sales, payments, metrics } = data

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <TopBar title={`Record: ${profile.name}`} />
      
      <main className="flex-1 overflow-y-auto px-10 pt-8 pb-20">
        <div className="w-full max-w-[1300px] mx-auto">
          
          <div className="mb-6">
            <Link 
              href="/dashboard/accountant/customers"
              className="inline-flex items-center gap-2 text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.2em] hover:text-[#3b82f6] transition-colors"
            >
              <ArrowLeft size={14} strokeWidth={2.5} /> Directory
            </Link>
          </div>

          {/* Compact Profile Header */}
          <div className="bg-white border border-[#e5e7eb] rounded-[24px] p-8 mt-2 mb-10 shadow-sm relative">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 rounded-[18px] bg-[#3b82f6] text-white flex items-center justify-center text-[28px] font-black shrink-0 shadow-lg shadow-[#3b82f6]/10">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-[26px] font-black text-[#0f172a] tracking-tight leading-none mb-3 uppercase">{profile.name}</h2>
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-[13px] font-bold text-[#64748b]">
                    <span className="flex items-center gap-2 text-[#3b82f6] bg-[#eff6ff] px-3 py-1 rounded-[8px] border border-[#dbeafe] font-black tracking-wide">
                      <Phone size={13} strokeWidth={2.5} /> {profile.phone}
                    </span>
                    <span className="flex items-center gap-2 text-[#3b82f6] bg-[#eff6ff] px-3 py-1 rounded-[8px] border border-[#dbeafe] font-black tracking-wide uppercase">
                      <PackageCheck size={13} strokeWidth={2.5} /> Tank ID: {profile.tank_number || 'N/A'}
                    </span>
                    <span className="flex items-center gap-2 opacity-70"><MapPin size={13} strokeWidth={2.5} /> {profile.address || 'Location Unknown'}</span>
                    <span className={`px-3 py-1 rounded-[6px] text-[10px] font-black uppercase tracking-wider border ${
                      profile.status === 'active' ? 'bg-[#ecfdf5] text-[#10b981] border-[#d1fae5]' : 'bg-[#fef2f2] text-[#ef4444] border-[#fee2e2]'
                    }`}>{profile.status}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#f8fafc] border border-[#f1f5f9] rounded-[18px] px-6 py-3 flex items-center gap-4 min-w-[220px]">
                <div className="w-9 h-9 rounded-xl bg-white border border-[#e2e8f0] flex items-center justify-center text-[#3b82f6] shadow-sm">
                  <UserIcon size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <span className="text-[9px] font-black text-[#94a3b8] uppercase tracking-[0.15em] block mb-0.5">Assigned Staff</span>
                  <p className="text-[14px] font-black text-[#0f172a]">{(profile.staff as any)?.full_name || 'System Link'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Corrected 4-Metric Grid: Optimized for Safari & Compact Feel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Tanks Taken', value: metrics.totalTanksBought, sub: 'Total Volume', icon: Droplets, color: '#3b82f6' },
              { label: 'Free Assets', value: metrics.totalFreeTanks, sub: 'Unbilled', icon: PackageCheck, color: '#f59e0b' },
              { label: 'Total Paid', value: `$${metrics.totalPaid.toLocaleString()}`, sub: 'Settled', icon: Banknote, color: '#10b981' },
              { 
                label: 'Owed Debt', 
                value: `$${Math.max(0, metrics.currentDebt).toLocaleString()}`, 
                sub: metrics.currentDebt > 0 ? 'Pending' : 'Settled',
                icon: metrics.currentDebt > 0 ? AlertCircle : CheckCircle2, 
                color: metrics.currentDebt > 0 ? '#ef4444' : '#10b981'
              }
            ].map((m, i) => (
              <div key={i} className="bg-white p-6 rounded-[24px] border border-[#e5e7eb] shadow-sm flex flex-col justify-between group hover:border-[#3b82f6]/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#94a3b8]">{m.label}</span>
                  <m.icon style={{ color: m.color }} size={18} strokeWidth={2.5} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <div className="text-[24px] font-black text-[#0f172a] tracking-tight tabular-nums flex items-baseline gap-2">
                    {m.value}
                    <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">{m.sub}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            {/* Ledger */}
            <div>
              <div className="flex items-center gap-2.5 mb-5 px-1">
                <ShoppingCart size={16} className="text-[#3b82f6]" strokeWidth={2.5} />
                <h3 className="text-[15px] font-black text-[#0f172a] uppercase tracking-wider">Transactional Ledger</h3>
              </div>
              <div className="bg-white border border-[#e5e7eb] rounded-[24px] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f8fafc]/50 border-b border-[#f1f5f9]">
                        <th className="px-6 py-4 text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Date / Time</th>
                        <th className="px-6 py-4 text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Type</th>
                        <th className="px-6 py-4 text-[10px] font-black text-[#94a3b8] uppercase tracking-widest text-right">Debit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {sales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-[#f8fafc]/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-[13px] font-bold text-[#0f172a]">{new Date(sale.created_at).toLocaleDateString()}</span>
                              <span className="text-[10px] text-[#94a3b8] font-medium">{new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-wider border ${
                               sale.sale_type === 'cash' ? 'bg-[#ecfdf5] text-[#10b981] border-[#d1fae5]' : 
                               sale.sale_type === 'free' ? 'bg-[#eff6ff] text-[#3b82f6] border-[#dbeafe]' :
                               'bg-[#fff7ed] text-[#f59e0b] border-[#ffedd5]'
                             }`}>
                               {sale.sale_type}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-[15px] font-black text-[#0f172a] tabular-nums">${Number(sale.total_amount).toLocaleString()}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Payments */}
            <div>
              <div className="flex items-center gap-2.5 mb-5 px-1">
                <Banknote size={16} className="text-[#10b981]" strokeWidth={2.5} />
                <h3 className="text-[15px] font-black text-[#0f172a] uppercase tracking-wider">Revenue Audits</h3>
              </div>
              <div className="bg-white border border-[#e5e7eb] rounded-[24px] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f8fafc]/50 border-b border-[#f1f5f9]">
                        <th className="px-6 py-4 text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Verified Date</th>
                        <th className="px-6 py-4 text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Mechanism</th>
                        <th className="px-6 py-4 text-[10px] font-black text-[#94a3b8] uppercase tracking-widest text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-[#f8fafc]/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-[13px] font-bold text-[#0f172a]">{new Date(payment.created_at).toLocaleDateString()}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest">{payment.payment_method.replace('_', ' ')}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-[16px] font-black text-[#10b981] tabular-nums">+ ${Number(payment.amount).toLocaleString()}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

function TopBar({ title }: { title: string }) {
  return (
    <div className="bg-white border-b border-slate-100 px-8 h-12 flex items-center shrink-0">
      <h1 className="text-[14px] font-black text-slate-800 uppercase tracking-widest">{title}</h1>
    </div>
  )
}
