import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const targetTanks = ['12200', '11100', '11200', '11210', '11350'];
  
  // 1. Check if these tank numbers exist in the customers table at all
  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, name, tank_number, status')
    .in('tank_number', targetTanks);

  console.log('Error:', error);
  console.log('Found Customers:', customers);

  // 2. Let's do a partial/like check to see if there are similar ones or if they are stored differently
  for (const tank of targetTanks) {
    const { data: approx } = await supabase
      .from('customers')
      .select('id, name, tank_number, status')
      .ilike('tank_number', `%${tank}%`)
      .limit(3);
    console.log(`Approx search for ${tank}:`, approx);
  }
}
test();
