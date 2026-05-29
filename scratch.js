const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function check() {
  let q = supabase.from('distributions').select('id, quantity').eq('status', 'completed');
  q = q.gte('created_at', '2026-05-29T21:00:00.000Z');
  
  const { data, error } = await q.select('id, quantity');
  console.log("With second select:", data?.length, error);

  let q2 = supabase.from('distributions').select('id, quantity').eq('status', 'completed');
  q2 = q2.gte('created_at', '2026-05-29T21:00:00.000Z');
  
  const { data: d2, error: e2 } = await q2;
  console.log("Without second select:", d2?.length, e2);
}
check();
