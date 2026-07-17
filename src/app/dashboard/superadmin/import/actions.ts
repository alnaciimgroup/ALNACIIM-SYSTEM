'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { verifySession } from '@/utils/auth'
import { revalidatePath } from 'next/cache'

export async function getStaffList() {
  try {
    await verifySession(['superadmin'])
    const supabase = createAdminClient()
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, full_name, role')
      .in('role', ['staff', 'agent'])
      .order('full_name')

    if (error) {
      console.error('Error fetching staff list for import:', error)
      return []
    }

    return users || []
  } catch (err) {
    console.error('getStaffList exception:', err)
    return []
  }
}

export async function importCustomerBatch(
  batch: any[],
  staffId?: string
) {
  try {
    await verifySession(['superadmin'])
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('customers')
      .insert(batch)

    if (error) {
      console.error('Error inserting customer batch:', error)
      return { success: false, message: error.message }
    }

    revalidatePath('/dashboard/accountant/customers')
    revalidatePath('/dashboard/staff/customers')

    return { success: true }
  } catch (err: any) {
    console.error('importCustomerBatch exception:', err)
    return { success: false, message: err.message || 'Failed to save customer batch.' }
  }
}
