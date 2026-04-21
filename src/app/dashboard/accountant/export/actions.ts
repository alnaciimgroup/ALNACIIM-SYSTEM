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

export type ExportResult = {
  datasets: DatasetResult[]
  metadata: {
    startDate: string
    endDate: string
    range: string
  }
}

export async function generateUniversalExport(range: string, custom?: { start: string, end: string }): Promise<ExportResult> {
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
  } else if (range === 'all') {
    startDate = '2024-01-01'
    endDate = now.toISOString().split('T')[0]
  }

  // Somalia Work-Day Window Logic (4 AM Rollover)
  const startUTC = startDate ? `${startDate}T01:00:00.000Z` : '2000-01-01T00:00:00.000Z'
  
  let endUTC = '2099-12-31T23:59:59.999Z'
  if (endDate) {
    const nextDay = new Date(endDate)
    nextDay.setDate(nextDay.getDate() + 1)
    endUTC = `${nextDay.toISOString().split('T')[0]}T00:59:59.999Z`
  }

  try {
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

    const [
      { data: users },
      { data: customers },
      { data: items }
    ] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('items').select('*')
    ])

    const userMap = new Map(users?.map(u => [u.id, u.full_name]))
    const customerMap = new Map(customers?.map(c => [c.id, c.name]))
    const itemMap = new Map(items?.map(i => [i.id, i.name]))
    
    const salesQtyMap = new Map<string, number>()
    rawSaleItems?.forEach(si => {
      salesQtyMap.set(si.sale_id, (salesQtyMap.get(si.sale_id) || 0) + (si.quantity || 0))
    })

    const toCsvRow = (arr: any[]) => arr.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')
    const fmtCurrency = (val: any) => `$${Number(val || 0).toFixed(2)}`
    
    // Professional ISO-like format: YYYY-MM-DD HH:mm
    const fmtDate = (val: any) => {
      if (!val) return '-'
      const d = new Date(val)
      const Y = d.getFullYear()
      const M = String(d.getMonth() + 1).padStart(2, '0')
      const D = String(d.getDate()).padStart(2, '0')
      const H = String(d.getHours()).padStart(2, '0')
      const m = String(d.getMinutes()).padStart(2, '0')
      return `${Y}-${M}-${D} ${H}:${m}`
    }

    const datasets: DatasetResult[] = []

    // -------------------------------------------------------------------------
    // TRANSACTIONS
    // -------------------------------------------------------------------------
    
    // A. Sales Summary
    const salesH = ['Date', 'Sale ID', 'Customer', 'Staff', 'Type', 'Amount', 'Tanks', 'Status']
    const salesR = (rawSales || []).map(s => toCsvRow([
      fmtDate(s.created_at),
      s.id, // Full ID
      customerMap.get(s.customer_id) || 'N/A',
      userMap.get(s.staff_id) || 'N/A',
      s.sale_type?.toUpperCase(),
      fmtCurrency(s.total_amount),
      salesQtyMap.get(s.id) || 0,
      s.status?.toUpperCase()
    ]))
    datasets.push({ id: 'sales_summary', label: 'Sales Summary', category: 'Transactions', count: salesR.length, csvContent: [salesH.join(','), ...salesR].join('\n') })

    // B. Sale Item Details
    const saleItemsH = ['Date', 'Sale Ref', 'Item Name', 'Quantity', 'Unit Price', 'Total', 'Customer', 'Staff']
    const saleItemsR = (rawSaleItems || [])
      .filter(si => rawSales?.some(s => s.id === si.sale_id))
      .map(si => {
        const sale = rawSales?.find(s => s.id === si.sale_id)
        return toCsvRow([
          fmtDate(sale?.created_at),
          si.sale_id, // Full ID
          itemMap.get(si.item_id) || 'Unknown',
          si.quantity,
          fmtCurrency(si.unit_price),
          fmtCurrency(Number(si.quantity || 0) * Number(si.unit_price || 0)),
          customerMap.get(sale?.customer_id || '') || 'N/A',
          userMap.get(sale?.staff_id || '') || 'N/A'
        ])
      })
    datasets.push({ id: 'sale_item_details', label: 'Sale Item Details', category: 'Transactions', count: saleItemsR.length, csvContent: [saleItemsH.join(','), ...saleItemsR].join('\n') })

    // C. Payments
    const payH = ['Date', 'Payment ID', 'Sale Ref', 'Staff', 'Method', 'Amount']
    const payR = (rawPayments || []).map(p => {
      const sale = rawSales?.find(s => s.id === p.sale_id)
      return toCsvRow([
        fmtDate(p.created_at),
        p.id, // Full ID
        sale ? sale.id : 'DEBT-REPAY',
        userMap.get(sale?.staff_id || '') || 'N/A',
        p.payment_method?.toUpperCase(),
        fmtCurrency(p.amount)
      ])
    })
    datasets.push({ id: 'payments', label: 'Payments Registry', category: 'Transactions', count: payR.length, csvContent: [payH.join(','), ...payR].join('\n') })

    // D. Cash Submissions
    const subH = ['Report Date', 'Staff', 'Expected', 'Submitted', 'Difference', 'Status', 'Note', 'ID']
    const subR = (rawSubmissions || []).map(s => toCsvRow([
      s.submission_date,
      userMap.get(s.staff_id) || 'N/A',
      fmtCurrency(s.money_collected),
      fmtCurrency(s.submitted_amount),
      fmtCurrency(s.difference_amount),
      s.status?.toUpperCase(),
      s.note,
      s.id // Full ID
    ]))
    datasets.push({ id: 'submissions', label: 'Staff Cash Submissions', category: 'Transactions', count: subR.length, csvContent: [subH.join(','), ...subR].join('\n') })

    // E. Distributions
    const distH = ['Date', 'Agent (Source)', 'Staff (Recipient)', 'Quantity', 'Status', 'ID']
    const distR = (rawDistributions || []).map(d => toCsvRow([
      fmtDate(d.created_at),
      userMap.get(d.agent_id) || 'N/A',
      userMap.get(d.staff_id) || 'N/A',
      d.quantity,
      d.status?.toUpperCase(),
      d.id // Full ID
    ]))
    datasets.push({ id: 'distributions', label: 'Inventory Movements', category: 'Transactions', count: distR.length, csvContent: [distH.join(','), ...distR].join('\n') })

    // -------------------------------------------------------------------------
    // REGISTRY
    // -------------------------------------------------------------------------
    
    // F. Customers
    const custH = ['ID', 'Name', 'Phone', 'Address', 'Debt', 'Joined']
    const custR = (customers || []).map(c => toCsvRow([c.id, c.name, c.phone, c.address, fmtCurrency(c.debt), fmtDate(c.created_at)]))
    datasets.push({ id: 'customer_registry', label: 'Customer Registry', category: 'Registry', count: custR.length, csvContent: [custH.join(','), ...custR].join('\n') })

    // G. Users
    const userH = ['ID', 'Name', 'Role', 'Status', 'Email']
    const userR = (users || []).map(u => toCsvRow([u.id, u.full_name, u.role?.toUpperCase(), u.status || 'ACTIVE', u.email]))
    datasets.push({ id: 'user_registry', label: 'User Registry', category: 'Registry', count: userR.length, csvContent: [userH.join(','), ...userR].join('\n') })

    // H. Items
    const itemH = ['ID', 'Name', 'Low Level', 'Created']
    const itemR = (items || []).map(i => toCsvRow([i.id, i.name, i.low_stock_threshold, fmtDate(i.created_at)]))
    datasets.push({ id: 'product_catalog', label: 'Product Catalog', category: 'Registry', count: itemR.length, csvContent: [itemH.join(','), ...itemR].join('\n') })

    return {
      datasets,
      metadata: {
        startDate: startDate || 'start',
        endDate: endDate || 'end',
        range
      }
    }

  } catch (error: any) {
    console.error('EXPORT FATAL FAILURE:', error)
    throw new Error(error.message || 'System error during generation')
  }
}
