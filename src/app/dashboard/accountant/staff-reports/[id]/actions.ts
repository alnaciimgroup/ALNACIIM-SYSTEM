import { createClient } from '@/utils/supabase/server'
import { getReportsSummary } from '../../reports/actions'
import { ReportsSummary } from '@/types/reports'

export async function getStaffDetailReport(staffId: string, targetDate?: string) {
  const supabase = await createClient()

  // 1. Fetch Core Metrics via Analytics Engine for this specific staff member
  const metrics = await getReportsSummary({ 
    staffId,
    startDate: targetDate, 
    endDate: targetDate 
  }) as ReportsSummary

  const [
    { data: staff },
    { data: customers },
    { data: submissions },
    { data: sales }
  ] = await Promise.all([
    supabase.from('users').select('id, full_name').eq('id', staffId).single(),
    supabase.from('customers').select('id, name, phone, address, guarantor, status, debt, created_at').eq('staff_id', staffId).order('created_at', { ascending: false }),
    supabase.from('cash_submissions').select('id, submission_date, tanks_sold, money_collected, submitted_amount, difference_amount, status, created_at').eq('staff_id', staffId).order('created_at', { ascending: false }),
    supabase.from('sales').select('id, total_amount, sale_type, created_at, custom_sale_id, sale_items(quantity, unit_price), customer:customers(name)').eq('staff_id', staffId).order('created_at', { ascending: false })
  ])

  if (!staff) throw new Error('Staff not found')

  let filteredSales = sales || []
  let filteredSubmissions = submissions || []

  if (targetDate) {
    filteredSales = filteredSales.filter(s => s.created_at.startsWith(targetDate))
    filteredSubmissions = filteredSubmissions.filter(s => s.submission_date.startsWith(targetDate))
  }

  return {
    profile: staff,
    stats: metrics,
    customers: customers || [],
    sales: filteredSales,
    submissions: filteredSubmissions
  }
}
