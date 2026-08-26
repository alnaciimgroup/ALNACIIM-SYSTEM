import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: users } = await supabase.from('users').select('id, full_name, role');
  const agents = users.filter(u => u.role?.toLowerCase() === 'agent');
  
  for (const agent of agents) {
    const { data: authUser } = await supabase.auth.admin.getUserById(agent.id);
    console.log(`Agent Name: ${agent.full_name}, Email: ${authUser?.user?.email}`);
    
    // reset password for convenience just like the accountant
    await supabase.auth.admin.updateUserById(agent.id, { password: '12345678' });
  }
}

main();
