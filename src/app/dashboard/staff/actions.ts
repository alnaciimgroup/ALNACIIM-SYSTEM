'use server'

// @ts-nocheck
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { verifySession } from '@/utils/auth'
import { SaleSchema, SubmissionSchema } from '@/utils/validation'
import { logAction } from '@/utils/audit'
import { getWorkDate, getCurrentWorkDate } from '@/utils/date-utils'

/**
 * Fetch dashboard data for the logged-in staff member.
 */
export async function getStaffDashboardData(date?: string) {
  const { user } = await verifySession(['staff'])
  const supabase = await createClient()

  let startOfDay = ''
  let endOfDay = ''
  if (date && date !== 'all') {
    startOfDay = `${date}T00:00:00.000Z`
    // Ensure end of day includes the late night portion (up to 4 AM next day)
    // Actually, for query range, we should go up to 4 AM of NEXT calendar day
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)
    const nextDateStr = nextDay.toISOString().split('T')[0]
    endOfDay = `${nextDateStr}T03:59:59.999Z`
    
    // Start of day should actually start at 4 AM of current calendar day
    startOfDay = `${date}T04:00:00.000Z`
  } else if (!date) {
    const todayWorkDate = getCurrentWorkDate()
    startOfDay = `${todayWorkDate}T04:00:00.000Z`
    
    const tomorrow = new Date(todayWorkDate)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    endOfDay = `${tomorrowStr}T03:59:59.999Z`
  }

  let distributionsQuery = supabase.from('distributions').select('id, created_at, quantity').eq('staff_id', user.id).eq('status', 'completed')
  let salesQuery = supabase.from('sales').select('id, sale_type, total_amount, created_at, sale_items (quantity)').eq('staff_id', user.id).eq('status', 'completed')
  let paymentsQuery = supabase.from('payments').select('amount, payment_method, created_at, sale:sales!inner(staff_id)').eq('sale.staff_id', user.id)

  if (startOfDay && endOfDay) {
    distributionsQuery = distributionsQuery.gte('created_at', startOfDay).lte('created_at', endOfDay)
    salesQuery = salesQuery.gte('created_at', startOfDay).lte('created_at', endOfDay)
    paymentsQuery = paymentsQuery.gte('created_at', startOfDay).lte('created_at', endOfDay)
  }

  const [
    { count: customerCount },
    { data: distributions },
    { data: sales },
    { data: payments },
    { data: allTimeDistributions },
    { data: allTimeSales },
    { data: customers }
  ] = await Promise.all([
    supabase.from('customers').select('id', { count: 'exact', head: true }).eq('staff_id', user.id),
    distributionsQuery.select('id, created_at, quantity'),
    salesQuery.select('id, sale_type, total_amount, created_at, sale_items (quantity)'),
    paymentsQuery.select('amount, payment_method, created_at'),
    supabase.from('distributions').select('id, created_at, quantity, free_quantity').eq('staff_id', user.id).eq('status', 'completed'),
    supabase.from('sale_items').select('quantity, sales!inner(staff_id, status, sale_type)').eq('sales.staff_id', user.id).eq('sales.status', 'completed'),
    supabase.from('customers').select('debt').eq('staff_id', user.id)
  ])

  // Use allTimeDistributions for the recent list as well (no need for 3rd query)
  const recentDistributionsList = [...(allTimeDistributions || [])]
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const totalReceived = distributions?.reduce((acc: number, curr) => acc + curr.quantity, 0) || 0

  const totalSold = sales?.reduce((acc: number, s) => {
    const itemQty = s.sale_items?.reduce((a: number, i: any) => a + i.quantity, 0) || 0
    return acc + itemQty
  }, 0) || 0

  const cashSalesToday = sales
    ?.filter(s => s.sale_type === 'cash')
    ?.reduce((acc: number, s) => acc + Number(s.total_amount), 0) || 0

  const creditSalesToday = sales
    ?.filter(s => s.sale_type === 'credit')
    ?.reduce((acc: number, s) => acc + Number(s.total_amount), 0) || 0

  const debtPaymentsToday = payments
    ?.filter(p => p.payment_method === 'debt_repayment')
    ?.reduce((acc: number, p) => acc + Number(p.amount), 0) || 0

  const moneyCollectedToday = (payments?.reduce((acc: number, p) => acc + Number(p.amount), 0) || 0) || cashSalesToday + debtPaymentsToday

  const outstandingDebt = customers?.reduce((acc: number, c) => acc + Number(c.debt || 0), 0) || 0
  
  const globalReceived = allTimeDistributions?.reduce((acc: number, curr) => acc + curr.quantity, 0) || 0
  const globalFreeReceived = allTimeDistributions?.reduce((acc: number, curr) => acc + (curr.free_quantity || 0), 0) || 0
  
  const globalSold = allTimeSales?.reduce((acc: number, s: any) => acc + s.quantity, 0) || 0
  const globalFreeSold = allTimeSales?.filter((s: any) => {
    const sale = Array.isArray(s.sales) ? s.sales[0] : s.sales;
    return sale?.sale_type === 'free';
  })?.reduce((acc: number, s: any) => acc + s.quantity, 0) || 0
  
  const remainingTanks = globalReceived - globalSold
  const remainingFreeTanks = globalFreeReceived - globalFreeSold

  const freeTanksToday = sales
    ?.filter(s => s.sale_type === 'free')
    ?.reduce((acc: number, s) => {
      const itemQty = s.sale_items?.reduce((a: number, i: any) => a + i.quantity, 0) || 0
      return acc + itemQty
    }, 0) || 0

  return {
    metrics: {
      tanksReceived: totalReceived,
      tanksSold: totalSold,
      tanksReceivedLifetime: globalReceived,
      tanksSoldLifetime: globalSold,
      freeTanksToday,
      remainingTanks,
      remainingFreeTanks,
      cashSalesToday,
      creditSalesToday,
      debtPaymentsToday,
      moneyCollectedToday,
      outstandingDebt,
      customerCount: customerCount || 0
    },
    recentSales: sales?.slice(0, 5) || [],
    recentDistributions: recentDistributionsList?.reverse() || []
  }
}


/**
 * Record a new sale with inventory validation and debt logic.
 */
export async function recordSale(prevState: any, formData: FormData) {
  const { user } = await verifySession(['staff'])
  const supabase = await createClient()

  const saleType = formData.get('sale_type') as string
  const quantity = parseInt(formData.get('quantity') as string)
  const unit_price = saleType === 'free' ? 0.00 : parseFloat(formData.get('unit_price') as string || '5.00')

  // 1. Get default item (Water Tank)
  const { data: items } = await supabase.from('items').select('id').limit(1)
  const item_id = items?.[0]?.id
  if (!item_id) return { message: 'System Error: No items found.', errors: true }

  const rawData = {
    customer_id: formData.get('customer_id') as string,
    sale_type: saleType,
    items: [{
      item_id: item_id,
      quantity: quantity,
      unit_price: unit_price,
    }],
    total_amount: quantity * unit_price
  }

  // 2. Validate with Zod
  const validated = SaleSchema.safeParse(rawData)
  if (!validated.success) {
    return { message: validated.error.issues[0].message, errors: true }
  }

  const { customer_id, sale_type, total_amount } = validated.data
  // quantity and unit_price are already defined above and used in building rawData

  // 3. Validate Customer Ownership & Status
  const { data: customer, error: custError } = await supabase
    .from('customers')
    .select('id, status, name, staff_id')
    .eq('id', customer_id)
    .single()

  if (custError || !customer) return { message: 'Customer not found.', errors: true }
  
  // Security Check: Ensure staff owns this customer
  if (customer.staff_id !== user.id) {
    await logAction('CANCEL_SALE', { details: { reason: 'Unauthorized customer access attempt', customer_id } })
    return { message: 'Unauthorized: You do not manage this customer.', errors: true }
  }

  if (customer.status !== 'active') {
    return { message: `Customer "${customer.name}" is INACTIVE and cannot receive new sales.`, errors: true }
  }

  // 4. Validate Inventory (Stock Verification)
  const { metrics } = await getStaffDashboardData()
  if (quantity > metrics.remainingTanks) {
    return { 
      message: `Insufficient Stock. You only have ${metrics.remainingTanks} units available.`, 
      errors: true 
    }
  }

  // 5. Create Sale
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      staff_id: user.id,
      customer_id,
      sale_type,
      total_amount,
      status: 'completed'
    })
    .select()
    .single()

  if (saleError) {
    console.error('Sale Error:', saleError)
    return { message: 'Failed to record sale.', errors: true }
  }

  // 6. Create Sale Item
  const { error: itemError } = await supabase
    .from('sale_items')
    .insert({
      sale_id: sale.id,
      item_id,
      quantity,
      unit_price
    })

  if (itemError) {
    console.error('Sale Item Error:', itemError)
    return { message: 'Failed to record sale items.', errors: true }
  }

  // 7. Conditional Logic: Cash Payment vs Credit Debt
  if (sale_type === 'cash') {
    await supabase.from('payments').insert({
      sale_id: sale.id,
      amount: total_amount,
      payment_method: 'cash'
    })
  } else if (sale_type === 'credit') {
    // Increase customer debt
    const { error: debtError } = await supabase.rpc('increment_customer_debt', {
      cust_id: customer_id,
      amount: total_amount
    })

    if (debtError) {
      const { data: currentCust } = await supabase.from('customers').select('debt').eq('id', customer_id).single()
      const newDebt = (Number(currentCust?.debt || 0)) + total_amount
      await supabase.from('customers').update({ debt: newDebt }).eq('id', customer_id)
    }
  }

  // 8. Log Success
  await logAction('CREATE_SALE', { 
    targetTable: 'sales', 
    targetId: sale.id, 
    details: { customer_id, total_amount, sale_type } 
  })

  revalidatePath('/dashboard/staff')
  redirect('/dashboard/staff/history?success=true&message=Sale+recorded+successfully')
}



/**
 * Check if a sale is locked (submitted or verified)
 */
async function isSaleLocked(supabase: any, saleId: string, staffId: string) {
  const { data: sale } = await supabase
    .from('sales')
    .select('created_at')
    .eq('id', saleId)
    .single()

  if (!sale) return true // Lock if not found

  // Check if any submission exists for the same day
  const date = new Date(sale.created_at).toISOString().split('T')[0]
  const { count } = await supabase
    .from('cash_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('staff_id', staffId)
    .gte('created_at', `${date}T00:00:00Z`)
    .lte('created_at', `${date}T23:59:59Z`)

  return count > 0 // If submission exists, it's locked
}

export async function updateSale(id: string, quantity: number, unitPrice: number) {
  const { user, role } = await verifySession(['staff', 'accountant', 'superadmin'])
  const supabase = await createClient()

  if (role === 'staff') {
    if (await isSaleLocked(supabase, id, user.id)) {
      throw new Error('Transaction is locked and cannot be edited after submission.')
    }
  }

  // 0. Fetch the old sale context
  const { data: oldSale } = await supabase
    .from('sales')
    .select('total_amount, sale_type, customer_id')
    .eq('id', id)
    .single()
    
  if (!oldSale) throw new Error('Sale not found')
  
  const oldTotal = Number(oldSale.total_amount)
  const totalAmount = quantity * unitPrice
  const delta = totalAmount - oldTotal

  // 1. Update Sale Items
  const { error: itemError } = await supabase
    .from('sale_items')
    .update({ quantity, unit_price: unitPrice })
    .eq('sale_id', id)

  if (itemError) throw new Error('Failed to update sale items')

  // 2. Update Sale Total
  const { error: saleError } = await supabase
    .from('sales')
    .update({ 
      total_amount: totalAmount, 
      sale_type: unitPrice === 0 ? 'free' : oldSale.sale_type, // Auto-update to free if price is 0
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)

  if (saleError) throw new Error('Failed to update sale total')

  // 3. Sync Financials safely using Delta Math
  if (delta !== 0) {
    if (oldSale.sale_type === 'cash') {
      const { data: payment } = await supabase.from('payments').select('id, amount').eq('sale_id', id).limit(1).single()
      if (payment) {
        await supabase.from('payments').update({ amount: Number(payment.amount) + delta }).eq('id', payment.id)
      }
    } else if (oldSale.sale_type === 'credit') {
      const { data: customer } = await supabase.from('customers').select('debt').eq('id', oldSale.customer_id).single()
      if (customer) {
        const newDebt = Math.max(0, Number(customer.debt || 0) + delta)
        await supabase.from('customers').update({ debt: newDebt }).eq('id', oldSale.customer_id)
      }
    }
  }

  await logAction('UPDATE_SALE', { targetTable: 'sales', targetId: id, details: { quantity, totalAmount, delta } })
  revalidatePath('/dashboard/staff')
  revalidatePath('/dashboard/accountant/staff-reports')
}

export async function deleteSale(id: string) {
  const { user } = await verifySession(['staff'])
  const supabase = await createClient()

  if (await isSaleLocked(supabase, id, user.id)) {
    throw new Error('Transaction is locked and cannot be deleted after submission.')
  }

  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('id', id)

  if (error) throw new Error('Failed to delete sale')

  await logAction('DELETE_SALE', { targetTable: 'sales', targetId: id })
  revalidatePath('/dashboard/staff')
}
