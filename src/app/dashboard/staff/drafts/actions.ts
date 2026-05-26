'use server'

import { createClient } from '@/utils/supabase/server'
import { verifySession } from '@/utils/auth'
import { logAction } from '@/utils/audit'
import { revalidatePath } from 'next/cache'

export async function getDraftSales() {
  const { user } = await verifySession(['staff'])
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sales')
    .select(`
      id,
      total_amount,
      created_at,
      customer:customers(id, name, phone),
      sale_items(quantity, free_quantity)
    `)
    .eq('staff_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch drafts:', error)
    return []
  }

  return data
}

export async function resolveDraft(saleId: string, resolution: 'cash' | 'credit') {
  const { user } = await verifySession(['staff'])
  const supabase = await createClient()

  // 1. Get the draft sale
  const { data: sale, error: fetchError } = await supabase
    .from('sales')
    .select('id, total_amount, customer_id, status')
    .eq('id', saleId)
    .eq('staff_id', user.id)
    .single()

  if (fetchError || !sale) return { error: 'Draft not found.' }
  if (sale.status !== 'pending') return { error: 'Sale is already resolved.' }

  // 2. Resolve based on type
  if (resolution === 'cash') {
    // Update sale to cash and completed
    await supabase.from('sales').update({
      sale_type: 'cash',
      status: 'completed'
    }).eq('id', saleId)

    // Insert payment
    await supabase.from('payments').insert({
      sale_id: sale.id,
      amount: sale.total_amount,
      payment_method: 'cash'
    })
  } else if (resolution === 'credit') {
    // Update sale to completed (sale_type is already credit)
    await supabase.from('sales').update({
      status: 'completed'
    }).eq('id', saleId)

    // Increase customer debt
    const { error: debtError } = await supabase.rpc('increment_customer_debt', {
      cust_id: sale.customer_id,
      amount: sale.total_amount
    })

    if (debtError) {
      const { data: currentCust } = await supabase.from('customers').select('debt').eq('id', sale.customer_id).single()
      const newDebt = (Number(currentCust?.debt || 0)) + Number(sale.total_amount)
      await supabase.from('customers').update({ debt: newDebt }).eq('id', sale.customer_id)
    }
  }

  // 3. Log it
  await logAction('RESOLVE_DRAFT', {
    targetTable: 'sales',
    targetId: sale.id,
    details: { resolution, total_amount: sale.total_amount }
  })

  revalidatePath('/dashboard/staff/drafts')
  revalidatePath('/dashboard/staff')
  
  return { success: true }
}
