import { StaffMetricsCards } from '@/components/staff/metrics-cards'
import { RecentSales } from '@/components/staff/recent-sales'
import { EndOfDayReport } from '@/components/staff/end-of-day-report'
import { InventoryAlerts } from '@/components/staff/inventory-alerts'
import { CustomerAlerts } from '@/components/staff/customer-alerts'
import { getStaffDashboardData } from '@/app/dashboard/staff/actions'
import { getCurrentWorkDate } from '@/utils/date-utils'

export async function StaffDashboardContent({ date }: { date: string }) {
  const { metrics, recentSales, inactiveRegularCustomers } = await getStaffDashboardData(date)
  const today = getCurrentWorkDate()

  const dailyReport = {
    litersSold: metrics.tanksSold,
    moneySubmitted: metrics.cashSalesToday,
    moneyCollected: metrics.moneyCollectedToday,
    cashSales: metrics.cashSalesToday,
    debtPayments: metrics.debtPaymentsToday,
    creditSold: metrics.creditSalesToday,
    outstandingDebt: metrics.outstandingDebt,
    freeLitersSold: metrics.freeTanksToday,
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
            sale_type: s.sale_type,
            discount_amount: Number(s.discount_amount || 0)
          }))} />
        </div>

        <div className="flex flex-col gap-8">
          {inactiveRegularCustomers && inactiveRegularCustomers.length > 0 && (
            <CustomerAlerts inactiveCustomers={inactiveRegularCustomers} />
          )}
          <EndOfDayReport report={dailyReport} />
          <InventoryAlerts />
        </div>
      </div>
    </>
  )
}
