import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: Missing Supabase environment variables in .env.local')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function deleteCustomersAndTransactions() {
  console.log('Starting Customer and Transaction Data Deletion...')
  const dummyId = '00000000-0000-0000-0000-000000000000'

  const tablesToDelete = [
    { name: 'customer_followups', hasId: true },
    { name: 'payments', hasId: true },
    { name: 'sale_items', hasId: true },
    { name: 'sales', hasId: true },
    { name: 'customers', hasId: true }
  ]

  for (const table of tablesToDelete) {
    console.log(`Wiping all records from table: ${table.name}...`)
    
    // Deleting all rows by filtering for anything not matching a dummy UUID
    const { error, count } = await supabase
      .from(table.name)
      .delete({ count: 'exact' })
      .neq('id', dummyId)

    if (error) {
      console.error(`❌ Failed to clear ${table.name}:`, error.message)
    } else {
      console.log(`✅ SUCCESS: Wiped ${table.name}.`)
    }
  }

  console.log('All customer and dependent transaction records have been safely cleared.')
}

deleteCustomersAndTransactions()
