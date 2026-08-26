import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('email, role, employee_code, full_name');
  
  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log('Users in database:', data);
  }
}
checkUsers();
