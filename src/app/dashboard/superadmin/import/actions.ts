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

interface ImportCustomerInput {
  name: string
  phone?: string
  tank_number?: string
  debt?: number | string
  guarantor?: string
  guarantor_phone?: string
  address?: string
  customer_type?: 'regular' | 'irregular'
}

export async function bulkImportCustomers(
  customersList: ImportCustomerInput[],
  staffId: string
) {
  try {
    await verifySession(['superadmin'])
    const supabase = createAdminClient()

    if (!staffId) {
      throw new Error('Staff Assignment is required.')
    }

    let successCount = 0
    let skippedCount = 0
    const validCustomers: any[] = []

    for (const item of customersList) {
      const cleanTankNumber = item.tank_number ? String(item.tank_number).trim() : ''
      const cleanName = item.name ? String(item.name).trim() : ''

      // RULE: Skip rows with empty Box ID (tank_number) or empty Name
      if (!cleanTankNumber || !cleanName) {
        skippedCount++
        continue
      }

      // Format debt
      let debtAmount = 0
      if (item.debt !== undefined && item.debt !== null) {
        const parsedDebt = parseFloat(String(item.debt).replace(/[^0-9.-]/g, ''))
        if (!isNaN(parsedDebt)) {
          debtAmount = parsedDebt
        }
      }

      const cleanPhone = item.phone ? String(item.phone).replace(/\s+/g, '') : ''
      const cleanGuarantor = item.guarantor ? String(item.guarantor).trim() : 'Self'
      const cleanGuarantorPhone = item.guarantor_phone 
        ? String(item.guarantor_phone).replace(/\s+/g, '') 
        : (cleanPhone || 'N/A')

      validCustomers.push({
        staff_id: staffId,
        name: cleanName,
        phone: cleanPhone || 'N/A',
        address: item.address ? String(item.address).trim() : 'N/A',
        guarantor: cleanGuarantor,
        guarantor_phone: cleanGuarantorPhone,
        tank_number: cleanTankNumber,
        customer_type: item.customer_type || 'regular',
        status: 'active',
        debt: debtAmount,
        created_at: new Date().toISOString()
      })
    }

    // Insert in batches of 1,000 to optimize Supabase connection
    const BATCH_SIZE = 1000
    for (let i = 0; i < validCustomers.length; i += BATCH_SIZE) {
      const batch = validCustomers.slice(i, i + BATCH_SIZE)
      const { error } = await supabase
        .from('customers')
        .insert(batch)

      if (error) {
        console.error(`Error inserting batch starting at index ${i}:`, error)
        throw new Error(`Failed to save customer batch: ${error.message}`)
      }
      successCount += batch.length
    }

    revalidatePath('/dashboard/accountant/customers')
    revalidatePath('/dashboard/staff/customers')

    return {
      success: true,
      count: successCount,
      skipped: skippedCount
    }
  } catch (err: any) {
    console.error('bulkImportCustomers exception:', err)
    return {
      success: false,
      message: err.message || 'An unexpected error occurred during bulk import.',
      count: 0,
      skipped: 0
    }
  }
}
