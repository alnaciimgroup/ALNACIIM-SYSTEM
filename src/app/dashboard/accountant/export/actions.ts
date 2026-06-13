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

async function fetchAllPages<T>(
  fetchFn: (from: number, to: number) => Promise<{ data: T[] | null; error: any }>
): Promise<T[]> {
  let allData: T[] = []
  let from = 0
  const pageSize = 1000
  let hasMore = true

  while (hasMore) {
    const { data, error } = await fetchFn(from, from + pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) {
      hasMore = false
    } else {
      allData.push(...data)
      if (data.length < pageSize) {
        hasMore = false
      } else {
        from += pageSize
      }
    }
  }
  return allData
}

export async function generateUniversalExport(range: string, custom?: { start: string, end: string }): Promise<ExportResult> {
  await verifySession(['accountant'])
  const supabase = await createClient()

  let startDate: string | null = null
  let endDate: string | null = null

  // Get current time in Somalia timezone (UTC+3)
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
  } else if (range === '7days') {
    const weekAgo = new Date(nowSomalia)
    weekAgo.setUTCDate(nowSomalia.getUTCDate() - 7)
    startDate = fmtYMD(weekAgo)
    endDate = fmtYMD(nowSomalia)
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

  // Somalia Work-Day Window Logic (4 AM Rollover)
  const startUTC = startDate ? `${startDate}T01:00:00.000Z` : '2000-01-01T00:00:00.000Z'
  
  let endUTC = '2099-12-31T23:59:59.999Z'
  if (endDate) {
    const parts = endDate.split('-').map(Number)
    const endOffset = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]))
    endOffset.setUTCDate(endOffset.getUTCDate() + 1)
    endUTC = `${fmtYMD(endOffset)}T00:59:59.999Z`
  }

  try {
    const [
      rawSales,
      rawPayments,
      rawSubmissions,
      rawDistributions
    ] = await Promise.all([
      fetchAllPages(async (from, to) => 
        supabase.from('sales').select('*').gte('created_at', startUTC).lte('created_at', endUTC).range(from, to)
      ),
      fetchAllPages(async (from, to) => 
        supabase.from('payments').select('*').gte('created_at', startUTC).lte('created_at', endUTC).range(from, to)
      ),
      fetchAllPages(async (from, to) => 
        supabase.from('cash_submissions').select('*').gte('created_at', startUTC).lte('created_at', endUTC).range(from, to)
      ),
      fetchAllPages(async (from, to) => 
        supabase.from('distributions').select('*').gte('created_at', startUTC).lte('created_at', endUTC).range(from, to)
      )
    ])

    // Parallel chunked fetch of sale_items matching only the loaded sales
    const saleIds = rawSales.map(s => s.id)
    const rawSaleItems: any[] = []
    const batchSize = 500

    if (saleIds.length > 0) {
      const promises: Promise<any[]>[] = []
      for (let i = 0; i < saleIds.length; i += batchSize) {
        const batchIds = saleIds.slice(i, i + batchSize)
        promises.push(
          fetchAllPages(async (from, to) => 
            supabase.from('sale_items')
              .select('*')
              .in('sale_id', batchIds)
              .range(from, to)
          )
        )
      }
      const batchResults = await Promise.all(promises)
      rawSaleItems.push(...batchResults.flat())
    }

    const [
      users,
      customers,
      items
    ] = await Promise.all([
      fetchAllPages(async (from, to) => 
        supabase.from('users').select('*').range(from, to)
      ),
      fetchAllPages(async (from, to) => 
        supabase.from('customers').select('*').range(from, to)
      ),
      fetchAllPages(async (from, to) => 
        supabase.from('items').select('*').range(from, to)
      )
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
    const salesH = ['Date', 'Sale ID', 'Customer', 'Staff', 'Type', 'Amount', 'Liters', 'Status']
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
    const saleItemsH = ['Date', 'Sale Ref', 'Item Name', 'Paid Qty', 'Bonus Qty', 'Total Units', 'Unit Price', 'Total ($)', 'Customer', 'Staff']
    const saleItemsR = (rawSaleItems || [])
      .filter(si => rawSales?.some(s => s.id === si.sale_id))
      .map(si => {
        const sale = rawSales?.find(s => s.id === si.sale_id)
        const paid = Number(si.quantity || 0)
        const bonus = Number(si.free_quantity || 0)
        return toCsvRow([
          fmtDate(sale?.created_at),
          si.sale_id, // Full ID
          itemMap.get(si.item_id) || 'Unknown',
          paid,
          bonus,
          paid + bonus,
          fmtCurrency(si.unit_price),
          fmtCurrency(paid * Number(si.unit_price || 0)),
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
    const itemH = ['ID', 'Name', 'Created']
    const itemR = (items || []).map(i => toCsvRow([i.id, i.name, fmtDate(i.created_at)]))
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
