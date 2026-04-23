'use server'

// @ts-nocheck
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getDailySummary(selectedDate?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const date = selectedDate || new Date().toISOString().split('T')[0]
  
  // 4 AM Rollover Logic (matches getStaffDashboardData)
  const startOfDay = `${date}T04:00:00.000Z`
  const nextDay = new Date(date)
  nextDay.setDate(nextDay.getDate() + 1)
  const endOfDay = `${nextDay.toISOString().split('T')[0]}T03:59:59.999Z`

  // 1. Fetch Tanks Received Today
  const { data: receivedData } = await supabase
    .from('distributions')
    .select('quantity')
    .eq('staff_id', user.id)
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay)

  const tanksReceived = receivedData?.reduce((acc: number, curr) => acc + curr.quantity, 0) || 0

  // 2. Fetch Sales Today (Tanks Sold & Revenue)
  const { data: salesData } = await supabase
    .from('sales')
    .select(`
      total_amount,
      sale_type,
      sale_items(quantity)
    `)
    .eq('staff_id', user.id)
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay)

  let tanksSold = 0
  let cashSalesTotal = 0
  let creditSalesTotal = 0

  salesData?.forEach(sale => {
    const qty = (sale.sale_items as any)?.reduce((acc: number, curr: any) => acc + curr.quantity, 0) || 0
    tanksSold += qty
    if (sale.sale_type === 'cash') {
      cashSalesTotal += Number(sale.total_amount)
    } else {
      creditSalesTotal += Number(sale.total_amount)
    }
  })

  // 3. Fetch Payments Received Today (repayments for debt AND auto-cash deposits)
  const { data: paymentsData } = await supabase
    .from('payments')
    .select(`
      amount,
      payment_method,
      sale:sales!inner(staff_id)
    `)
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay)
    .eq('sale.staff_id', user.id)

  const debtPayments = paymentsData
    ?.filter(p => p.payment_method === 'debt_repayment')
    ?.reduce((acc: number, curr) => acc + Number(curr.amount), 0) || 0

  const totalMoneyCollected = (paymentsData?.reduce((acc: number, curr) => acc + Number(curr.amount), 0) || 0) || cashSalesTotal + debtPayments

  // Optional: Also calculate Outstanding Debt for the daily report context
  const { data: customers } = await supabase
    .from('customers')
    .select('debt')
    .eq('staff_id', user.id)

  const outstandingDebt = customers?.reduce((acc: number, c) => acc + Number(c.debt || 0), 0) || 0

  // 4. Fetch Submission Status for Today
  const { data: submissionData } = await supabase
    .from('cash_submissions')
    .select('status, difference_amount')
    .eq('staff_id', user.id)
    .eq('submission_date', date)
    .single()

  return {
    date,
    tanksReceived,
    tanksSold,
    cashSalesTotal,
    creditSalesTotal,
    debtPayments: Math.max(0, debtPayments),
    totalMoneyCollected,
    outstandingDebt,
    submissionStatus: submissionData?.status || null,
    submissionDifference: submissionData?.difference_amount || 0
  }
}

export async function submitCashSubmission(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Unauthorized', error: true }

  const submission_date = formData.get('submission_date') as string
  const tanks_sold = parseInt(formData.get('tanks_sold') as string)
  const money_collected = parseFloat(formData.get('money_collected') as string)
  const submitted_amount = parseFloat(formData.get('submitted_amount') as string)
  const note = formData.get('note') as string

  if (isNaN(submitted_amount) || submitted_amount < 0) {
    return { message: 'Please enter a valid amount.', error: true }
  }

  const difference_amount = money_collected - submitted_amount

  const supabaseAdmin = createAdminClient()

  // Prevent multiple submissions for the same day
  const { data: existing } = await supabaseAdmin
    .from('cash_submissions')
    .select('id')
    .eq('staff_id', user.id)
    .eq('submission_date', submission_date)
    .single()

  if (existing) {
    return { message: 'You have already submitted a report for this date. It cannot be changed once submitted.', error: true }
  }

  const submissionPayload = {
    staff_id: user.id,
    submission_date,
    tanks_sold,
    money_collected,
    submitted_amount,
    amount: submitted_amount, // Legacy compatibility
    difference_amount,
    note,
    status: 'pending'
  }

  const { error } = await supabaseAdmin
    .from('cash_submissions')
    .insert(submissionPayload)

  if (error) {
    console.error('FINAL SCORCHED EARTH ERROR:', error)
    return {
      message: `Critial Failure: ${error.message}. Please contact support.`,
      error: true
    }
  }

  revalidatePath('/dashboard/staff/daily-report')
  revalidatePath('/dashboard/staff')
  revalidatePath('/dashboard/accountant/submissions')
  return { message: 'Report submitted successfully!', error: false }
}
