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

  try {
    // 1. Fetch RAW records (No complex joins)
    const [
      { data: rawSales, error: salesError },
      { data: rawPayments, error: paymentsError },
      { data: rawSubmissions, error: submissionsError },
      { data: rawDistributions, error: distributionsError },
      { data: rawSaleItems, error: itemsError }
    ] = await Promise.all([
      supabase.from('sales').select('*').gte('created_at', startStr).lte('created_at', endStr),
      supabase.from('payments').select('*').gte('created_at', startStr).lte('created_at', endStr),
      supabase.from('cash_submissions').select('*').gte('created_at', startStr).lte('created_at', endStr),
      supabase.from('distributions').select('*').gte('created_at', startStr).lte('created_at', endStr),
      supabase.from('sale_items').select('sale_id, quantity')
    ])

    if (salesError || paymentsError || submissionsError || distributionsError || itemsError) {
      console.error('Export Fetch Error:', { salesError, paymentsError, submissionsError, distributionsError, itemsError })
      throw new Error('Database Error: Failed to retrieve data for export')
    }

    // 2. Fetch Lookup Tables (Users & Customers)
    const [
      { data: users },
      { data: customers }
    ] = await Promise.all([
      supabase.from('users').select('id, full_name'),
      supabase.from('customers').select('id, name')
    ])

    const userMap = new Map(users?.map(u => [u.id, u.full_name]))
    const customerMap = new Map(customers?.map(c => [c.id, c.name]))
    const itemQtyMap = new Map<string, number>()
    rawSaleItems?.forEach(si => {
      itemQtyMap.set(si.sale_id, (itemQtyMap.get(si.sale_id) || 0) + (si.quantity || 0))
    })

    // Utility: Helper to build CSV line
    const toCsvRow = (arr: any[]) => arr.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')

    // -------------------------------------------------------------------------
    // 3. Generate SALES CSV
    // -------------------------------------------------------------------------
    const salesHeader = ['Date', 'Sale ID', 'Customer', 'Staff Member', 'Type', 'Total Amount (USD)', 'Volume (Tanks)', 'Status']
    const salesRows = (rawSales || []).map(s => toCsvRow([
      new Date(s.created_at).toLocaleString(),
      s.id.slice(0, 8),
      customerMap.get(s.customer_id) || 'N/A',
      userMap.get(s.staff_id) || 'N/A',
      s.sale_type?.toUpperCase(),
      s.total_amount,
      itemQtyMap.get(s.id) || 0,
      s.status?.toUpperCase()
    ]))
    const salesCsv = [salesHeader.join(','), ...salesRows].join('\n')

    // -------------------------------------------------------------------------
    // 4. Generate PAYMENTS CSV
    // -------------------------------------------------------------------------
    const paymentsHeader = ['Date', 'Payment ID', 'Sale Ref', 'Staff Member', 'Method', 'Amount (USD)']
    const paymentsRows = (rawPayments || []).map(p => {
      const sale = rawSales?.find(s => s.id === p.sale_id)
      return toCsvRow([
        new Date(p.created_at).toLocaleString(),
        p.id.slice(0, 8),
        sale ? sale.id.slice(0, 8) : 'Direct',
        userMap.get(sale?.staff_id || '') || 'N/A',
        p.payment_method?.toUpperCase(),
        p.amount
      ])
    })
    const paymentsCsv = [paymentsHeader.join(','), ...paymentsRows].join('\n')

    // -------------------------------------------------------------------------
    // 5. Generate SUBMISSIONS CSV
    // -------------------------------------------------------------------------
    const subHeader = ['Report Date', 'Staff Member', 'Collected (Expect)', 'Submitted (Actual)', 'Difference', 'Status', 'Note', 'Submission ID']
    const subRows = (rawSubmissions || []).map(s => toCsvRow([
      s.submission_date,
      userMap.get(s.staff_id) || 'N/A',
      s.money_collected,
      s.submitted_amount,
      s.difference_amount,
      s.status?.toUpperCase(),
      s.note,
      s.id.slice(0, 8)
    ]))
    const submissionsCsv = [subHeader.join(','), ...subRows].join('\n')

    // -------------------------------------------------------------------------
    // 6. Generate DISTRIBUTIONS CSV
    // -------------------------------------------------------------------------
    const distHeader = ['Date', 'Agent (Source)', 'Staff (Recipient)', 'Quantity (Tanks)', 'Status', 'Dist ID']
    const distRows = (rawDistributions || []).map(d => toCsvRow([
      new Date(d.created_at).toLocaleString(),
      userMap.get(d.agent_id) || 'N/A',
      userMap.get(d.staff_id) || 'N/A',
      d.quantity,
      d.status?.toUpperCase(),
      d.id.slice(0, 8)
    ]))
    const distributionsCsv = [distHeader.join(','), ...distRows].join('\n')

    // -------------------------------------------------------------------------
    // 7. Generate COMBINED LEDGER (Summary)
    // -------------------------------------------------------------------------
    const ledgerHeader = ['Date', 'Type', 'Entity', 'Staff Member', 'Amount/Qty', 'Status', 'Ref ID']
    const ledgerRecords: any[] = []

    rawSales?.forEach(s => ledgerRecords.push([new Date(s.created_at), 'SALE', customerMap.get(s.customer_id), userMap.get(s.staff_id), `$${s.total_amount}`, 'COMPLETED', s.id.slice(0,8)]))
    rawPayments?.forEach(p => ledgerRecords.push([new Date(p.created_at), 'PAYMENT', 'REPAYMENT', '-', `$${p.amount}`, 'RECORDED', p.id.slice(0,8)]))
    rawSubmissions?.forEach(s => ledgerRecords.push([new Date(s.created_at), 'SUBMISSION', '-', userMap.get(s.staff_id), `$${s.submitted_amount}`, s.status?.toUpperCase(), s.id.slice(0,8)]))
    rawDistributions?.forEach(d => ledgerRecords.push([new Date(d.created_at), 'DISTRIBUTION', userMap.get(d.agent_id), userMap.get(d.staff_id), d.quantity, d.status?.toUpperCase(), d.id.slice(0,8)]))

    ledgerRecords.sort((a,b) => b[0].getTime() - a[0].getTime())
    const ledgerRows = ledgerRecords.map(r => toCsvRow([r[0].toLocaleString(), r[1], r[2], r[3], r[4], r[5], r[6]]))
    const ledgerCsv = [ledgerHeader.join(','), ...ledgerRows].join('\n')

    return {
      sales: salesCsv,
      payments: paymentsCsv,
      submissions: submissionsCsv,
      distributions: distributionsCsv,
      ledger: ledgerCsv
    }

  } catch (error: any) {
    console.error('EXPORT FATAL FAILURE:', error)
    throw new Error(error.message || 'System Error during data export')
  }
}
