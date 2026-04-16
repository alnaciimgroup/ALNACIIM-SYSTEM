import { ArrowDownToLine, ShoppingBag, ClipboardList, Banknote, CreditCard, Users, DollarSign, Wallet, ArrowDownCircle } from 'lucide-react'

interface StaffMetricsProps {
  tanksReceived: number
  tanksSold: number
  remainingTanks: number
  remainingFreeTanks?: number
  cashSalesToday: number
  creditSalesToday: number
  debtPaymentsToday: number
  moneyCollectedToday: number
  outstandingDebt: number
}

export function StaffMetricsCards({ metrics }: { metrics: StaffMetricsProps }) {
  const totalMoneyToday = metrics.cashSalesToday + metrics.creditSalesToday

  const cards = [
    { title: 'Tanks Received', value: metrics.tanksReceived, icon: ArrowDownToLine, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Tanks Sold', value: metrics.tanksSold, icon: ShoppingBag, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { title: 'Tanks Remaining', value: metrics.remainingFreeTanks ? `${metrics.remainingTanks} (${metrics.remainingFreeTanks} Free)` : metrics.remainingTanks, icon: ClipboardList, color: 'text-amber-500', bg: 'bg-amber-50' },
    { title: 'Cash Collected', value: `$${metrics.moneyCollectedToday}`, icon: Banknote, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Credit (Debt)', value: `$${metrics.creditSalesToday}`, icon: CreditCard, color: 'text-orange-500', bg: 'bg-orange-50' },
    { title: 'Debt Payments', value: `$${metrics.debtPaymentsToday}`, icon: ArrowDownCircle, color: 'text-teal-500', bg: 'bg-teal-50' },
    { title: 'Total Money Today', value: `$${totalMoneyToday}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Total Money in Debt', value: `$${metrics.outstandingDebt}`, icon: Wallet, color: 'text-red-500', bg: 'bg-red-50' }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, i) => (
        <div key={i} className="bg-white p-6 rounded-[24px] border border-[#e5e7eb] shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
          <div className={`w-12 h-12 rounded-full ${card.bg} flex items-center justify-center shrink-0`}>
            <card.icon className={card.color} size={22} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-[#64748b] leading-none mb-1.5 uppercase tracking-wide opacity-80">{card.title}</span>
            <span className="text-[26px] font-black text-[#0f172a] leading-none tracking-tight">{card.value}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
