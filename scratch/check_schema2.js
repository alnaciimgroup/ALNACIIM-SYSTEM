const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('get_roles'); // ignore
  const { data: item } = await supabase.from('sales_order_items').select('*').limit(1);
  if (item && item.length > 0) {
     console.log('Columns:', Object.keys(item[0]));
  } else {
     // fallback to raw query
     const { data: col } = await supabase.from('sales_order_items').select().limit(0);
     console.log('No rows, cant check keys using JS object. Using psql');
  }
}
run();
