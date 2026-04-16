'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { verifySession } from '@/utils/auth'
import { ReviewSubmissionSchema } from '@/utils/validation'
import { logAction } from '@/utils/audit'

export async function getReviewSummary() {
  await verifySession(['accountant'])
  const supabase = await createClient()

  // 1. Fetch only what is needed (Verified totals and Pending count)
  const [
    { data: verifiedSubmissions },
    { data: pendingSubmissions }
  ] = await Promise.all([
    supabase.from('cash_submissions').select('amount').eq('status', 'verified'),
    supabase.from('cash_submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending')
  ])

  const totalSubmitted = verifiedSubmissions?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0
  const pendingCount = pendingSubmissions?.length || 0 // If head: true is used, length is of data which is [] but we want count
  
  // Refetching count properly if head: true was confusing
  const { count: realPending } = await supabase.from('cash_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending')

  const totalCollected = totalSubmitted 
  const totalDifference = totalCollected - totalSubmitted

  return {
    totalCollected,
    totalSubmitted,
    totalDifference,
    pendingCount: realPending || 0
  }
}

export async function updateSubmissionStatus(id: string, status: string, note?: string, submittedAmount?: number) {
  const { role } = await verifySession(['accountant'])
  const supabase = await createClient()

  const validated = ReviewSubmissionSchema.safeParse({ 
    id, 
    status, 
    note, 
    submitted_amount: submittedAmount 
  })
  
  if (!validated.success) {
    throw new Error(validated.error.issues[0].message)
  }

  const updateData: any = { 
    status: validated.data.status, 
    note: validated.data.note || null,
    updated_at: new Date().toISOString()
  }

  // If amount was edited, update both the amount and the difference
  if (validated.data.submitted_amount !== undefined) {
    updateData.submitted_amount = validated.data.submitted_amount
    
    // We need the original money_collected to recompute difference
    const { data: sub } = await supabase
      .from('cash_submissions')
      .select('money_collected')
      .eq('id', id)
      .single()
    
    if (sub) {
      updateData.difference_amount = validated.data.submitted_amount - Number(sub.money_collected)
    }
  }

  const { error } = await supabase
    .from('cash_submissions')
    .update(updateData)
    .eq('id', validated.data.id)

  if (error) {
    console.error('Update Status Error:', error)
    throw new Error('Failed to update submission status')
  }

  await logAction(status === 'verified' ? 'VERIFY_SUBMISSION' : status === 'disputed' ? 'DISPUTE_SUBMISSION' : 'EDIT_SUBMISSION', {
    targetTable: 'cash_submissions',
    targetId: id,
    details: { status, note, submittedAmount }
  })

  revalidatePath('/dashboard/accountant/submissions')
}

export async function getSubmissionBreakdown(staffId: string, date: string) {
  const { role } = await verifySession(['accountant'])
  const supabase = await createClient()

  const start = `${date}T00:00:00.000Z`
  const end = `${date}T23:59:59.999Z`

  const [
    { data: sales },
    { data: payments }
  ] = await Promise.all([
    supabase.from('sales').select(`
      id, created_at, total_amount, sale_type,
      customer:customers(name),
      items:sale_items(quantity, items(name))
    `)
    .eq('staff_id', staffId)
    .gte('created_at', start)
    .lte('created_at', end),
    
    supabase.from('payments').select(`
      amount, payment_method, created_at,
      sale:sales!inner(customer_id, customers(name))
    `)
    .eq('sales.staff_id', staffId)
    .eq('payment_method', 'debt_repayment')
    .gte('created_at', start)
    .lte('created_at', end)
  ])

  return {
    sales: sales || [],
    payments: payments || []
  }
}
