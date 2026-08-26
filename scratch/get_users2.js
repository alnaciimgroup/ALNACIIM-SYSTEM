import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: authUsers, error: aErr } = await supabase.auth.admin.listUsers();
  if (aErr) return console.error(aErr);
  
  const { data: publicUsers, error: pErr } = await supabase.from('users').select('*');
  if (pErr) return console.error(pErr);

  const mapped = publicUsers.map(u => {
    const authUser = authUsers.users.find(au => au.id === u.id);
    return {
      Email: authUser?.email,
      Role: u.role,
      Name: u.full_name
    }
  });
  console.table(mapped);
}
run();
