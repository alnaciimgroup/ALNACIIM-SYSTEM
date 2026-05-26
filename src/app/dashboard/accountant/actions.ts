'use server'

// @ts-nocheck
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { verifySession } from '@/utils/auth'
import { getReportsSummary } from './reports/actions'
import { getWorkDate } from '@/utils/date-utils'
import { ReportsSummary } from '@/types/reports'

export async function getAccountantOverview(dateFilter?: string, customDate?: string) {
  await verifySession(['accountant'])
  const supabase = await createClient()

  let startDate: string | undefined
  let endDate: string | undefined

  const now = new Date()
  if (dateFilter === 'today') {
    startDate = now.toISOString().split('T')[0]
    endDate = startDate
  } else if (dateFilter === 'yesterday') {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    startDate = yesterday.toISOString().split('T')[0]
    endDate = startDate
  } else if (dateFilter === '7days') {
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    startDate = weekAgo.toISOString().split('T')[0]
    endDate = now.toISOString().split('T')[0]
  } else if (customDate) {
    startDate = customDate
    endDate = customDate
  }

  // 1. Fetch Core Metrics via Analytics Engine (Isolated and Explicitly Cast)
  const metrics = await getReportsSummary({ startDate, endDate }) as ReportsSummary
  
  const periodStart = startDate ? `${startDate}T00:00:00.000Z` : '2000-01-01T00:00:00.000Z'
  const periodEnd = endDate ? `${endDate}T23:59:59.999Z` : '2099-12-31T23:59:59.999Z'

  const [
    { data: periodDist },
    { data: periodSales },
    { data: periodPayments },
    { data: submissionsData },
    { data: recentDist },
    { data: recentSales },
    { data: staffPerformance },
    { data: allSubmissions }
  ] = await Promise.all([
    supabase.from('distributions').select('quantity, liters, staff_id, created_at').gte('created_at', periodStart).lte('created_at', periodEnd),
    supabase.from('sales').select('total_amount, discount_amount, sale_type, staff_id, created_at, sale_items(quantity, free_quantity), customer:customers(name, phone)').gte('created_at', periodStart).lte('created_at', periodEnd),
    supabase.from('payments').select('amount, created_at, sales!inner(staff_id)').gte('created_at', periodStart).lte('created_at', periodEnd),
    supabase.from('cash_submissions').select('id, amount, status, created_at').gte('created_at', periodStart).lte('created_at', periodEnd).order('created_at', { ascending: false }).limit(20),
    supabase.from('distributions').select('id, quantity, liters, created_at, staff_id').gte('created_at', periodStart).lte('created_at', periodEnd).order('created_at', { ascending: false }).limit(5),
    supabase.from('sales').select('id, total_amount, discount_amount, sale_type, created_at, staff_id').gte('created_at', periodStart).lte('created_at', periodEnd).order('created_at', { ascending: false }).limit(5),
    supabase.from('users').select('id, full_name, sales:sales(total_amount, created_at)').eq('role', 'staff'),
    supabase.from('cash_submissions').select('staff_id, submission_date, status')
  ])

  // 2. Performance & Activity Gating
  const verifiedDays = new Set((allSubmissions || [])
    .filter(s => s.status === 'verified')
    .map(s => `${s.staff_id}_${s.submission_date?.split('T')[0]}`))

  const isVerified = (staffId: string, createdAt: string) => {
    if (!staffId || !createdAt) return false
    try {
      const workDate = getWorkDate(createdAt)
      return verifiedDays.has(`${staffId}_${workDate}`)
    } catch (e) {
      return false
    }
  }

  // Destructure all metrics from the engine
  const { 
    totalDistributed, 
    auditedDistributed,
    totalSold, 
    auditedSold,
    remainingTanks: totalRemaining, 
    totalCollected,
    auditedCollected,
    totalCredit,
    auditedCredit,
    outstandingBalance,
    totalFreeTanks,
    auditedFreeTanks,
    totalSubmitted,
    totalDifference
  } = metrics

  // Period stats (aggregated distributions, sales, payments for the selected window)
  const distributedInPeriod = periodDist?.reduce((acc: number, curr) => acc + (curr.liters || curr.quantity), 0) || 0
  const soldInPeriod = periodSales?.reduce((acc: number, curr) => acc + ((curr.sale_items as any)?.reduce((a: number, i: any) => a + i.quantity, 0) || 0), 0) || 0
  const collectedInPeriod = periodPayments?.reduce((acc: number, curr) => acc + Number(curr.amount), 0) || 0
  const creditInPeriod = periodSales?.filter(s => s.sale_type === 'credit')?.reduce((acc: number, curr) => acc + Number(curr.total_amount), 0) || 0
  const freeInPeriod = periodSales?.filter(s => s.sale_type === 'free')?.reduce((acc: number, curr) => acc + ((curr.sale_items as any)?.reduce((a: number, i: any) => a + i.quantity, 0) || 0), 0) || 0
  const discountInPeriod = periodSales?.reduce((acc: number, curr) => acc + Number(curr.discount_amount || 0), 0) || 0
  const expectedInPeriod = collectedInPeriod + creditInPeriod

  console.log('DEBUG ACCOUNTANT:', { discountInPeriod, periodSales: JSON.stringify(periodSales) })

  const freeWaterDetails = periodSales
    ?.filter(s => {
      const isFreeSale = s.sale_type === 'free';
      const itemQty = s.sale_items?.reduce((a: number, i: any) => a + (isFreeSale ? i.quantity : 0) + (i.free_quantity || 0), 0) || 0;
      return itemQty > 0;
    })
    ?.map(s => {
      const isFreeSale = s.sale_type === 'free';
      const amount = s.sale_items?.reduce((a: number, i: any) => a + (isFreeSale ? i.quantity : 0) + (i.free_quantity || 0), 0) || 0;
      return {
        id: s.id,
        customerName: Array.isArray(s.customer) ? s.customer[0]?.name : s.customer?.name || 'Unknown',
        customerPhone: Array.isArray(s.customer) ? s.customer[0]?.phone : s.customer?.phone || '',
        amount,
        type: isFreeSale ? '100% Free' : 'Bonus Liters',
        time: s.created_at
      }
    }) || []

  const pendingCount = submissionsData?.filter(s => s.status === 'pending').length || 0
  const flaggedDiscrepancies = submissionsData?.filter(s => s.status === 'disputed') || []

  // Activity log should show verification status
  const recentActivity = [
    ...(recentDist?.map(d => ({ 
      type: 'distribution', 
      amount: d.liters || d.quantity, 
      date: d.created_at, 
      label: 'Liters Distributed',
      isVerified: isVerified(d.staff_id, d.created_at)
    })) || []),
    ...(recentSales?.map(s => ({ 
      type: 'sale', 
      amount: Number(s.total_amount), 
      discount: Number(s.discount_amount || 0),
      date: s.created_at, 
      label: `Sale (${s.sale_type})`,
      isVerified: isVerified(s.staff_id, s.created_at)
    })) || []),
    ...(submissionsData?.slice(0, 5).map(s => ({ 
      type: 'submission', 
      amount: Number(s.amount), 
      date: s.created_at, 
      label: 'Cash Submission',
      isVerified: s.status === 'verified'
    })) || [])
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

  // Top Staff based on AUDITED Revenue
  const topStaff = (staffPerformance || []).map(staff => {
    const verifiedSales = (staff.sales as any[])?.filter(s => isVerified(staff.id, s.created_at)) || []
    
    const periodVerifiedSales = startDate ? verifiedSales.filter(s => {
      const d = s.created_at.split('T')[0]
      return d >= startDate! && d <= endDate!
    }) : verifiedSales

    const revenue = periodVerifiedSales.reduce((acc: number, s) => acc + Number(s.total_amount), 0) || 0
    return {
      id: staff.id,
      name: staff.full_name,
      revenue
    }
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  return {
    metrics: {
      totalDistributed,
      auditedDistributed,
      totalSold,
      auditedSold,
      remainingTanks: totalRemaining,
      totalCollected,
      auditedCollected,
      totalCredit,
      auditedCredit,
      outstandingBalance,
      totalFreeTanks,
      auditedFreeTanks,
      totalSubmitted,
      totalDifference,
      freeWaterDetails,
      pendingReviews: pendingCount
    },
    todayStats: {
      distributedToday: metrics.totalDistributed, 
      soldToday: metrics.totalSold,
      collectedToday: collectedInPeriod,
      creditToday: creditInPeriod,
      freeToday: freeInPeriod,
      expectedToday: expectedInPeriod,
      discountsToday: discountInPeriod
    },
    topStaff,
    recentActivity,
    latestSubmissions: submissionsData?.slice(0, 5) || [],
    flaggedDiscrepancies: flaggedDiscrepancies.slice(0, 5)
  }
}

export async function getAtRiskCustomers() {
  await verifySession(['accountant'])
  const supabase = await createClient()

  // Fetch ALL customers across the company, including their staff owner
  const { data: allCustomersRaw, error } = await supabase
    .from('customers')
    .select('id, name, phone, address, guarantor, guarantor_phone, debt, customer_type, sales(created_at), staff:users!customers_staff_id_fkey(full_name)')

  if (error) {
    console.error('Error fetching all customers for accountant:', error)
    return []
  }

  const now = new Date()
  const inactiveCustomersAlerts = (allCustomersRaw || [])
    .map(c => {
      let daysInactive = 0
      let lastRefillDate = null
      
      if (c.sales && c.sales.length > 0) {
        const sortedSales = c.sales.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        lastRefillDate = sortedSales[0].created_at
        const diffTime = Math.abs(now.getTime() - new Date(lastRefillDate).getTime())
        daysInactive = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      } else {
        return null // Ignore customers with zero lifetime sales for now
      }
      
      return { 
        id: c.id, 
        name: c.name, 
        phone: c.phone, 
        address: c.address,
        guarantor: c.guarantor,
        guarantor_phone: c.guarantor_phone,
        debt: c.debt,
        customer_type: c.customer_type, 
        daysInactive, 
        lastRefillDate,
        staff_name: (c.staff as any)?.full_name || 'Unknown'
      }
    })
    .filter(c => {
      if (!c) return false;
      if (c.customer_type === 'irregular') {
        return c.daysInactive >= 90;
      }
      return c.daysInactive > 10;
    })
    .sort((a: any, b: any) => b.daysInactive - a.daysInactive)

  return inactiveCustomersAlerts
}
