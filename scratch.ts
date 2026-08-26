import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

import { getAccountantOverview } from './src/app/dashboard/accountant/actions'

async function check() {
  try {
    const data = await getAccountantOverview()
    console.log('RECENT ACTIVITY COUNT:', data.recentActivity.length)
    console.log('RECENT ACTIVITY SAMPLES:')
    data.recentActivity.forEach((act: any, idx: number) => {
      console.log(`\n--- Item ${idx + 1} (${act.type}) ---`)
      console.log(JSON.stringify(act, null, 2))
    })
  } catch (err) {
    console.error('ERROR RUNNING OVERVIEW:', err)
  }
}
check()
