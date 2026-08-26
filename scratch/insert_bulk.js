const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('products').insert({
    id: 99,
    sku: 'BULK-RO-150',
    name: 'Bulk RO Water (150L)',
    category_id: 4, // Assume category 4 is finished goods
    product_type: 'finished_good',
    unit: 'tanks',
    unit_cost: 0,
    unit_price: 3.5, // Total price per tank
    is_active: true
  }).select();
  console.log(data, error);
}
run();
