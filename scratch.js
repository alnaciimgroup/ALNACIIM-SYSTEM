const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('sale_items').select('*, items(*)').limit(1);
  console.log('SALE_ITEMS ERROR:', error);
  console.log('SALE_ITEMS SAMPLE:', JSON.stringify(data, null, 2));
}
check();
