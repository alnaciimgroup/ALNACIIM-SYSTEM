import { createClient } from '@/utils/supabase/server'

export async function getStaffList() {
  const supabase = await createClient()

  // 1. Fetch all required data in parallel (The Speed Boost)
  const [
    { data: staffList },
    { data: customers },
    { data: sales }
  ] = await Promise.all([
    supabase.from('users').select('id, full_name, role').eq('role', 'staff').order('full_name'),
    supabase.from('customers').select('staff_id'),
    supabase.from('sales').select('staff_id, total_amount')
  ])

  // 2. Pre-aggregate data into fast Lookup Maps (O(n) instead of O(n^2))
  const customerCounts: Record<string, number> = {}
  customers?.forEach(c => {
    if (c.staff_id) customerCounts[c.staff_id] = (customerCounts[c.staff_id] || 0) + 1
  })

  const salesTotals: Record<string, number> = {}
  sales?.forEach(s => {
    if (s.staff_id) salesTotals[s.staff_id] = (salesTotals[s.staff_id] || 0) + Number(s.total_amount)
  })

  // 3. Map the data instantly
  const directory = (staffList || []).map(staff => ({
    id: staff.id,
    name: staff.full_name,
    role: staff.role,
    email: 'Field Personnel', 
    phone: 'Active',
    assignedCustomers: customerCounts[staff.id] || 0,
    totalSales: salesTotals[staff.id] || 0
  }))

  return directory
}
