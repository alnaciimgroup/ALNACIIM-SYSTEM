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
    liters: parseInt(formData.get('liters') as string),
    quantity: 1, // Bypass legacy quantity constraint
    free_quantity: 0,
    zone: formData.get('zone') as string,
    item_id: '', // Will be resolved
    truck_id: ''
  }

  // Automatically find the truck assigned to this staff member
  const { data: truckData } = await supabase.from('trucks').select('id, capacity_liters').eq('driver_id', rawData.staff_id).single()
  
  if (!truckData) {
    return { message: 'This staff member does not have an assigned truck. Superadmin must assign one first.', errors: true }
  }

  rawData.truck_id = truckData.id

  // Auto-resolve item_id since UI only distributes "Liters"
  // SELF-HEALING: If no items exist (due to a wipe), create a default one automatically
  let { data: items } = await supabase.from('items').select('id').limit(1)
  let defaultItemId = items?.[0]?.id

  if (!defaultItemId) {
    // System was wiped, use Admin Client to bypass RLS for self-healing
    const adminSupabase = await createAdminClient()
    const { data: newItem, error: createError } = await adminSupabase
      .from('items')
      .insert({ 
        name: 'Water', 
        current_price: 5.00
      })
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

  const { staff_id, truck_id, item_id, quantity, liters, free_quantity, zone } = validated.data

  // SECURITY CHECK 1: Ensure load doesn't exceed physical truck capacity
  if (liters > truckData.capacity_liters) {
    return { message: `Load Rejected: This truck's maximum capacity is only ${truckData.capacity_liters.toLocaleString()} Liters.`, errors: true }
  }

  // SECURITY CHECK 2: Verify enough water exists in the Main Reservoir
  const { data: prodLogs } = await supabase.from('production_logs').select('liters_produced')
  const { data: distLogs } = await supabase.from('distributions').select('liters')
  
  const totalProduced = (prodLogs || []).reduce((acc, log) => acc + Number(log.liters_produced), 0)
  const totalDistributed = (distLogs || []).reduce((acc, log) => acc + Number(log.liters || 0), 0)
  const currentLiquidInventory = totalProduced - totalDistributed

  if (liters > currentLiquidInventory) {
    return { message: `Insufficient water! Only ${currentLiquidInventory.toLocaleString()} Liters available in the Main Reservoir.`, errors: true }
  }

  const { data: distribution, error } = await supabase
    .from('distributions')
    .insert({
      agent_id: user.id,
      staff_id,
      truck_id,
      item_id,
      quantity,
      liters,
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
    details: { staff_id, truck_id, liters, zone } 
  })

  revalidatePath('/dashboard/agent')
  return { message: 'Distribution successfully recorded!', errors: false }
}

import { getWorkDate, getWorkDayBounds } from '@/utils/date-utils'

export async function getAgentDashboardData(date?: string) {
  const { user } = await verifySession(['agent'])
  const supabase = await createClient()

  let startOfDay = ''
  let endOfDay = ''
  
  if (date && date !== 'all') {
    const bounds = getWorkDayBounds(date)
    startOfDay = bounds.startOfDay
    endOfDay = bounds.endOfDay
  } else if (date !== 'all') {
    const todayStr = getWorkDate()
    const bounds = getWorkDayBounds(todayStr)
    startOfDay = bounds.startOfDay
    endOfDay = bounds.endOfDay
  }

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  sevenDaysAgo.setHours(0,0,0,0)

  const supabaseAdmin = createAdminClient()

  let distributionsQuery = supabase.from('distributions').select('id, created_at, quantity, liters, free_quantity, status, staff:users!distributions_staff_id_fkey (full_name), truck:trucks(plate_number)').order('created_at', { ascending: false })
  
  if (startOfDay && endOfDay) {
    distributionsQuery = distributionsQuery.gte('created_at', startOfDay).lte('created_at', endOfDay)
  }
  
  distributionsQuery = distributionsQuery.limit(50)

  const [
    staffResponse,
    distributionsResponse,
    weeklyResponse,
    trucksResponse
  ] = await Promise.all([
    supabaseAdmin.from('users').select('id, full_name').eq('role', 'staff').order('full_name'),
    distributionsQuery,
    supabase.from('distributions').select('quantity, liters, free_quantity').gte('created_at', sevenDaysAgo.toISOString()),
    supabase.from('trucks').select('id, plate_number, capacity_liters').eq('status', 'active')
  ])

  const staffList = staffResponse.data || []
  const distributions = distributionsResponse.data || []
  const weeklyData = weeklyResponse.data || []
  const truckList = trucksResponse.data || []

  if (staffResponse.error) console.error('Agent Dashboard Staff Fetch Error:', staffResponse.error)

  // SECURITY CHECK / INVENTORY FETCH
  const { data: prodLogs } = await supabase.from('production_logs').select('liters_produced')
  const totalProduced = (prodLogs || []).reduce((acc, log) => acc + Number(log.liters_produced), 0)
  
  const weeklyTotal = weeklyData?.reduce((acc: number, curr) => acc + (curr.liters || curr.quantity), 0) || 0
  const weeklyFree = weeklyData?.reduce((acc: number, curr) => acc + (curr.free_quantity || 0), 0) || 0

  // Calculate some real metrics
  const sumQuantity = distributions?.reduce((acc: number, curr) => acc + (curr.liters || curr.quantity), 0) || 0
  const sumFree = distributions?.reduce((acc: number, curr) => acc + (curr.free_quantity || 0), 0) || 0
  const uniqueStaff = new Set(distributions?.map(d => (d.staff as any)?.full_name)).size

  // Calculate total distributed liters for reservoir balance
  const { data: allDists } = await supabase.from('distributions').select('liters')
  const totalDistributedLiters = (allDists || []).reduce((acc, curr) => acc + Number(curr.liters || 0), 0)
  const availableLiters = totalProduced - totalDistributedLiters

  // Normalize staff join type for the UI
  const normalizedDistributions = (distributions || []).map(d => ({
    id: d.id,
    created_at: d.created_at,
    quantity: d.quantity,
    liters: d.liters || 0,
    free_quantity: d.free_quantity || 0,
    status: d.status,
    staff: {
      full_name: Array.isArray(d.staff) ? d.staff[0]?.full_name : (d.staff as any)?.full_name || 'Unknown'
    },
    truck: {
      plate_number: (d.truck as any)?.plate_number || 'N/A'
    }
  }))

  return {
    staffList: staffList || [],
    truckList: truckList,
    distributions: normalizedDistributions,
    metrics: {
      distributedToday: sumQuantity,
      freeToday: sumFree,
      staffServed: uniqueStaff,
      totalThisWeek: weeklyTotal,
      freeThisWeek: weeklyFree,
      activeStaffCount: staffList?.length || 0,
      availableLiters
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
      liters,
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
    liters: d.liters,
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
    .select('staff_id, liters')
    .eq('status', 'completed')

  // 3. Fetch all sale items to calculate lifetime sold
  const { data: sales } = await supabase
    .from('sale_items')
    .select('quantity, free_quantity, sales!inner(staff_id, status)')
    .eq('sales.status', 'completed')

  // Map the calculations
  const staffNetwork = staffList.map(staff => {
    // Sum distributions for this staff
    const staffDistributions = distributions?.filter(d => d.staff_id === staff.id) || []
    const lifetimeReceived = staffDistributions.reduce((acc, curr) => acc + (curr.liters || 0), 0)

    // Sum sales for this staff
    const staffSales = sales?.filter((s: any) => s.sales?.staff_id === staff.id) || []
    const lifetimeSold = staffSales.reduce((acc: number, curr: any) => acc + (curr.quantity || 0) + (curr.free_quantity || 0), 0)

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

export async function logProduction(prevState: any, formData: FormData) {
  try {
    const { user } = await verifySession(['agent'])
    const supabase = createAdminClient()

    const litersStr = formData.get('liters') as string
    const liters = parseInt(litersStr, 10)

    if (isNaN(liters) || liters <= 0) {
      return { message: 'Invalid liters amount. Must be a positive number.', error: true }
    }

    const { error } = await supabase
      .from('production_logs')
      .insert({
        superadmin_id: user.id, // Re-using this column temporarily for the agent
        liters_produced: liters
      })

    if (error) {
      console.error('Error inserting production log:', error)
      return { message: 'Failed to record production.', error: true }
    }

    revalidatePath('/dashboard/agent')
    return { message: `Successfully recorded ${liters.toLocaleString()} Liters of water supply.`, error: false }
  } catch (error) {
    console.error('logProduction exception:', error)
    return { message: 'An unexpected error occurred.', error: true }
  }
}
