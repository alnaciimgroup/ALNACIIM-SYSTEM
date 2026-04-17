// @ts-nocheck
import { getReportsSummary } from '../reports/actions'
import { createClient } from '@/utils/supabase/server'
import { verifySession } from '@/utils/auth'
import { ReportsSummary } from '@/types/reports'

export async function getFinancialOverview() {
  await verifySession(['accountant'])
  
  // 1. Fetch high level audited totals from the central engine
  // This ensures the $115, $100, and $15 metrics are perfectly synced
  const metrics = await getReportsSummary({}) as ReportsSummary

  const supabase = await createClient()

  // 2. Fetch top debtors for the risk area
  const { data: topDebtors } = await supabase
    .from('customers')
    .select('id, name, debt, phone, staff:users!inner(full_name)')
    .gt('debt', 0)
    .order('debt', { ascending: false })
    .limit(5)

  return {
    totals: {
      totalCashSales: metrics.auditedCollected, // Audited collected truth ($100)
      totalCreditSales: metrics.auditedCredit, // Audited credit sales ($15)
      totalPaymentsReceived: metrics.auditedCollected,
      totalMoneyCollected: metrics.auditedCollected,
      totalMoneySubmitted: metrics.totalSubmitted,
      totalOutstandingBalance: metrics.outstandingBalance, // ($15)
      totalDifference: metrics.totalDifference,
      expectedRevenue: metrics.expectedRevenue // ($115)
    },
    topDebtors: topDebtors || []
  }
}
