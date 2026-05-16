'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { verifySession } from '@/utils/auth'
import { revalidatePath } from 'next/cache'

export async function logProduction(prevState: any, formData: FormData) {
  try {
    const { user } = await verifySession(['superadmin'])
    const supabase = createAdminClient()

    const litersStr = formData.get('liters') as string
    const liters = parseInt(litersStr, 10)

    if (isNaN(liters) || liters <= 0) {
      return { message: 'Invalid liters amount. Must be a positive number.', error: true }
    }

    const { error } = await supabase
      .from('production_logs')
      .insert({
        superadmin_id: user.id,
        liters_produced: liters
      })

    if (error) {
      console.error('Error inserting production log:', error)
      return { message: 'Failed to record production.', error: true }
    }

    revalidatePath('/dashboard/superadmin')
    return { message: `Successfully recorded ${liters.toLocaleString()} Liters of production.`, error: false }
  } catch (error) {
    console.error('logProduction exception:', error)
    return { message: 'An unexpected error occurred.', error: true }
  }
}
