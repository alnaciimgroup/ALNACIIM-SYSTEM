import { createClient } from '@/utils/supabase/server'

export async function getStaffDetailReport(staffId: string, targetDate?: string) {
  const supabase = await createClient()

  const [
    { data: staff },
    { data: customers },
    { data: distributions },
    { data: sales },
    { data: submissions }
  ] = await Promise.all([
    supabase.from('users').select('id, full_name').eq('id', staffId).single(),
    supabase.from('customers').select('id, name, phone, address, guarantor, status, debt, created_at').eq('staff_id', staffId).order('created_at', { ascending: false }),
    supabase.from('distributions').select('id, quantity, free_quantity, created_at, zone').eq('staff_id', staffId).order('created_at', { ascending: false }),
    supabase.from('sales').select('id, total_amount, sale_type, created_at, custom_sale_id, sale_items(quantity, unit_price), customer:customers(name)').eq('staff_id', staffId).order('created_at', { ascending: false }),
    supabase.from('cash_submissions').select('id, submission_date, tanks_sold, money_collected, submitted_amount, difference_amount, status').eq('staff_id', staffId).order('created_at', { ascending: false })
  ])

  if (!staff) throw new Error('Staff not found')

  const totalCustomers = customers?.length || 0

  const allTimeReceived = distributions?.reduce((a, b) => a + b.quantity, 0) || 0
  const allTimeFreeReceived = distributions?.reduce((a, b) => a + (b.free_quantity || 0), 0) || 0
  
  const allTimeSold = sales?.reduce((a, b) => a + ((b.sale_items as any)?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0), 0) || 0
  const allTimeFreeSold = sales?.filter(s => s.sale_type === 'free')?.reduce((a, b) => a + ((b.sale_items as any)?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0), 0) || 0
  
  const allTimeRevenue = sales?.reduce((a, b) => a + Number(b.total_amount), 0) || 0
  
  let filteredSales = sales || []
  let filteredDistributions = distributions || []
  let filteredSubmissions = submissions || []

  if (targetDate) {
    filteredSales = filteredSales.filter(s => s.created_at.startsWith(targetDate))
    filteredDistributions = filteredDistributions.filter(d => d.created_at.startsWith(targetDate))
    filteredSubmissions = filteredSubmissions.filter(s => s.submission_date.startsWith(targetDate))
  }

  return {
    profile: staff,
    stats: {
      totalCustomers,
      allTimeReceived,
      allTimeSold,
      allTimeFreeReceived,
      allTimeFreeSold,
      allTimeRevenue,
      currentBalance: Math.max(0, allTimeReceived - allTimeSold)
    },
    customers: customers || [],
    distributions: filteredDistributions,
    sales: filteredSales,
    submissions: filteredSubmissions
  }
}
