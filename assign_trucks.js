import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function assignTrucks() {
  // 1. Fetch all staff members
  const { data: staffList, error: fetchError } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('role', 'staff')
    .order('full_name')

  if (fetchError) {
    console.error('Error fetching staff:', fetchError)
    return
  }

  if (!staffList || staffList.length === 0) {
    console.log('No staff members found.')
    return
  }

  // 2. Clear existing dummy trucks we created earlier
  await supabase.from('trucks').delete().neq('capacity_liters', 0)

  // 3. Assign a truck to each staff member
  const trucksToInsert = staffList.map((staff, index) => {
    // Format index to be '01', '02', '03' etc.
    const truckNumber = (index + 1).toString().padStart(2, '0')
    return {
      plate_number: `TRK-${truckNumber}`,
      capacity_liters: 10000,
      driver_id: staff.id
    }
  })

  const { error: insertError } = await supabase
    .from('trucks')
    .insert(trucksToInsert)

  if (insertError) {
    console.error('Error inserting trucks:', insertError)
  } else {
    console.log(`Successfully assigned ${trucksToInsert.length} trucks to staff members!`)
  }
}

assignTrucks()
