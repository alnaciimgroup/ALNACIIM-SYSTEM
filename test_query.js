import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
async function test() {
  const staffId = '93291237-e6c4-40f6-9f5d-8a7742a6cbc0'
  const { data, error } = await supabase.from('sales').select('id, total_amount, sale_type, created_at, custom_sale_id, sale_items(quantity, unit_price), customer:customers(name)').eq('staff_id', staffId).order('created_at', { ascending: false })
  console.log("Error:", error)
  console.log("Data length:", data ? data.length : 0)
}
test()
