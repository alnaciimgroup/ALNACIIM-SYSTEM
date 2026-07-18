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
      const cleanSearch = search.trim()

      // Check if there is an exact match for tank_number first
      const { data: exactMatch, error: exactErr } = await supabase
        .from('customers')
        .select('id, name, phone, tank_number, status, debt, staff_id, users(id, full_name)')
        .eq('tank_number', cleanSearch)
        .limit(1)

      if (!exactErr && exactMatch && exactMatch.length > 0) {
        // Fetch payments for this exact customer
        const { data: allPayments } = await supabase
          .from('payments')
          .select('amount, sales!inner(customer_id)')
          .eq('sales.customer_id', exactMatch[0].id)

        const collectedAmount = (allPayments || []).reduce((acc, p) => acc + Number(p.amount), 0)

        const usersRelation = exactMatch[0].users
        const staffObj = Array.isArray(usersRelation) ? usersRelation[0] : usersRelation

        return [{
          ...exactMatch[0],
          staff: staffObj,
          collected: collectedAmount
        }]
      }

      query = query.or(`name.ilike.%${cleanSearch}%,phone.ilike.%${cleanSearch}%,tank_number.eq.${cleanSearch}`)
    } else {
      query = query.limit(200)
    }

    const { data, error } = await query
    if (error) {
      console.error('Error fetching accountant customers:', error.message)
      return []
    }

    // 2. Fetch all payments for these customers to calculate "Collected" amount
    const customerIds = (data || []).map(c => c.id)
    const { data: allPayments } = await supabase
      .from('payments')
      .select('amount, sales!inner(customer_id)')
      .in('sales.customer_id', customerIds)

    // 3. Map payments to customer IDs
    const paymentMap = (allPayments || []).reduce((acc: Record<string, number>, p) => {
      const salesRelation = p.sales as unknown as { customer_id: string }
      const cid = salesRelation.customer_id
      acc[cid] = (acc[cid] || 0) + Number(p.amount)
      return acc
    }, {})

    // 4. Map users to staff and attach collected data
    const mappedData = (data || []).map(c => {
      const usersRelation = c.users
      const staffObj = Array.isArray(usersRelation) ? usersRelation[0] : usersRelation
      return {
        ...c,
        staff: staffObj as { id: string; full_name: string } | null,
        collected: paymentMap[c.id] || 0
      }
    })

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

    const filteredPayments = (payments || []).filter(p => {
      const salesRelation = p.sales as unknown as { customer_id: string } | null
      return salesRelation?.customer_id === id
    })

    // 4. Calculate Financial Metrics
    const totalSalesValue = (sales || [])
      .reduce((acc: number, s) => acc + Number(s.total_amount), 0)

    const totalPaid = (filteredPayments || [])
      .reduce((acc: number, p) => acc + Number(p.amount), 0)

    // Debt = The live balance stored in the database (which is already updated by sales/payments)
    const currentDebt = Number(customer.debt) || 0

    const totalFreeTanks = (sales || [])
      .filter(s => s.sale_type === 'free')
      .reduce((acc: number, s) => {
        const itemsList = s.items as unknown as { quantity: number }[] | null
        return acc + (itemsList?.reduce((a: number, i) => a + Number(i.quantity || 0), 0) || 0)
      }, 0)

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
        totalTanksBought: (sales || []).reduce((acc: number, s) => {
          const itemsList = s.items as unknown as { quantity: number }[] | null
          return acc + (itemsList?.reduce((a: number, i) => a + Number(i.quantity || 0), 0) || 0)
        }, 0)
      }
    }
  } catch (e) {
    console.error('getCustomerDetailedData Exception:', e)
    return null
  }
}
