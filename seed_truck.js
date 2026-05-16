import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function seed() {
  const { data, error } = await supabase.from('trucks').insert([
    { plate_number: 'TRK-001', capacity_liters: 10000 },
    { plate_number: 'TRK-002', capacity_liters: 15000 }
  ])
  if (error) console.error(error)
  else console.log('Trucks seeded!')
}
seed()
