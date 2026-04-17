import { createClient } from '@/utils/supabase/server'

export async function getReportsSummary(filters: {
  startDate?: string;
  endDate?: string;
  staffId?: string;
  customerId?: string;
}) {
  const supabase = await createClient()

  let salesQuery = supabase.from('sales').select('id, total_amount, sale_type, created_at, staff_id')
  let paymentsQuery: any = supabase.from('payments').select('amount, payment_method, created_at, sales!inner(staff_id)')
  let distQuery = supabase.from('distributions').select('quantity, created_at, staff_id')
  let saleItemsQuery = supabase.from('sale_items').select('quantity, sales!inner(created_at, staff_id, customer_id, sale_type)')

  // Apply Specific Filters
  if (filters.startDate) {
    const start = `${filters.startDate}T00:00:00.000Z`
    salesQuery = salesQuery.gte('created_at', start)
    paymentsQuery = paymentsQuery.gte('created_at', start)
    distQuery = distQuery.gte('created_at', start)
    saleItemsQuery = saleItemsQuery.gte('sales.created_at', start)
  }
  if (filters.endDate) {
    const end = `${filters.endDate}T23:59:59.999Z`
    salesQuery = salesQuery.lte('created_at', end)
    paymentsQuery = paymentsQuery.lte('created_at', end)
    distQuery = distQuery.lte('created_at', end)
    saleItemsQuery = saleItemsQuery.lte('sales.created_at', end)
  }
  if (filters.staffId) {
    salesQuery = salesQuery.eq('staff_id', filters.staffId)
    paymentsQuery = supabase.from('payments').select('amount, payment_method, created_at, sales!inner(staff_id)').eq('sales.staff_id', filters.staffId)
    distQuery = distQuery.eq('staff_id', filters.staffId)
    saleItemsQuery = saleItemsQuery.eq('sales.staff_id', filters.staffId)
  }
  if (filters.customerId) {
    salesQuery = salesQuery.eq('customer_id', filters.customerId)
    paymentsQuery = supabase.from('payments').select('amount, payment_method, created_at, sales!inner(customer_id)').eq('sales.customer_id', filters.customerId)
    saleItemsQuery = saleItemsQuery.eq('sales.customer_id', filters.customerId)
  }

  const [
    { data: sales },
    { data: payments },
    { data: distributions },
    { data: saleItems },
    { data: globalSales },
    { data: globalPayments }
  ] = await Promise.all([
    salesQuery,
    paymentsQuery,
    distQuery.select('quantity, created_at, staff_id'),
    saleItemsQuery.select('quantity, sales!inner(created_at, staff_id, customer_id, sale_type)'),
    supabase.from('sales').select('total_amount').eq('sale_type', 'credit'),
    supabase.from('payments').select('amount').eq('payment_method', 'debt_repayment')
  ])

  // 1. FINANCIAL CALCULATIONS
  const totalMoneyCollected = (payments || []).reduce((acc, p) => acc + Number(p.amount), 0) || 0
  
  const cashPayments = (payments || [])
    .filter(p => p.payment_method === 'cash')
    .reduce((acc, p) => acc + Number(p.amount), 0) || 0
  
  const debtPayments = (payments || [])
    .filter(p => p.payment_method === 'debt_repayment')
    .reduce((acc, p) => acc + Number(p.amount), 0) || 0

  const auditedCollected = cashPayments + debtPayments
  const creditSalesAmount = (sales || [])
    .filter(s => s.sale_type === 'credit')
    .reduce((acc, s) => acc + Number(s.total_amount), 0) || 0

  // Global Balances (Always All-Time)
  const globalTotalCredit = (globalSales || [])?.reduce((acc: number, s: any) => acc + Number(s.total_amount), 0) || 0
  const globalDebtPayments = (globalPayments || [])?.reduce((acc: number, p: any) => acc + Number(p.amount), 0) || 0
  const outstandingBalance = globalTotalCredit - globalDebtPayments

  return {
    totalDistributed: (distributions || []).reduce((acc, d) => acc + d.quantity, 0) || 0,
    auditedDistributed: (distributions || []).reduce((acc, d) => acc + d.quantity, 0) || 0,
    totalSold: (saleItems || []).reduce((acc, si) => acc + si.quantity, 0) || 0,
    auditedSold: (saleItems || []).reduce((acc, si) => acc + si.quantity, 0) || 0,
    remainingTanks: ((distributions || []).reduce((acc, d) => acc + d.quantity, 0) || 0) - ((saleItems || []).reduce((acc, si) => acc + si.quantity, 0) || 0),
    totalCollected: auditedCollected, 
    auditedCollected,
    totalSubmitted: auditedCollected, // Submission page is removed, so we assume submission = collection
    totalDifference: 0,
    totalCredit: creditSalesAmount,
    auditedCredit: creditSalesAmount,
    outstandingBalance, 
    expectedRevenue: auditedCollected + creditSalesAmount 
  }
}

export async function getFilterMetadata() {
  const supabase = await createClient()
  const [
    { data: staff },
    { data: customers },
    { data: items }
  ] = await Promise.all([
    supabase.from('users').select('id, full_name, role').in('role', ['staff', 'activeStaff']),
    supabase.from('customers').select('id, name'),
    supabase.from('items').select('id, name')
  ])

  return {
    staff: staff || [],
    customers: customers || [],
    items: items || []
  }
}

export async function getDetailedReport(type: string, filters: {
  startDate?: string;
  endDate?: string;
  staffId?: string;
  customerId?: string;
  itemId?: string;
  saleType?: string;
  status?: string;
}) {
  const supabase = await createClient()
  const start = filters.startDate ? `${filters.startDate}T00:00:00.000Z` : null
  const end = filters.endDate ? `${filters.endDate}T23:59:59.999Z` : null

  switch (type) {
    case 'sales': {
      let query = supabase.from('sales').select(`
        id, created_at, total_amount, sale_type, status, staff_id,
        staff:users!sales_staff_id_fkey(full_name),
        customer:customers(name),
        items:sale_items(quantity, items(name))
      `)
      if (start) query = query.gte('created_at', start)
      if (end) query = query.lte('created_at', end)
      if (filters.staffId) query = query.eq('staff_id', filters.staffId)
      if (filters.customerId) query = query.eq('customer_id', filters.customerId)
      if (filters.saleType) query = query.eq('sale_type', filters.saleType)
      if (filters.status) query = query.eq('status', filters.status)
      
      const { data } = await query.order('created_at', { ascending: false })
      return data || []
    }

    case 'distribution': {
      let query = supabase.from('distributions').select(`
        id, created_at, quantity, status, staff_id,
        agent:users!agent_id_fkey(full_name),
        staff:users!staff_id_fkey(full_name),
        item:items(name)
      `)
      if (start) query = query.gte('created_at', start)
      if (end) query = query.lte('created_at', end)
      if (filters.staffId) query = query.eq('staff_id', filters.staffId)
      if (filters.itemId) query = query.eq('item_id', filters.itemId)
      
      const { data } = await query.order('created_at', { ascending: false })
      return data || []
    }

    case 'debt': {
      const { data: customers } = await supabase.from('customers').select('id, name, users(full_name)')
      const { data: sales } = await supabase.from('sales').select('customer_id, total_amount').eq('sale_type', 'credit')
      const { data: payments } = await supabase.from('payments').select('amount, sales!inner(customer_id)').eq('payment_method', 'debt_repayment')

      return (customers || []).map(c => {
        const totalDebt = (sales || []).filter(s => s.customer_id === c.id).reduce((acc, s) => acc + Number(s.total_amount), 0)
        const totalPaid = (payments || []).filter(p => (p.sales as any).customer_id === c.id).reduce((acc, p) => acc + Number(p.amount), 0)
        return {
          id: c.id,
          name: c.name,
          staff: (c.users as any)?.full_name || 'N/A',
          amount: totalDebt - totalPaid
        }
      }).filter(c => c.amount > 0)
    }

    default:
      return []
  }
}
