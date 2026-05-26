'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { verifySession } from '@/utils/auth'

export async function getDebtorsList() {
  const { user } = await verifySession(['accountant'])
  const supabase = createAdminClient()

  // Fetch all customers with debt greater than 0
  const { data: debtors, error } = await supabase
    .from('customers')
    .select('id, name, phone, address, debt, status, staff:users(full_name)')
    .gt('debt', 0)
    .order('debt', { ascending: false })

  if (error) {
    console.error('Error fetching debtors:', error)
    return []
  }

  // Fetch their last payment date
  // Since we want to optimize, we can fetch all payments for these customers' sales
  // But wait, it's easier to just fetch sales for each debtor to find last activity
  const debtorIds = debtors.map(d => d.id)
  
  const { data: sales } = await supabase
    .from('sales')
    .select('customer_id, created_at')
    .in('customer_id', debtorIds)
    .order('created_at', { ascending: false })

  return debtors.map(d => {
    const customerSales = sales?.filter(s => s.customer_id === d.id) || []
    const lastActivity = customerSales.length > 0 ? customerSales[0].created_at : null

    return {
      ...d,
      staffName: (d.staff as any)?.full_name || 'Unassigned',
      lastActivity
    }
  })
}
