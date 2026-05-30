const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  const { data: tables, error } = await supabase.from('sales').select('id').limit(1);
  console.log("Can query sales?", !error);
}
checkSchema();
