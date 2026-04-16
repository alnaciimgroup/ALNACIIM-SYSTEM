import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function migrateAccounts() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const accounts = [
    { email: 'superadmin@alnaciim.com', password: 'super123', role: 'superadmin', full_name: 'superadmin' },
    { email: 'jaamac@gmail.com', password: '12345678', role: 'accountant', full_name: 'Jaamac (Accountant)' },
    { email: 'mohamed@gmail.com', password: '12345678', role: 'agent', full_name: 'Mohamed (Agent)' },
    { email: 'faarax@gmail.com', password: '12345678', role: 'staff', full_name: 'Faarax (Staff)' }
  ]

  console.log(`🚀 Starting Account Migration...`)

  for (const acc of accounts) {
    console.log(`\nCreating ${acc.role}: ${acc.email}...`)

    // 1. Create Auth Identity
    const { data, error } = await supabase.auth.admin.createUser({
      email: acc.email,
      password: acc.password,
      email_confirm: true,
      user_metadata: { role: acc.role },
      app_metadata: { role: acc.role }
    })

    if (error) {
      console.error(`❌ Failed to create Auth Identity for ${acc.email}:`, error.message)
      continue
    }

    // 2. Synchronize to public.users mapping
    const { error: syncError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        full_name: acc.full_name,
        role: acc.role
      })

    if (syncError) {
      console.error(`❌ Failed to sync Public User for ${acc.email}:`, syncError.message)
    } else {
      console.log(`✅ Successfully seeded: ${acc.email} (${acc.role})`)
    }
  }
  
  console.log('\n🎉 All accounts processed!')
}

migrateAccounts()
