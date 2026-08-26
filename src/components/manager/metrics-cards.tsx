import { Users, ShieldCheck, Activity } from 'lucide-react'

export function ManagerMetricsCards({ metrics }: { metrics: any }) {
  const cards = [
    { title: 'Total Agents', value: metrics.agents, icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Total Staff', value: metrics.staff, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { title: 'Accountants', value: metrics.accountants, icon: Activity, color: 'text-amber-500', bg: 'bg-amber-50' },
    { title: 'System Registry', value: metrics.total, icon: ShieldCheck, color: 'text-indigo-500', bg: 'bg-indigo-50' }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, i) => (
        <div key={i} className="bg-white p-6 rounded-[20px] border border-[#e5e7eb] shadow-sm flex items-center gap-5">
          <div className={`w-12 h-12 rounded-full ${card.bg} flex items-center justify-center shrink-0`}>
            <card.icon className={card.color} size={22} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-[#64748b] leading-none mb-1">{card.title}</span>
            <span className="text-[24px] font-black text-[#0f172a] leading-none tracking-tight">{card.value}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
