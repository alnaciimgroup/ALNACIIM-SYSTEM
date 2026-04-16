import { createClient } from '@/utils/supabase/server'
import { getWorkDate } from '@/utils/date-utils'

export async function getReportsSummary(filters: {
  startDate?: string;
  endDate?: string;
  staffId?: string;
  customerId?: string;
}) {
  const supabase = await createClient()

  let salesQuery = supabase.from('sales').select('id, total_amount, sale_type, created_at, staff_id')
  let paymentsQuery: any = supabase.from('payments').select('amount, payment_method, created_at, sales!inner(staff_id)')
  let submissionsQuery = supabase.from('cash_submissions').select('amount, submitted_amount, status, submission_date, staff_id')
  let distQuery = supabase.from('distributions').select('quantity, created_at, staff_id')
  let saleItemsQuery = supabase.from('sale_items').select('quantity, sales!inner(created_at, staff_id, customer_id, sale_type)')

  // Apply Specific Filters
  if (filters.startDate) {
    const start = `${filters.startDate}T00:00:00.000Z`
    salesQuery = salesQuery.gte('created_at', start)
    paymentsQuery = paymentsQuery.gte('created_at', start)
    submissionsQuery = submissionsQuery.gte('submission_date', filters.startDate)
    distQuery = distQuery.gte('created_at', start)
    saleItemsQuery = saleItemsQuery.gte('sales.created_at', start)
  }
  if (filters.endDate) {
    const end = `${filters.endDate}T23:59:59.999Z`
    salesQuery = salesQuery.lte('created_at', end)
    paymentsQuery = paymentsQuery.lte('created_at', end)
    submissionsQuery = submissionsQuery.lte('submission_date', filters.endDate)
    distQuery = distQuery.lte('created_at', end)
    saleItemsQuery = saleItemsQuery.lte('sales.created_at', end)
  }
  if (filters.staffId) {
    salesQuery = salesQuery.eq('staff_id', filters.staffId)
    submissionsQuery = submissionsQuery.eq('staff_id', filters.staffId)
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
    { data: periodSubmissions },
    { data: distributions },
    { data: saleItems },
    { data: globalSales },
    { data: globalPayments },
    { data: allSubmissions }
  ] = await Promise.all([
    salesQuery,
    paymentsQuery,
    submissionsQuery,
    distQuery.select('quantity, created_at, staff_id'),
    saleItemsQuery.select('quantity, sales!inner(created_at, staff_id, customer_id, sale_type)'),
    supabase.from('sales').select('total_amount').eq('sale_type', 'credit'),
    supabase.from('payments').select('amount').eq('payment_method', 'debt_repayment'),
    supabase.from('cash_submissions').select('staff_id, submission_date, status')
  ])

  // GATING LOGIC
  const verifiedDays = new Set((allSubmissions || [])
    .filter(s => s.status === 'verified')
    .map(s => `${s.staff_id}_${s.submission_date?.split('T')[0]}`))

  const isVerified = (staffId: string, createdAt: string) => {
    if (!staffId || !createdAt) return false
    const workDate = getWorkDate(createdAt)
    return verifiedDays.has(`${staffId}_${workDate}`)
  }

  // 1. RAW CALCULATIONS (Live Data)
  const actualDistributed = (distributions || []).reduce((acc: number, d: any) => acc + d.quantity, 0) || 0
  const actualSold = (saleItems || []).reduce((acc: number, si: any) => acc + si.quantity, 0) || 0
  const actualRemaining = actualDistributed - actualSold

  // 2. AUDITED CALCULATIONS (Verified Data)
  const filteredSales = (sales || []).filter((s: any) => isVerified((s as any).staff_id, s.created_at))
  const filteredPayments = (payments || []).filter((p: any) => isVerified((p.sales as any).staff_id, p.created_at))
  const filteredDistributions = (distributions || []).filter((d: any) => isVerified((d as any).staff_id, d.created_at))
  const filteredSaleItems = (saleItems || []).filter((si: any) => isVerified((si.sales as any).staff_id, (si.sales as any).created_at))

  const auditedDistributed = filteredDistributions?.reduce((acc: number, d: any) => acc + d.quantity, 0) || 0
  const auditedSold = filteredSaleItems?.reduce((acc: number, si: any) => acc + si.quantity, 0) || 0

  // 3. FINANCIAL CALCULATIONS
  const creditSalesAmount = filteredSales?.filter(s => s.sale_type === 'credit').reduce((acc: number, s: any) => acc + Number(s.total_amount), 0) || 0
  
  const cashPayments = filteredPayments?.filter((p: any) => p.payment_method === 'cash').reduce((acc: number, p: any) => acc + Number(p.amount), 0) || 0
  const debtPayments = filteredPayments?.filter((p: any) => p.payment_method === 'debt_repayment').reduce((acc: number, p: any) => acc + Number(p.amount), 0) || 0

  const totalActualCollected = (payments || []).filter((p: any) => p.payment_method === 'cash' || p.payment_method === 'debt_repayment').reduce((acc: number, p: any) => acc + Number(p.amount), 0) || 0
  const auditedCollected = cashPayments + debtPayments

  const totalSubmitted = (periodSubmissions || [])
    .filter((s: any) => s.status === 'verified')
    .reduce((acc: number, s: any) => acc + Number(s.submitted_amount ?? s.amount), 0) || 0

  // The Difference should be relative to the Audited (Verified) collections
  const totalDifference = auditedCollected - totalSubmitted
  
  const totalActualCredit = (sales || [])?.filter((s: any) => s.sale_type === 'credit').reduce((acc: number, s: any) => acc + Number(s.total_amount), 0) || 0
  const auditedCredit = creditSalesAmount

  // Global Financial Balances (Always All-Time)
  const globalTotalCredit = (globalSales || [])?.reduce((acc: number, s: any) => acc + Number(s.total_amount), 0) || 0
  const globalDebtPayments = (globalPayments || [])?.reduce((acc: number, p: any) => acc + Number(p.amount), 0) || 0
  const outstandingBalance = globalTotalCredit - globalDebtPayments

  // Calculate Free Distribution
  const totalFreeTanks = (saleItems || [])?.filter((si: any) => (si.sales as any).sale_type === 'free').reduce((acc: number, si: any) => acc + si.quantity, 0) || 0
  const auditedFreeTanks = filteredSaleItems?.filter((si: any) => (si.sales as any).sale_type === 'free').reduce((acc: number, si: any) => acc + si.quantity, 0) || 0

  return {
    totalDistributed: actualDistributed,
    auditedDistributed,
    totalSold: actualSold,
    auditedSold,
    totalFreeTanks,
    auditedFreeTanks,
    remainingTanks: actualRemaining,
    totalCollected: totalActualCollected,
    auditedCollected,
    totalSubmitted,
    totalDifference,
    totalCredit: totalActualCredit,
    auditedCredit,
    outstandingBalance
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
        id, created_at, total_amount, sale_type, status,
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
      const { data: verifiedReports } = await supabase.from('cash_submissions').select('staff_id, submission_date').eq('status', 'verified')
      const verifiedKeys = new Set((verifiedReports || []).map(r => `${r.staff_id}_${r.submission_date}`))
      
      const { data } = await query.order('created_at', { ascending: false })
      return (data || []).filter(s => verifiedKeys.has(`${(s as any).staff_id}_${new Date(s.created_at).toISOString().split('T')[0]}`))
    }

    case 'distribution': {
      let query = supabase.from('distributions').select(`
        id, created_at, quantity, status,
        agent:users!agent_id_fkey(full_name),
        staff:users!staff_id_fkey(full_name),
        item:items(name)
      `)
      if (start) query = query.gte('created_at', start)
      if (end) query = query.lte('created_at', end)
      if (filters.staffId) query = query.eq('staff_id', filters.staffId)
      if (filters.itemId) query = query.eq('item_id', filters.itemId)
      const { data: verifiedReports } = await supabase.from('cash_submissions').select('staff_id, submission_date').eq('status', 'verified')
      const verifiedKeys = new Set((verifiedReports || []).map(r => `${r.staff_id}_${r.submission_date}`))

      const { data } = await query.order('created_at', { ascending: false })
      return (data || []).filter(d => verifiedKeys.has(`${(d as any).staff_id}_${new Date(d.created_at).toISOString().split('T')[0]}`))
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
