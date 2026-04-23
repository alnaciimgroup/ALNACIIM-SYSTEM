import { StaffMetricsCards } from '@/components/staff/metrics-cards'
import { RecentSales } from '@/components/staff/recent-sales'
import { EndOfDayReport } from '@/components/staff/end-of-day-report'
import { InventoryAlerts } from '@/components/staff/inventory-alerts'
import { getStaffDashboardData } from '@/app/dashboard/staff/actions'

export async function StaffDashboardContent({ date }: { date: string }) {
  const { metrics, recentSales } = await getStaffDashboardData(date)
  const today = new Date().toISOString().split('T')[0]

  const dailyReport = {
    tanksSold: metrics.tanksSold,
    moneySubmitted: metrics.cashSalesToday,
    moneyCollected: metrics.moneyCollectedToday,
    cashSales: metrics.cashSalesToday,
    debtPayments: metrics.debtPaymentsToday,
    creditSold: metrics.creditSalesToday,
    outstandingDebt: metrics.outstandingDebt,
    freeTanksSold: metrics.freeTanksToday,
    status: (metrics.submissionStatus === 'verified' ? 'VERIFIED' : (metrics.submissionStatus === 'submitted' || metrics.submissionStatus === 'disputed' || metrics.submissionStatus === 'pending' ? 'SUBMITTED' : 'PENDING')) as 'PENDING' | 'SUBMITTED' | 'VERIFIED',
    date: date === 'all' ? today : date
  }

  return (
    <>
      <StaffMetricsCards metrics={metrics} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8 mt-2">
        <div className="flex flex-col gap-8">
          <RecentSales sales={recentSales.map((s: any) => ({
            id: s.id,
            reference: `TXN-${s.id.slice(0, 5).toUpperCase()}`,
            time: new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quantity: s.sale_items?.reduce((a: number, i: any) => a + i.quantity, 0) || 0,
            amount: Number(s.total_amount),
            sale_type: s.sale_type
          }))} />
        </div>

        <div className="flex flex-col gap-8">
          <EndOfDayReport report={dailyReport} />
          <InventoryAlerts />
        </div>
      </div>
    </>
  )
}
