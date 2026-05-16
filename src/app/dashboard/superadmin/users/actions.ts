'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { verifySession } from '@/utils/auth'
import { logAction } from '@/utils/audit'

export async function createSystemUser(formData: FormData) {
  await verifySession(['superadmin'])
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string

  if (!email || !password || !role) {
    return { message: 'Email, password, and role are required.', error: true }
  }

  try {
    const supabase = createAdminClient()

    // 1. Create the user with the Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { role },
      app_metadata: { role } // Store role in app_metadata for security
    })

    if (error) {
      console.error('User Creation Error:', error)
      return { message: error.message, error: true }
    }

    // 2. Sync to public.users table immediately
    const full_name = email.split('@')[0]
    const { error: syncError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        full_name,
        role: role as any
      })

    if (syncError) {
      console.error('Public User Sync Error:', syncError)
      // Even if sync fails, the auth user is created. But we should report it.
      return { message: `Account created, but identity sync failed: ${syncError.message}`, error: true }
    }

    // 3. Register Truck if Staff Role
    if (role === 'staff') {
      const truckPlate = formData.get('truck_plate') as string
      const truckCapacityStr = formData.get('truck_capacity') as string

      if (truckPlate && truckCapacityStr) {
        const capacityLiters = parseInt(truckCapacityStr, 10)
        if (!isNaN(capacityLiters) && capacityLiters > 0) {
          const { error: truckError } = await supabase
            .from('trucks')
            .insert({
              plate_number: truckPlate,
              capacity_liters: capacityLiters,
              driver_id: data.user.id
            })

          if (truckError) {
            console.error('Truck Registration Error:', truckError)
            return { message: `Account created, but truck registration failed: ${truckError.message}`, error: true }
          }
        }
      }
    }

    await logAction('CREATE_USER', { 
      targetTable: 'users', 
      targetId: data.user.id, 
      details: { email, role } 
    })

    revalidatePath('/dashboard/superadmin')
    return { message: `Successfully created ${role} account for ${email}!`, error: false }
  } catch (err: any) {
    console.error('Admin Client Error:', err)
    if (err.message.includes('Service Role Key')) {
      return { 
        message: 'Missing SUPABASE_SERVICE_ROLE_KEY! Please add it to your .env.local file.', 
        error: true 
      }
    }
    return { message: 'Internal server error.', error: true }
  }
}

export async function deleteSystemUser(id: string) {
  const { user } = await verifySession(['superadmin'])
  
  if (user.id === id) {
    return { message: 'Security Policy: You cannot recursively drop your own Superadmin account.', error: true }
  }

  try {
    const supabase = createAdminClient()

    // 1. Delete from Secure Auth Container
    const { error: authError } = await supabase.auth.admin.deleteUser(id)
    if (authError) {
      console.error('Auth User Deletion Error:', authError)
      return { message: `Auth purge failed: ${authError.message}`, error: true }
    }

    // 2. Clear Public Identity Registry (if not cascaded)
    const { error: dbError } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      
    if (dbError) {
      console.error('Public identity row drop failed (possibly handled by cascade):', dbError)
    }

    await logAction('DELETE_USER', { targetTable: 'users', targetId: id })
    revalidatePath('/dashboard/superadmin')
    
    return { message: 'Identity successfully purged.', error: false }
  } catch (err: any) {
    console.error('Catastrophic Delete Error:', err)
    return { message: 'A catastrophic system error prevented deletion.', error: true }
  }
}
