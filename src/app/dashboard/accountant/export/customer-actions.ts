'use server'

import { createClient } from '@/utils/supabase/server'
import { verifySession } from '@/utils/auth'
import { getWorkDayBounds } from '@/utils/date-utils'

export type CustomerTransaction = {
  date: string
  rawDate: string
  type: string
  referenceId: string
  staffName: string
  liters: string | number
  bonusLiters: string | number
  totalAmount: number
  amountPaid: number
  debtImpact: number
}

export type CustomerExportResult = {
  customer: {
    name: string
    phone: string
    tankNumber: string
    guarantor: string
    guarantorPhone: string
    debt: number
    staffName: string
  }
  transactions: CustomerTransaction[]
  csvContent: string
  metadata: {
    startDate: string
    endDate: string
    range: string
  }
}

export async function generateCustomerExport(
  customerId: string,
  range: string,
  custom?: { start: string; end: string }
): Promise<CustomerExportResult> {
  await verifySession(['accountant'])
  const supabase = await createClient()

  // 1. Fetch Customer Profile & assigned staff
  const { data: customerData, error: custError } = await supabase
    .from('customers')
    .select('*, staff:users(full_name)')
    .eq('id', customerId)
    .single()

  if (custError || !customerData) {
    throw new Error('Customer not found or database error')
  }

  // 2. Parse Date Range (Somalia Work-Day Window Logic, matching Universal Export)
  let startDate: string | null = null
  let endDate: string | null = null

  const nowSomalia = new Date(new Date().getTime() + 3 * 60 * 60 * 1000)

  const fmtYMD = (d: Date) => {
    const Y = d.getUTCFullYear()
    const M = String(d.getUTCMonth() + 1).padStart(2, '0')
    const D = String(d.getUTCDate()).padStart(2, '0')
    return `${Y}-${M}-${D}`
  }

  if (range === 'today') {
    startDate = fmtYMD(nowSomalia)
    endDate = startDate
  } else if (range === 'this_week') {
    const sunday = new Date(nowSomalia)
    sunday.setUTCDate(nowSomalia.getUTCDate() - nowSomalia.getUTCDay())
    startDate = fmtYMD(sunday)
    endDate = fmtYMD(nowSomalia)
  } else if (range === 'last_week') {
    const sundayThisWeek = new Date(nowSomalia)
    sundayThisWeek.setUTCDate(nowSomalia.getUTCDate() - nowSomalia.getUTCDay())
    const sundayLastWeek = new Date(sundayThisWeek)
    sundayLastWeek.setUTCDate(sundayThisWeek.getUTCDate() - 7)
    const saturdayLastWeek = new Date(sundayThisWeek)
    saturdayLastWeek.setUTCDate(sundayThisWeek.getUTCDate() - 1)
    startDate = fmtYMD(sundayLastWeek)
    endDate = fmtYMD(saturdayLastWeek)
  } else if (range === 'this_month') {
    const firstDay = new Date(Date.UTC(nowSomalia.getUTCFullYear(), nowSomalia.getUTCMonth(), 1))
    startDate = fmtYMD(firstDay)
    endDate = fmtYMD(nowSomalia)
  } else if (range === 'last_month') {
    const firstOfLastMonth = new Date(Date.UTC(nowSomalia.getUTCFullYear(), nowSomalia.getUTCMonth() - 1, 1))
    const lastOfLastMonth = new Date(Date.UTC(nowSomalia.getUTCFullYear(), nowSomalia.getUTCMonth(), 0))
    startDate = fmtYMD(firstOfLastMonth)
    endDate = fmtYMD(lastOfLastMonth)
  } else if (range === 'custom' && custom) {
    startDate = custom.start
    endDate = custom.end
  } else if (range === 'all') {
    startDate = '2024-01-01'
    endDate = fmtYMD(nowSomalia)
  }

  const startUTC = startDate ? getWorkDayBounds(startDate).startOfDay : '2000-01-01T00:00:00.000Z'
  const endUTC = endDate ? getWorkDayBounds(endDate).endOfDay : '2099-12-31T23:59:59.999Z'

  // 3. Fetch Sales & Repayments in parallel
  const [
    { data: sales, error: salesError },
    { data: payments, error: paymentsError },
    { data: users, error: usersError }
  ] = await Promise.all([
    supabase
      .from('sales')
      .select('id, created_at, total_amount, sale_type, status, staff_id, sale_items(quantity, free_quantity)')
      .eq('customer_id', customerId)
      .eq('status', 'completed')
      .gte('created_at', startUTC)
      .lte('created_at', endUTC)
      .order('created_at', { ascending: true }),
    supabase
      .from('payments')
      .select('id, created_at, amount, payment_method, sales!inner(customer_id, staff_id)')
      .eq('sales.customer_id', customerId)
      .eq('payment_method', 'debt_repayment') // filter only repayments, cash is linked directly to sale row
      .gte('created_at', startUTC)
      .lte('created_at', endUTC)
      .order('created_at', { ascending: true }),
    supabase
      .from('users')
      .select('id, full_name')
  ])

  if (salesError) throw new Error('Sales query error: ' + salesError.message)
  if (paymentsError) throw new Error('Payments query error: ' + paymentsError.message)
  if (usersError) throw new Error('Users query error: ' + usersError.message)

  const userMap = new Map(users?.map(u => [u.id, u.full_name]) || [])

  // Helper date formatter
  const fmtDate = (val: string | Date | null | undefined) => {
    if (!val) return '-'
    const d = new Date(val)
    const Y = d.getFullYear()
    const M = String(d.getMonth() + 1).padStart(2, '0')
    const D = String(d.getDate()).padStart(2, '0')
    const H = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${Y}-${M}-${D} ${H}:${m}`
  }

  const transactions: CustomerTransaction[] = []

  // 4. Populate Sales
  sales?.forEach(s => {
    const saleItems = s.sale_items as unknown as { quantity: number; free_quantity: number }[] | null
    const qty = saleItems?.reduce((acc: number, item) => acc + Number(item.quantity || 0), 0) || 0
    const bonus = saleItems?.reduce((acc: number, item) => acc + Number(item.free_quantity || 0), 0) || 0
    
    let amountPaid = 0
    let debtImpact = 0
    
    if (s.sale_type === 'cash') {
      amountPaid = Number(s.total_amount)
    } else if (s.sale_type === 'credit') {
      debtImpact = Number(s.total_amount)
    }

    transactions.push({
      date: fmtDate(s.created_at),
      rawDate: s.created_at,
      type: `SALE (${s.sale_type?.toUpperCase()})`,
      referenceId: s.id,
      staffName: userMap.get(s.staff_id) || 'Unknown',
      liters: qty,
      bonusLiters: bonus,
      totalAmount: Number(s.total_amount),
      amountPaid,
      debtImpact
    })
  })

  // 5. Populate Repayments
  payments?.forEach(p => {
    const salesRelation = p.sales as unknown as { staff_id: string }
    const staffId = salesRelation?.staff_id
    transactions.push({
      date: fmtDate(p.created_at),
      rawDate: p.created_at,
      type: 'PAYMENT (DEBT REPAYMENT)',
      referenceId: p.id,
      staffName: userMap.get(staffId) || 'Unknown',
      liters: '-',
      bonusLiters: '-',
      totalAmount: 0,
      amountPaid: Number(p.amount),
      debtImpact: -Number(p.amount)
    })
  })

  // Sort chronologically
  transactions.sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime())

  // 6. Build CSV Content
  const toCsvRow = (arr: (string | number | undefined)[]) => arr.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')
  const fmtCurrency = (val: string | number) => `$${Number(val || 0).toFixed(2)}`

  const staffObj = customerData.staff as unknown as { full_name: string } | null
  const staffName = staffObj?.full_name || 'N/A'

  const csvHeaderMetadata = [
    toCsvRow(['Customer Statement Report']),
    toCsvRow(['Customer Name', customerData.name]),
    toCsvRow(['Phone', customerData.phone || 'N/A']),
    toCsvRow(['Tank Number', customerData.tank_number || 'N/A']),
    toCsvRow(['Guarantor Name', customerData.guarantor || 'N/A']),
    toCsvRow(['Guarantor Phone', customerData.guarantor_phone || 'N/A']),
    toCsvRow(['Assigned Staff Representative', staffName]),
    toCsvRow(['Current Outstanding Debt', fmtCurrency(customerData.debt)]),
    toCsvRow(['Reporting Period', `${startDate || 'Start'} to ${endDate || 'End'}`]),
    '' // empty line
  ]

  const tableHeaders = ['Date', 'Transaction Type', 'Reference ID', 'Staff Representative', 'Liters Refilled', 'Bonus Liters', 'Total Value', 'Amount Paid', 'Debt Impact']
  const tableRows = transactions.map(t => toCsvRow([
    t.date,
    t.type,
    t.referenceId,
    t.staffName,
    t.liters,
    t.bonusLiters,
    t.totalAmount > 0 ? fmtCurrency(t.totalAmount) : '-',
    t.amountPaid > 0 ? fmtCurrency(t.amountPaid) : '-',
    t.debtImpact !== 0 ? `${t.debtImpact > 0 ? '+' : ''}${fmtCurrency(t.debtImpact)}` : '-'
  ]))

  const csvContent = [...csvHeaderMetadata, tableHeaders.join(','), ...tableRows].join('\n')

  return {
    customer: {
      name: customerData.name,
      phone: customerData.phone || 'N/A',
      tankNumber: customerData.tank_number || 'N/A',
      guarantor: customerData.guarantor || 'N/A',
      guarantorPhone: customerData.guarantor_phone || 'N/A',
      debt: Number(customerData.debt || 0),
      staffName
    },
    transactions,
    csvContent,
    metadata: {
      startDate: startDate || 'start',
      endDate: endDate || 'end',
      range
    }
  }
}
