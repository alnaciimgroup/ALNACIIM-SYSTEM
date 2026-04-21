import { createClient } from '@/utils/supabase/server'

export type TransactionFilter = {
  startDate?: string;
  endDate?: string;
  staffId?: string;
  type?: string;
}

export async function getTransactions(filters: TransactionFilter = {}) {
  const supabase = await createClient()

  // 1. Fetch Sales
  let salesQuery = supabase
    .from('sales')
    .select(`
      id, total_amount, sale_type, status, created_at, custom_sale_id,
      staff:users!sales_staff_id_fkey(full_name),
      customer:customers(name)
    `)
  
  if (filters.startDate) salesQuery = salesQuery.gte('created_at', filters.startDate)
  if (filters.endDate) salesQuery = salesQuery.lte('created_at', `${filters.endDate}T23:59:59`)
  if (filters.staffId) salesQuery = salesQuery.eq('staff_id', filters.staffId)
  
  const { data: sales } = await salesQuery.order('created_at', { ascending: false }).limit(50)

  // 2. Fetch Payments (Credit collection)
  let paymentsQuery = supabase
    .from('payments')
    .select(`
      id, amount, status, created_at, custom_payment_id,
      sale:sales!inner(staff_id, customer_id, users!sales_staff_id_fkey(full_name), customers(name))
    `)
  
  if (filters.startDate) paymentsQuery = paymentsQuery.gte('created_at', filters.startDate)
  if (filters.endDate) paymentsQuery = paymentsQuery.lte('created_at', `${filters.endDate}T23:59:59`)
  if (filters.staffId) paymentsQuery = paymentsQuery.eq('sale.staff_id', filters.staffId)

  const { data: payments } = await paymentsQuery.order('created_at', { ascending: false }).limit(50)

  // 3. Fetch Cash Submissions
  let submissionsQuery = supabase
    .from('cash_submissions')
    .select(`
      id, amount, submitted_amount, status, created_at,
      staff:users!cash_submissions_staff_id_fkey(full_name)
    `)
  
  if (filters.startDate) submissionsQuery = submissionsQuery.gte('created_at', filters.startDate)
  if (filters.endDate) submissionsQuery = submissionsQuery.lte('created_at', `${filters.endDate}T23:59:59`)
  if (filters.staffId) submissionsQuery = submissionsQuery.eq('staff_id', filters.staffId)

  const { data: submissions } = await submissionsQuery.order('created_at', { ascending: false }).limit(50)

  // 4. Fetch Distributions (Inventory Flow)
  let distQuery = supabase
    .from('distributions')
    .select(`
      id, quantity, created_at,
      staff:users!distributions_staff_id_fkey(full_name),
      item:items(name),
      agent:users!distributions_agent_id_fkey(full_name)
    `)
  
  if (filters.startDate) distQuery = distQuery.gte('created_at', filters.startDate)
  if (filters.endDate) distQuery = distQuery.lte('created_at', `${filters.endDate}T23:59:59`)
  if (filters.staffId) distQuery = distQuery.eq('staff_id', filters.staffId)

  const { data: dists } = await distQuery.order('created_at', { ascending: false }).limit(50)

  // Normalize Normalization
  const normalized = [
    ...(sales || []).map(s => ({
      id: s.id,
      displayId: s.custom_sale_id || `SALE-${s.id.substring(0,8).toUpperCase()}`,
      type: s.sale_type === 'cash' ? 'Cash Sale' : s.sale_type === 'credit' ? 'Credit Sale' : 'Free Gift',
      typeColor: s.sale_type === 'cash' 
        ? 'text-emerald-600 bg-emerald-50 border-emerald-200' 
        : s.sale_type === 'credit' 
        ? 'text-amber-600 bg-amber-50 border-amber-200'
        : 'text-indigo-600 bg-indigo-50 border-indigo-200 font-black',
      staffName: (s.staff as any)?.full_name || 'System',
      customerName: (s.customer as any)?.name || 'Walk-in',
      amount: Number(s.total_amount),
      isCurrency: true,
      status: s.status,
      date: new Date(s.created_at)
    })),
    ...(payments || []).map(p => ({
      id: p.id,
      displayId: p.custom_payment_id || `PAY-${p.id.substring(0,8).toUpperCase()}`,
      type: 'Debt Payment',
      typeColor: 'text-blue-600 bg-blue-50 border-blue-200',
      staffName: (p.sale as any)?.users?.full_name || 'System',
      customerName: (p.sale as any)?.customers?.name || 'Customer',
      amount: Number(p.amount),
      isCurrency: true,
      status: p.status,
      date: new Date(p.created_at)
    })),
    ...(submissions || []).map(sub => ({
      id: sub.id,
      displayId: `SUB-${sub.id.substring(0,8).toUpperCase()}`,
      type: 'Cash Submission',
      typeColor: 'text-purple-600 bg-purple-50 border-purple-200',
      staffName: (sub.staff as any)?.full_name || 'Staff Member',
      customerName: 'Accountant Depot',
      amount: Number(sub.submitted_amount ?? sub.amount ?? 0),
      isCurrency: true,
      status: sub.status,
      date: new Date(sub.created_at)
    })),
    ...(dists || []).map(d => ({
      id: d.id,
      displayId: `DIST-${d.id.substring(0,8).toUpperCase()}`,
      type: 'Stock Received',
      typeColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      staffName: (d.staff as any)?.full_name || 'Staff Member',
      customerName: `(From ${(d.agent as any)?.full_name || 'Admin'})`,
      amount: d.quantity, 
      isCurrency: false,
      status: 'completed',
      date: new Date(d.created_at)
    }))
  ]

  // Filter by type if requested
  let filtered = normalized
  if (filters.type) {
    filtered = normalized.filter(t => t.type.toLowerCase().includes(filters.type!.toLowerCase()))
  }

  return filtered.sort((a, b) => b.date.getTime() - a.date.getTime())
}
