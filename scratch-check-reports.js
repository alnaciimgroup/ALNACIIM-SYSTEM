const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkReports() {
  const { data: sales, error: err1 } = await supabase.from('sales').select('created_at, staff_id');
  const { data: subs, error: err2 } = await supabase.from('cash_submissions').select('submission_date, staff_id');
  console.log("Sales:", sales);
  console.log("Submissions:", subs);
}
checkReports();
