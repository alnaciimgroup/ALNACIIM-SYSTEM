import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const targetTanks = ['12200', '11100', '11200', '11210', '11350'];
  
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, tank_number, staff_id, users(id, full_name)')
    .in('tank_number', targetTanks);

  console.log('Error:', error);
  if (data) {
    data.forEach(c => {
      console.log(`Customer: "${c.name}" | Tank: "${c.tank_number}" | Staff ID: "${c.staff_id}" | Staff Name: "${(c.users as any)?.full_name || 'N/A'}"`);
    });
  }
}
test();
