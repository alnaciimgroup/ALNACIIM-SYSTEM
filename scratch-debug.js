const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: users } = await supabase.from('users').select('id, full_name').eq('role', 'staff');
  console.log("STAFF:");
  console.log(users.map(u => u.full_name + ' : ' + u.id));

  const { data: dists } = await supabase.from('distributions').select('staff_id, quantity, liters, status');
  console.log("\nDISTRIBUTIONS:");
  console.log(dists);

  const { data: sales } = await supabase.from('sale_items').select('quantity, free_quantity, sales(staff_id, status)');
  console.log("\nSALES:");
  console.log(sales);
}
run();
