'use server'

import { createClient } from '@/utils/supabase/server'
import { verifySession } from '@/utils/auth'

export async function generateFinancialExport(range: string, custom?: { start: string, end: string }) {
  await verifySession(['accountant'])
  const supabase = await createClient()

  let startDate: string | null = null
  let endDate: string | null = null

  const now = new Date()
  if (range === 'today') {
    startDate = now.toISOString().split('T')[0]
    endDate = startDate
  } else if (range === 'this_week') {
    const sunday = new Date(now)
    sunday.setDate(now.getDate() - now.getDay())
    startDate = sunday.toISOString().split('T')[0]
    endDate = now.toISOString().split('T')[0]
  } else if (range === '7days') {
    const weekAgo = new Date(now)
    weekAgo.setDate(now.getDate() - 7)
    startDate = weekAgo.toISOString().split('T')[0]
    endDate = now.toISOString().split('T')[0]
  } else if (range === 'this_month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    endDate = now.toISOString().split('T')[0]
  } else if (range === 'last_month') {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    startDate = lastMonth.toISOString().split('T')[0]
    endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
  } else if (range === 'custom' && custom) {
    startDate = custom.start
    endDate = custom.end
  }

  const startStr = startDate ? `${startDate}T00:00:00.000Z` : '2000-01-01T00:00:00.000Z'
  const endStr = endDate ? `${endDate}T23:59:59.999Z` : '2099-12-31T23:59:59.999Z'

  // Fetch all 4 data types
  const [
    { data: sales, error: salesError },
    { data: payments, error: paymentsError },
    { data: submissions, error: submissionsError },
    { data: distributions, error: distributionsError }
  ] = await Promise.all([
    supabase
      .from('sales')
      .select('id, created_at, sale_type, total_amount, staff:users!sales_staff_id_fkey(full_name), customer:customers(name), sale_items(quantity)')
      .gte('created_at', startStr)
      .lte('created_at', endStr)
      .order('created_at', { ascending: false }),
    supabase
      .from('payments')
      .select('id, created_at, amount, payment_method, sales!inner(staff:users!sales_staff_id_fkey(full_name), customer:customers(name))')
      .gte('created_at', startStr)
      .lte('created_at', endStr)
      .order('created_at', { ascending: false }),
    supabase
      .from('cash_submissions')
      .select('id, created_at, submission_date, submitted_amount, money_collected, difference_amount, status, staff:users(full_name), note')
      .gte('created_at', startStr)
      .lte('created_at', endStr)
      .order('created_at', { ascending: false }),
    supabase
      .from('distributions')
      .select('id, created_at, quantity, status, agent:users!agent_id_fkey(full_name), staff:users!staff_id_fkey(full_name)')
      .gte('created_at', startStr)
      .lte('created_at', endStr)
      .order('created_at', { ascending: false })
  ])

  if (salesError || paymentsError || submissionsError || distributionsError) {
    console.error('Export Fetch Error:', { salesError, paymentsError, submissionsError, distributionsError })
    throw new Error('Failed to fetch export data')
  }

  // Normalize into shared CSV records
  const records: any[] = []

  // 1. Process Sales
  sales?.forEach(s => {
    records.push({
      Date: new Date(s.created_at).toLocaleString(),
      Type: `Sale-${s.sale_type?.toUpperCase()}`,
      Staff: s.staff?.full_name || 'N/A',
      Customer: s.customer?.name || 'N/A',
      Quantity: s.sale_items?.reduce((acc: number, i: any) => acc + (i.quantity || 0), 0) || 0,
      Amount: s.total_amount || 0,
      Status: 'Completed',
      ID: s.id.slice(0, 8),
      Note: ''
    })
  })

  // 2. Process Payments (Repayments)
  payments?.forEach(p => {
    records.push({
      Date: new Date(p.created_at).toLocaleString(),
      Type: `Payment-${p.payment_method?.toUpperCase()}`,
      Staff: p.sales?.staff?.full_name || 'N/A',
      Customer: p.sales?.customer?.name || 'N/A',
      Quantity: '-',
      Amount: p.amount || 0,
      Status: 'Recorded',
      ID: p.id.slice(0, 8),
      Note: ''
    })
  })

  // 3. Process Submissions
  submissions?.forEach(s => {
    records.push({
      Date: new Date(s.created_at).toLocaleString(),
      Type: 'Cash-Submission',
      Staff: s.staff?.full_name || 'N/A',
      Customer: '-',
      Quantity: '-',
      Amount: s.submitted_amount || 0,
      Status: s.status?.toUpperCase(),
      ID: s.id.slice(0, 8),
      Note: `Collected: ${s.money_collected}, Diff: ${s.difference_amount}. ${s.note || ''}`
    })
  })

  // 4. Process Distributions
  distributions?.forEach(d => {
    records.push({
      Date: new Date(d.created_at).toLocaleString(),
      Type: 'Distribution',
      Staff: d.staff?.full_name || 'N/A',
      Customer: `Agent: ${d.agent?.full_name || 'N/A'}`,
      Quantity: d.quantity || 0,
      Amount: '-',
      Status: d.status?.toUpperCase(),
      ID: d.id.slice(0, 8),
      Note: ''
    })
  })

  // Sort by Date
  records.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())

  // Generate CSV String
  const headers = ['Date', 'Type', 'Staff Member', 'Customer/Agent', 'Volume (Tanks)', 'Amount (USD)', 'Status', 'Reference ID', 'Note']
  const csvRows = [
    headers.join(','),
    ...records.map(r => [
      `"${r.Date}"`,
      `"${r.Type}"`,
      `"${r.Staff}"`,
      `"${r.Customer}"`,
      r.Quantity,
      r.Amount,
      `"${r.Status}"`,
      `"${r.ID}"`,
      `"${(r.Note || '').replace(/"/g, '""')}"`
    ].join(','))
  ]

  return csvRows.join('\n')
}
