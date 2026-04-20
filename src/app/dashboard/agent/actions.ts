'use server'

// @ts-nocheck
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { verifySession } from '@/utils/auth'
import { DistributionSchema } from '@/utils/validation'
import { logAction } from '@/utils/audit'

export async function submitDistribution(prevState: any, formData: FormData) {
  const { user } = await verifySession(['agent'])
  const supabase = await createClient()

  const rawData = {
    staff_id: formData.get('staff_id') as string,
    quantity: parseInt(formData.get('quantity') as string),
    free_quantity: parseInt(formData.get('free_quantity') as string) || 0,
    zone: formData.get('zone') as string,
    item_id: '' // Will be resolved
  }

  // Auto-resolve item_id since UI only distributes "Tanks"
  // SELF-HEALING: If no items exist (due to a wipe), create a default one automatically
  let { data: items } = await supabase.from('items').select('id').limit(1)
  let defaultItemId = items?.[0]?.id

  if (!defaultItemId) {
    // System was wiped, create a default "Standard Tank" to maintain functionality
    const { data: newItem, error: createError } = await supabase
      .from('items')
      .insert({ name: 'Standard Water Tank', current_price: 5.00 })
      .select('id')
      .single()
    
    if (createError || !newItem) {
        return { message: 'Critical Error: System could not self-heal items table.', errors: true }
    }
    defaultItemId = newItem.id
  }
  
  rawData.item_id = defaultItemId

  const validated = DistributionSchema.safeParse(rawData)
  if (!validated.success) {
    return { message: validated.error.issues[0].message, errors: true }
  }

  const { staff_id, item_id, quantity, free_quantity, zone } = validated.data

  const { data: distribution, error } = await supabase
    .from('distributions')
    .insert({
      agent_id: user.id,
      staff_id,
      item_id,
      quantity,
      free_quantity,
      zone,
      status: 'completed' 
    })
    .select()
    .single()

  if (error) {
    console.error('Insert error:', error)
    return { message: `Insert Error: ${error.message}`, errors: true }
  }

  await logAction('DISTRIBUTE_STOCK', { 
    targetTable: 'distributions', 
    targetId: distribution.id, 
    details: { staff_id, quantity, zone } 
  })

  revalidatePath('/dashboard/agent')
  return { message: 'Distribution successfully recorded!', errors: false }
}

export async function getAgentDashboardData() {
  const { user } = await verifySession(['agent'])
  const supabase = await createClient()

  const today = new Date()
  today.setHours(0,0,0,0)
  
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  sevenDaysAgo.setHours(0,0,0,0)

  const supabaseAdmin = createAdminClient()

  const [
    staffResponse,
    distributionsResponse,
    weeklyResponse
  ] = await Promise.all([
    supabaseAdmin.from('users').select('id, full_name').eq('role', 'staff').order('full_name'),
    supabase.from('distributions').select('id, created_at, quantity, free_quantity, status, staff:users!distributions_staff_id_fkey (full_name)').gte('created_at', today.toISOString()).order('created_at', { ascending: false }).limit(10),
    supabase.from('distributions').select('quantity, free_quantity').gte('created_at', sevenDaysAgo.toISOString())
  ])

  const staffList = staffResponse.data || []
  const distributions = distributionsResponse.data || []
  const weeklyData = weeklyResponse.data || []

  if (staffResponse.error) console.error('Agent Dashboard Staff Fetch Error:', staffResponse.error)

  const weeklyTotal = weeklyData?.reduce((acc: number, curr) => acc + curr.quantity, 0) || 0
  const weeklyFree = weeklyData?.reduce((acc: number, curr) => acc + (curr.free_quantity || 0), 0) || 0

  // Calculate some real metrics
  const sumQuantity = distributions?.reduce((acc: number, curr) => acc + curr.quantity, 0) || 0
  const sumFree = distributions?.reduce((acc: number, curr) => acc + (curr.free_quantity || 0), 0) || 0
  const uniqueStaff = new Set(distributions?.map(d => (d.staff as any)?.full_name)).size

  // Normalize staff join type for the UI
  const normalizedDistributions = (distributions || []).map(d => ({
    id: d.id,
    created_at: d.created_at,
    quantity: d.quantity,
    free_quantity: d.free_quantity || 0,
    status: d.status,
    staff: {
      full_name: Array.isArray(d.staff) ? d.staff[0]?.full_name : (d.staff as any)?.full_name || 'Unknown'
    }
  }))

  return {
    staffList: staffList || [],
    distributions: normalizedDistributions,
    metrics: {
      distributedToday: sumQuantity,
      freeToday: sumFree,
      staffServed: uniqueStaff,
      totalThisWeek: weeklyTotal,
      freeThisWeek: weeklyFree,
      activeStaffCount: staffList?.length || 0
    }
  }
}

export async function getDistributionHistory() {
  const { user } = await verifySession(['agent'])
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('distributions')
    .select(`
      id,
      created_at,
      quantity,
      zone,
      staff:users!distributions_staff_id_fkey (full_name)
    `)
    .eq('agent_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('History fetch error:', error)
    return []
  }

  return data.map(d => ({
    id: d.id,
    staff: (d.staff as any)?.full_name || 'Unknown',
    quantity: d.quantity,
    date: new Date(d.created_at).toLocaleString(),
    zone: d.zone
  }))
}

export async function updateDistribution(id: string, quantity: number, zone: string) {
  const { user } = await verifySession(['agent'])
  const supabase = await createClient()

  // Ownership check
  const { data: existing } = await supabase
    .from('distributions')
    .select('agent_id')
    .eq('id', id)
    .single()

  if (!existing || existing.agent_id !== user.id) {
    throw new Error('Unauthorized or distribution not found')
  }

  const { error } = await supabase
    .from('distributions')
    .update({ quantity, zone, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error('Failed to update distribution')

  await logAction('UPDATE_DISTRIBUTION', { targetTable: 'distributions', targetId: id, details: { quantity, zone } })
  revalidatePath('/dashboard/agent')
}

export async function deleteDistribution(id: string) {
  const { user } = await verifySession(['agent'])
  const supabase = await createClient()

  // Ownership check
  const { data: existing } = await supabase
    .from('distributions')
    .select('agent_id')
    .eq('id', id)
    .single()

  if (!existing || existing.agent_id !== user.id) {
    throw new Error('Unauthorized or distribution not found')
  }

  const { error } = await supabase
    .from('distributions')
    .delete()
    .eq('id', id)

  if (error) throw new Error('Failed to delete distribution')

  await logAction('DELETE_DISTRIBUTION', { targetTable: 'distributions', targetId: id })
  revalidatePath('/dashboard/agent')
}

export async function getAgentReportsData() {
  const { user } = await verifySession(['agent'])
  const supabase = await createClient()

  const { data: distributions } = await supabase
    .from('distributions')
    .select('created_at, quantity, zone, staff_id')
    .eq('agent_id', user.id)
    .order('created_at', { ascending: false })

  if (!distributions) {
    return { reports: [], metrics: { highestPeriod: 'N/A', highestVolume: 0, averageDaily: 0 } }
  }

  // Group by date (DD/MM/YYYY or locale)
  const grouped = distributions.reduce((acc: any, curr) => {
    const date = new Date(curr.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    if (!acc[date]) {
      acc[date] = {
        period: date,
        totalTanks: 0,
        staffSet: new Set(),
        zones: {} as Record<string, number>
      }
    }
    acc[date].totalTanks += curr.quantity
    acc[date].staffSet.add(curr.staff_id)
    acc[date].zones[curr.zone] = (acc[date].zones[curr.zone] || 0) + curr.quantity
    
    return acc
  }, {})

  const reports = Object.values(grouped).map((g: any) => {
    const mostActiveZone = Object.entries(g.zones).sort((a: any, b: any) => b[1] - a[1])[0][0]
    return {
      period: g.period,
      totalTanks: g.totalTanks,
      activeStaff: g.staffSet.size,
      mostActiveZone
    }
  })

  let highestVolume = 0
  let highestPeriod = 'N/A'
  let totalVolume = 0

  reports.forEach((r: any) => {
    totalVolume += r.totalTanks
    if (r.totalTanks > highestVolume) {
      highestVolume = r.totalTanks
      highestPeriod = r.period
    }
  })

  const averageDaily = reports.length > 0 ? Math.round(totalVolume / reports.length) : 0

  return {
    reports,
    metrics: {
      highestPeriod,
      highestVolume,
      averageDaily
    }
  }
}

export async function getStaffNetworkDetails() {
  const { user } = await verifySession(['agent'])
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  // 1. Fetch all staff members 
  // IMPORTANT: We only select 'id' and 'full_name' because 'email' and 'is_active' may not exist in public.users
  const { data: staffList, error } = await supabaseAdmin
    .from('users')
    .select('id, full_name')
    .eq('role', 'staff')
    .order('full_name')

  if (error) {
    console.error('Staff Network Fetch Error:', error)
    return []
  }

  if (!staffList) return []

  // 2. Fetch all distributions to calculate lifetime received
  const { data: distributions } = await supabase
    .from('distributions')
    .select('staff_id, quantity, free_quantity')
    .eq('status', 'completed')

  // 3. Fetch all sale items to calculate lifetime sold
  const { data: sales } = await supabase
    .from('sale_items')
    .select('quantity, sales!inner(staff_id, status)')
    .eq('sales.status', 'completed')

  // Map the calculations
  const staffNetwork = staffList.map(staff => {
    // Sum distributions for this staff
    const staffDistributions = distributions?.filter(d => d.staff_id === staff.id) || []
    const lifetimeReceived = staffDistributions.reduce((acc, curr) => acc + curr.quantity, 0)

    // Sum sales for this staff
    const staffSales = sales?.filter((s: any) => s.sales?.staff_id === staff.id) || []
    const lifetimeSold = staffSales.reduce((acc: number, curr: any) => acc + curr.quantity, 0)

    const currentStock = lifetimeReceived - lifetimeSold

    return {
      id: staff.id,
      name: staff.full_name || 'Unknown',
      phone: 'Field Personnel', 
      status: 'Active',
      tanksReceived: lifetimeReceived,
      currentStock: currentStock
    }
  })

  return staffNetwork
}
