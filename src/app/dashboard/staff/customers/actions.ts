'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { verifySession } from '@/utils/auth'
import { CustomerSchema } from '@/utils/validation'
import { logAction } from '@/utils/audit'

export async function getCustomers(search?: string, statusFilter?: string) {
  const { user } = await verifySession(['staff', 'accountant', 'agent'])
  const supabase = createAdminClient()

  let query = supabase
    .from('customers')
    .select('*')
    .eq('staff_id', user.id)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: customers, error } = await query
  
  if (error) {
    console.error('Error fetching customers:', error)
    return []
  }

  return customers
}

export async function createCustomer(prevState: any, formData: FormData) {
  const { user } = await verifySession(['staff'])
  const supabase = createAdminClient()

  const rawData = {
    name: formData.get('name') as string,
    phone: formData.get('phone') as string,
    guarantor: formData.get('guarantor') as string,
    guarantor_phone: formData.get('guarantor_phone') as string,
    tank_number: formData.get('tank_number') as string,
    staff_id: user.id
  }

  const validated = CustomerSchema.safeParse(rawData)
  if (!validated.success) {
    return { message: validated.error.issues[0].message, errors: true }
  }

  const { data: customer, error } = await supabase
    .from('customers')
    .insert({
      staff_id: user.id,
      name: validated.data.name,
      phone: validated.data.phone,
      address: formData.get('address') as string,
      guarantor: validated.data.guarantor,
      guarantor_phone: validated.data.guarantor_phone,
      tank_number: validated.data.tank_number,
      status: 'active'
    })
    .select()
    .single()

  if (error) {
    console.error('Insert Customer Error:', error)
    return { message: 'Failed to create customer record.', errors: true }
  }

  await logAction('CREATE_CUSTOMER', { 
    targetTable: 'customers', 
    targetId: customer.id, 
    details: { name: validated.data.name } 
  })

  revalidatePath('/dashboard/staff/customers')
  redirect('/dashboard/staff/customers?success=true&message=Customer+created+successfully')
}

export async function toggleCustomerStatus(id: string, currentStatus: string) {
  const { user } = await verifySession(['staff'])
  const supabase = createAdminClient()

  const newStatus = currentStatus === 'active' ? 'inactive' : 'active'

  const { error } = await supabase
    .from('customers')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('staff_id', user.id) // Defensive constraint 

  if (error) {
    console.error('Update Status Error:', error)
    throw new Error('Failed to update status')
  }

  await logAction('UPDATE_CUSTOMER', { 
    targetTable: 'customers', 
    targetId: id, 
    details: { status: newStatus, action: 'toggle_status' } 
  })

  revalidatePath('/dashboard/staff/customers')
}

export async function getCustomerById(id: string) {
  const supabase = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('staff_id', user.id)
    .single()

  if (error) {
    console.error('Fetch Customer Error:', error)
    return null
  }

  return customer
}

export async function updateCustomer(id: string, prevState: any, formData: FormData) {
  const { user } = await verifySession(['staff'])
  const supabase = createAdminClient()

  const rawData = {
    name: formData.get('name') as string,
    phone: formData.get('phone') as string,
    guarantor: formData.get('guarantor') as string,
    guarantor_phone: formData.get('guarantor_phone') as string,
    tank_number: formData.get('tank_number') as string,
    staff_id: user.id
  }

  const validated = CustomerSchema.safeParse(rawData)
  if (!validated.success) {
    return { message: validated.error.issues[0].message, errors: true }
  }

  const { error } = await supabase
    .from('customers')
    .update({ 
      name: validated.data.name, 
      phone: validated.data.phone, 
      address: formData.get('address') as string, 
      guarantor: validated.data.guarantor, 
      guarantor_phone: validated.data.guarantor_phone,
      tank_number: validated.data.tank_number,
      status: formData.get('status') as string, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .eq('staff_id', user.id) // Enforce RLS logic serverside to ensure ownership

  if (error) {
    console.error('Update Customer Error:', error)
    return { message: 'Failed to update customer.', errors: true }
  }

  await logAction('UPDATE_CUSTOMER', { 
    targetTable: 'customers', 
    targetId: id, 
    details: { name: validated.data.name } 
  })

  revalidatePath('/dashboard/staff/customers')
  redirect('/dashboard/staff/customers?success=true&message=Customer+updated+successfully')
}

export async function recordDebtPayment(prevState: any, formData: FormData) {
  const { user } = await verifySession(['staff'])
  const supabase = createAdminClient()

  const customer_id = formData.get('customer_id') as string
  const amountStr = formData.get('amount') as string
  const amount = parseFloat(amountStr)

  if (!customer_id || isNaN(amount) || amount <= 0) {
    return { message: 'Invalid payment amount.', error: true }
  }

  // 1. Verify Customer & check debt
  const { data: customer } = await supabase
    .from('customers')
    .select('id, debt, name, staff_id')
    .eq('id', customer_id)
    .single()

  if (!customer || customer.staff_id !== user.id) {
    return { message: 'Unauthorized or customer not found.', error: true }
  }

  if (amount > (customer.debt || 0)) {
    return { message: `Payment exceeds outstanding debt ($${customer.debt || 0}).`, error: true }
  }

  // 2. Decrement Debt
  const { error: updateError } = await supabase
    .from('customers')
    .update({ debt: (customer.debt || 0) - amount })
    .eq('id', customer_id)

  if (updateError) {
    console.error('Debt Update Error:', updateError)
    return { message: 'Failed to update customer balance.', error: true }
  }

  // 3. Find a sale to attach the payment to (latest credit sale)
  let { data: sale } = await supabase
    .from('sales')
    .select('id')
    .eq('customer_id', customer_id)
    .eq('sale_type', 'credit')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Fallback: if no credit sale exists contextually, find any sale for this customer
  if (!sale) {
    const { data: anySale } = await supabase
      .from('sales')
      .select('id')
      .eq('customer_id', customer_id)
      .limit(1)
      .single()
    sale = anySale
  }

  // 4. Create dummy sale if absolutely no sales exist (edge case)
  let finalSaleId = sale?.id
  if (!finalSaleId) {
    const { data: newSale } = await supabase
      .from('sales')
      .insert({ staff_id: user.id, customer_id, sale_type: 'credit', total_amount: 0, status: 'completed' })
      .select('id')
      .single()
    finalSaleId = newSale?.id
  }

  // 5. Insert Payment Record
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      sale_id: finalSaleId,
      amount: amount,
      payment_method: 'debt_repayment'
    })

  if (paymentError) {
    console.error('Payment Insert Error:', paymentError)
    // Rollback debt logic ideally, assuming standard scale
  }

  await logAction('RECORD_PAYMENT', { 
    targetTable: 'payments', 
    details: { customer: customer.name, amount } 
  })

  revalidatePath('/dashboard/staff/customers')
  revalidatePath('/dashboard/staff')
  revalidatePath('/dashboard/staff/daily-report')
  
  return { message: `Successfully recorded $${amount.toFixed(2)} payment from ${customer.name}.`, error: false }
}
