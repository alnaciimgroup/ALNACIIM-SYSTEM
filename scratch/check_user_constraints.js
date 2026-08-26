import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: authUsers, error } = await supabase.auth.admin.listUsers();
  
  const jamal = authUsers.users.find(u => u.email === 'jamal@gmail.com');
  console.log("Jamal ID:", jamal?.id);
  
  if (jamal) {
    // Check if Jamal is in any tables
    const tables = ['users', 'warehouses', 'production_batches', 'truck_loads', 'sales_orders', 'deliveries'];
    for (const t of tables) {
       // Just blindly try to fetch to see if his ID is somewhere
       const {data, error} = await supabase.from(t).select('*').eq('id', jamal.id).limit(1); // wait this is wrong for fks
    }
  }
}
run();
