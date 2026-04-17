'use server'

// @ts-nocheck
import { createClient } from '@/utils/supabase/server'
import { verifySession } from '@/utils/auth'

export async function getAccountantCustomers(search?: string) {
  try {
    await verifySession(['accountant', 'superadmin'])
    const supabase = await createClient()

    let query = supabase
      .from('customers')
      .select('id, name, phone, tank_number, status, debt, staff_id, users(id, full_name)')
      .order('name', { ascending: true })

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) {
      console.error('Error fetching accountant customers:', error.message)
      return []
    }

    // Map users to staff for consistency
    const mappedData = (data || []).map(c => ({
      ...c,
      staff: c.users
    }))

    return mappedData
  } catch (e) {
    console.error('getAccountantCustomers Exception:', e)
    return []
  }
}

export async function getCustomerDetailedData(id: string) {
  try {
    await verifySession(['accountant', 'superadmin'])
    const supabase = await createClient()

    // 1. Fetch Profile, Sales, and Payments in PARALLEL (Massive Speed Boost)
    const [
      { data: customer, error: profileError },
      { data: sales, error: salesError },
      { data: payments, error: paymentsError }
    ] = await Promise.all([
      supabase.from('customers').select('*, tank_number, staff:users(id, full_name)').eq('id', id).single(),
      supabase.from('sales').select('id, created_at, total_amount, sale_type, status, items:sale_items(quantity, unit_price, items(name))').eq('customer_id', id).order('created_at', { ascending: false }),
      supabase.from('payments').select('id, created_at, amount, payment_method, sales(sale_type, customer_id)').eq('sales.customer_id', id).order('created_at', { ascending: false })
    ])

    if (profileError || !customer) {
      console.error(`Customer Profile Fetch Error for ID ${id}:`, profileError?.message)
      return null
    }

    if (salesError) console.error('Sales Fetch Error:', salesError.message)
    if (paymentsError) console.error('Payments Fetch Error:', paymentsError.message)

    const filteredPayments = (payments || []).filter(p => (p.sales as any)?.customer_id === id)

    // 4. Calculate Financial Metrics
    const totalSalesValue = (sales || [])
      .reduce((acc: number, s) => acc + Number(s.total_amount), 0)

    const totalPaid = (filteredPayments || [])
      .reduce((acc: number, p) => acc + Number(p.amount), 0)

    // Debt = (Initial Debt) + (Total New Sales) - (Total Paid)
    const currentDebt = (Number(customer.debt) || 0) + totalSalesValue - totalPaid

    const totalFreeTanks = (sales || [])
      .filter(s => s.sale_type === 'free')
      .reduce((acc: number, s) => acc + (s.items as any).reduce((a: number, i: any) => a + i.quantity, 0), 0)

    return {
      profile: customer,
      sales: sales || [],
      payments: filteredPayments,
      metrics: {
        totalSalesValue,
        totalPaid,
        currentDebt,
        totalFreeTanks,
        totalSalesCount: sales?.length || 0,
        totalTanksBought: (sales || []).reduce((acc: number, s) => acc + (s.items as any).reduce((a: number, i: any) => a + i.quantity, 0), 0)
      }
    }
  } catch (e) {
    console.error('getCustomerDetailedData Exception:', e)
    return null
  }
}
