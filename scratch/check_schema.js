const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('sales_orders').select('*').limit(1);
  console.log('sales_orders columns:', Object.keys(data?.[0] || {}));
  
  const { data: data2 } = await supabase.from('sales_order_items').select('*').limit(1);
  console.log('sales_order_items columns:', Object.keys(data2?.[0] || {}));
}
run();
