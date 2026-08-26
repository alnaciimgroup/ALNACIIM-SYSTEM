import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'staff@alnaciim.com',
    password: 'password123'
  });
  if (authErr) return console.error(authErr);

  const { data, error } = await supabase.from('customers').select('*');
  console.log('Customers fetched as staff:', data?.length);
  if (error) console.error(error);
}
run();
