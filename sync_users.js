import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function syncUsers() {
  console.log('Fetching auth users...')
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
  
  if (authError) {
    console.error('Error fetching auth users:', authError)
    process.exit(1)
  }
  
  console.log(`Found ${users.length} users in auth.`)
  
  for (const u of users) {
    const role = u.user_metadata?.role || u.app_metadata?.role || 'staff'
    const full_name = u.user_metadata?.full_name || u.user_metadata?.name || u.email.split('@')[0]
    const phone = u.user_metadata?.phone || null
    
    console.log(`Inserting user ${u.email} as ${role}...`)
    
    // We try to insert with basic fields
    const { error: insertError } = await supabase.from('users').upsert({
      id: u.id,
      full_name: full_name,
      role: role,
      created_at: u.created_at
    })
    
    if (insertError) {
      console.error(`Failed to insert ${u.email}:`, insertError)
    } else {
      console.log(`Successfully synced ${u.email}`)
    }
  }
  
  console.log('Done syncing users!')
}

syncUsers()
