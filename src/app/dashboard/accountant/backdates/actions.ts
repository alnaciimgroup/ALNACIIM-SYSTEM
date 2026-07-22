'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { verifySession } from '@/utils/auth'
import { logAction } from '@/utils/audit'

export async function getPendingBackdatesCount() {
  await verifySession(['accountant'])
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('sales')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending_approval')

  if (error) {
    console.error('Error getting pending backdates count:', error.message)
    return 0
  }
  return count || 0
}

export async function getPendingBackdates() {
  await verifySession(['accountant'])
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sales')
    .select(`
      id, total_amount, sale_type, status, created_at, discount_amount, requested_date, backdate_reason,
      staff:users!sales_staff_id_fkey(id, full_name),
      customer:customers(id, name, tank_number),
      sale_items(quantity, free_quantity, unit_price)
    `)
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching pending backdates:', error.message)
    return []
  }
  return data || []
}

export async function approveBackdateSale(saleId: string) {
  const { user } = await verifySession(['accountant'])
  const supabase = await createClient()

  // 1. Fetch the sale details
  const { data: sale, error: fetchError } = await supabase
    .from('sales')
    .select('id, total_amount, sale_type, customer_id, requested_date, status')
    .eq('id', saleId)
    .single()

  if (fetchError || !sale) {
    return { success: false, message: 'Sale transaction not found.' }
  }

  if (sale.status !== 'pending_approval') {
    return { success: false, message: 'This sale is not pending approval.' }
  }

  const requestedDateStr = sale.requested_date
  if (!requestedDateStr) {
    return { success: false, message: 'Sale has no requested backdate.' }
  }

  // Create a proper timestamp for created_at on that day (e.g. 12:00:00 UTC)
  const backdateTime = `${requestedDateStr}T12:00:00Z`

  // 2. Update the sale status and timestamp
  const { error: updateError } = await supabase
    .from('sales')
    .update({
      status: 'completed',
      created_at: backdateTime,
      approved_at: new Date().toISOString(),
      approved_by: user.id
    })
    .eq('id', saleId)

  if (updateError) {
    console.error('Error updating sale status:', updateError.message)
    return { success: false, message: 'Failed to update sale status.' }
  }

  // 3. Perform conditional logic (payments for cash, debt increment for credit)
  if (sale.sale_type === 'cash') {
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        sale_id: sale.id,
        amount: sale.total_amount,
        payment_method: 'cash',
        created_at: backdateTime
      })

    if (paymentError) {
      console.error('Error creating payment:', paymentError.message)
    }
  } else if (sale.sale_type === 'credit') {
    // Increment customer debt
    const { error: debtError } = await supabase.rpc('increment_customer_debt', {
      cust_id: sale.customer_id,
      amount: sale.total_amount
    })

    if (debtError) {
      console.warn('RPC increment_customer_debt failed, falling back to manual increment:', debtError.message)
      const { data: currentCust } = await supabase.from('customers').select('debt').eq('id', sale.customer_id).single()
      const newDebt = (Number(currentCust?.debt || 0)) + Number(sale.total_amount)
      await supabase.from('customers').update({ debt: newDebt }).eq('id', sale.customer_id)
    }
  }

  // 4. Log the audit trace
  await logAction('APPROVE_BACKDATE_SALE', {
    targetTable: 'sales',
    targetId: saleId,
    details: {
      approved_by: user.id,
      customer_id: sale.customer_id,
      total_amount: sale.total_amount,
      requested_date: sale.requested_date
    }
  })

  revalidatePath('/dashboard/accountant')
  revalidatePath('/dashboard/accountant/backdates')
  revalidatePath('/dashboard/staff/history')
  return { success: true, message: 'Sale successfully approved and committed.' }
}

export async function rejectBackdateSale(saleId: string) {
  const { user } = await verifySession(['accountant'])
  const supabase = await createClient()

  // 1. Fetch the sale details to ensure it exists
  const { data: sale, error: fetchError } = await supabase
    .from('sales')
    .select('id, status, customer_id, total_amount')
    .eq('id', saleId)
    .single()

  if (fetchError || !sale) {
    return { success: false, message: 'Sale transaction not found.' }
  }

  if (sale.status !== 'pending_approval') {
    return { success: false, message: 'This sale is not pending approval.' }
  }

  // 2. Reject the sale by setting its status to 'cancelled'
  const { error: updateError } = await supabase
    .from('sales')
    .update({
      status: 'cancelled',
      approved_at: new Date().toISOString(),
      approved_by: user.id
    })
    .eq('id', saleId)

  if (updateError) {
    console.error('Error rejecting sale:', updateError.message)
    return { success: false, message: 'Failed to reject sale.' }
  }

  // 3. Log the rejection
  await logAction('REJECT_BACKDATE_SALE', {
    targetTable: 'sales',
    targetId: saleId,
    details: {
      rejected_by: user.id,
      customer_id: sale.customer_id,
      total_amount: sale.total_amount
    }
  })

  revalidatePath('/dashboard/accountant')
  revalidatePath('/dashboard/accountant/backdates')
  return { success: true, message: 'Sale backdate request rejected.' }
}
