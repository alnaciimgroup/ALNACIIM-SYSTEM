import { createClient } from '@/utils/supabase/server'

export async function getStaffReportsList(date?: string) {
  const supabase = await createClient()

  const targetDate = date || new Date().toISOString().split('T')[0]
  const startOfDay = `${targetDate}T00:00:00.000Z`
  const endOfDay = `${targetDate}T23:59:59.999Z`

  // 1. Fetch all required data in PARALLEL (Massive Speed Boost)
  const [
    { data: staffUsers },
    { data: distributions },
    { data: sales },
    { data: payments },
    { data: submissions },
    { data: customers }
  ] = await Promise.all([
    supabase.from('users').select('id, full_name').eq('role', 'staff').order('full_name'),
    supabase.from('distributions').select('quantity, staff_id').gte('created_at', startOfDay).lte('created_at', endOfDay),
    supabase.from('sales').select('id, staff_id, total_amount, sale_type, sale_items(quantity)').gte('created_at', startOfDay).lte('created_at', endOfDay),
    supabase.from('payments').select('amount, sale:sales!inner(staff_id)').gte('created_at', startOfDay).lte('created_at', endOfDay),
    supabase.from('cash_submissions').select('staff_id, submitted_amount').eq('submission_date', targetDate),
    supabase.from('customers').select('staff_id, debt')
  ])

  // 2. Pre-process data into Fast Lookup Maps (O(n) speed)
  const distMap: Record<string, number> = {}
  distributions?.forEach(d => distMap[d.staff_id] = (distMap[d.staff_id] || 0) + d.quantity)

  const salesMap: Record<string, {sold: number, cash: number, credit: number}> = {}
  sales?.forEach(s => {
    if (!salesMap[s.staff_id]) salesMap[s.staff_id] = { sold: 0, cash: 0, credit: 0 }
    const qty = (s.sale_items as any)?.reduce((acc: number, curr: any) => acc + curr.quantity, 0) || 0
    salesMap[s.staff_id].sold += qty
    if (s.sale_type === 'cash') salesMap[s.staff_id].cash += Number(s.total_amount)
    else salesMap[s.staff_id].credit += Number(s.total_amount)
  })

  const paymentsMap: Record<string, number> = {}
  payments?.forEach(p => {
    const sId = (p.sale as any)?.staff_id
    if (sId) paymentsMap[sId] = (paymentsMap[sId] || 0) + Number(p.amount)
  })

  const subMap: Record<string, number> = {}
  submissions?.forEach(s => subMap[s.staff_id] = (subMap[s.staff_id] || 0) + Number(s.submitted_amount))

  const debtMap: Record<string, number> = {}
  customers?.forEach(c => {
    if (c.staff_id) debtMap[c.staff_id] = (debtMap[c.staff_id] || 0) + Number(c.debt || 0)
  })

  // 3. Aggregate per staff instantly
  const reports = (staffUsers || []).map(staff => {
    const staffSales = salesMap[staff.id] || { sold: 0, cash: 0, credit: 0 }
    const received = distMap[staff.id] || 0
    const sold = staffSales.sold
    const remaining = Math.max(0, received - sold)
    const collected = paymentsMap[staff.id] || 0
    const submitted = subMap[staff.id] || 0
    
    return {
      id: staff.id,
      name: staff.full_name,
      received,
      sold,
      remaining,
      cashSales: staffSales.cash,
      creditSales: staffSales.credit,
      paymentsReceived: collected,
      collected,
      submitted,
      difference: collected - submitted,
      outstandingDebt: debtMap[staff.id] || 0
    }
  })

  return reports
}

