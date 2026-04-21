'use server'

import { createClient } from '@/utils/supabase/server'
import { verifySession } from '@/utils/auth'

export type DatasetResult = {
  id: string
  label: string
  category: 'Transactions' | 'Registry'
  count: number
  csvContent: string
}

export async function generateUniversalExport(range: string, custom?: { start: string, end: string }) {
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

  // Somalia Work-Day Window Logic (4 AM Rollover)
  // Work Day 'D' starts at D 01:00:00 UTC and ends at (D+1) 00:59:59 UTC
  const startUTC = startDate ? `${startDate}T01:00:00.000Z` : '2000-01-01T00:00:00.000Z'
  
  let endUTC = '2099-12-31T23:59:59.999Z'
  if (endDate) {
    const nextDay = new Date(endDate)
    nextDay.setDate(nextDay.getDate() + 1)
    endUTC = `${nextDay.toISOString().split('T')[0]}T00:59:59.999Z`
  }

  try {
    // 1. Fetch All Raw Transactional Data
    const [
      { data: rawSales },
      { data: rawPayments },
      { data: rawSubmissions },
      { data: rawDistributions },
      { data: rawSaleItems }
    ] = await Promise.all([
      supabase.from('sales').select('*').gte('created_at', startUTC).lte('created_at', endUTC),
      supabase.from('payments').select('*').gte('created_at', startUTC).lte('created_at', endUTC),
      supabase.from('cash_submissions').select('*').gte('created_at', startUTC).lte('created_at', endUTC),
      supabase.from('distributions').select('*').gte('created_at', startUTC).lte('created_at', endUTC),
      supabase.from('sale_items').select('*')
    ])

    // 2. Fetch All Master/Registry Data
    const [
      { data: users },
      { data: customers },
      { data: items }
    ] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('items').select('*')
    ])

    // 3. Build Lookup Maps
    const userMap = new Map(users?.map(u => [u.id, u.full_name]))
    const customerMap = new Map(customers?.map(c => [c.id, c.name]))
    const itemMap = new Map(items?.map(i => [i.id, i.name]))
    
    // Quantity aggregation for sales summary
    const salesQtyMap = new Map<string, number>()
    rawSaleItems?.forEach(si => {
      salesQtyMap.set(si.sale_id, (salesQtyMap.get(si.sale_id) || 0) + (si.quantity || 0))
    })

    const toCsvRow = (arr: any[]) => arr.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')

    const results: DatasetResult[] = []

    // -------------------------------------------------------------------------
    // CATEGORY: TRANSACTIONS
    // -------------------------------------------------------------------------

    // A. Sales Summary
    const salesHeader = ['Date (Local)', 'Sale ID', 'Customer', 'Staff Member', 'Type', 'Total Amount', 'Total Qty', 'Status']
    const salesRows = (rawSales || []).map(s => toCsvRow([
      new Date(s.created_at).toLocaleString(),
      s.id.slice(0, 8),
      customerMap.get(s.customer_id) || 'N/A',
      userMap.get(s.staff_id) || 'N/A',
      s.sale_type?.toUpperCase(),
      s.total_amount,
      salesQtyMap.get(s.id) || 0,
      s.status?.toUpperCase()
    ]))
    results.push({
      id: 'sales_summary',
      label: 'Sales Summary',
      category: 'Transactions',
      count: salesRows.length,
      csvContent: [salesHeader.join(','), ...salesRows].join('\n')
    })

    // B. Detailed Sale Items
    const saleItemsHeader = ['Date', 'Sale Ref', 'Item Name', 'Quantity', 'Unit Price', 'Customer', 'Staff']
    const saleItemsRows = (rawSaleItems || [])
      .filter(si => rawSales?.some(s => s.id === si.sale_id))
      .map(si => {
        const sale = rawSales?.find(s => s.id === si.sale_id)
        return toCsvRow([
          sale ? new Date(sale.created_at).toLocaleString() : '-',
          si.sale_id.slice(0, 8),
          itemMap.get(si.item_id) || 'Unknown Item',
          si.quantity,
          si.unit_price,
          customerMap.get(sale?.customer_id || '') || 'N/A',
          userMap.get(sale?.staff_id || '') || 'N/A'
        ])
      })
    results.push({
      id: 'sale_item_details',
      label: 'Sale Item Details',
      category: 'Transactions',
      count: saleItemsRows.length,
      csvContent: [saleItemsHeader.join(','), ...saleItemsRows].join('\n')
    })

    // C. Payment Registry
    const paymentsHeader = ['Date', 'Payment ID', 'Sale Ref', 'Staff Member', 'Method', 'Amount (USD)']
    const paymentsRows = (rawPayments || []).map(p => {
      const sale = rawSales?.find(s => s.id === p.sale_id)
      return toCsvRow([
        new Date(p.created_at).toLocaleString(),
        p.id.slice(0, 8),
        sale ? sale.id.slice(0, 8) : 'Direct/Credit',
        userMap.get(sale?.staff_id || '') || 'N/A',
        p.payment_method?.toUpperCase(),
        p.amount
      ])
    })
    results.push({
      id: 'payments',
      label: 'Payments Received',
      category: 'Transactions',
      count: paymentsRows.length,
      csvContent: [paymentsHeader.join(','), ...paymentsRows].join('\n')
    })

    // D. Cash Submissions
    const subHeader = ['Report Date', 'Staff Member', 'Expected Collections', 'Actual Submitted', 'Difference', 'Status', 'Note', 'ID']
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
    results.push({
      id: 'submissions',
      label: 'Staff Cash Submissions',
      category: 'Transactions',
      count: subRows.length,
      csvContent: [subHeader.join(','), ...subRows].join('\n')
    })

    // E. Inventory Movements
    const distHeader = ['Date', 'Agent (Source)', 'Staff (Recipient)', 'Quantity', 'Status', 'ID']
    const distRows = (rawDistributions || []).map(d => toCsvRow([
      new Date(d.created_at).toLocaleString(),
      userMap.get(d.agent_id) || 'N/A',
      userMap.get(d.staff_id) || 'N/A',
      d.quantity,
      d.status?.toUpperCase(),
      d.id.slice(0, 8)
    ]))
    results.push({
      id: 'distributions',
      label: 'Inventory Distributions',
      category: 'Transactions',
      count: distRows.length,
      csvContent: [distHeader.join(','), ...distRows].join('\n')
    })

    // -------------------------------------------------------------------------
    // CATEGORY: REGISTRY (MASTER DATA)
    // -------------------------------------------------------------------------

    // F. Customer Registry
    const customerHeader = ['ID', 'Name', 'Phone', 'Address', 'Current Debt', 'Created At']
    const customerRows = (customers || []).map(c => toCsvRow([
      c.id.slice(0, 8),
      c.name,
      c.phone,
      c.address,
      c.debt,
      new Date(c.created_at).toLocaleDateString()
    ]))
    results.push({
      id: 'customer_registry',
      label: 'Customer Registry',
      category: 'Registry',
      count: customerRows.length,
      csvContent: [customerHeader.join(','), ...customerRows].join('\n')
    })

    // G. User Registry
    const userHeader = ['ID', 'Full Name', 'Role', 'Status', 'Email']
    const userRows = (users || []).map(u => toCsvRow([
      u.id.slice(0, 8),
      u.full_name,
      u.role?.toUpperCase(),
      u.status || 'ACTIVE',
      u.email || '-'
    ]))
    results.push({
      id: 'user_registry',
      label: 'Staff & Agent Registry',
      category: 'Registry',
      count: userRows.length,
      csvContent: [userHeader.join(','), ...userRows].join('\n')
    })

    // H. Product Catalog
    const itemHeader = ['ID', 'Name', 'Description', 'Current Stock', 'Alert Level']
    const itemRows = (items || []).map(i => toCsvRow([
      i.id.slice(0, 8),
      i.name,
      i.description || '-',
      i.stock_quantity || 0,
      i.low_stock_threshold || 10
    ]))
    results.push({
      id: 'product_catalog',
      label: 'System Product Catalog',
      category: 'Registry',
      count: itemRows.length,
      csvContent: [itemHeader.join(','), ...itemRows].join('\n')
    })

    return results

  } catch (error: any) {
    console.error('FATAL EXPORT FAILURE:', error)
    throw new Error(error.message || 'System error during generation')
  }
}
