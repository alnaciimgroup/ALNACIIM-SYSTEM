import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: users } = await supabase.from('users').select('id, full_name, role');
  const accountant = users.find(u => u.role?.toLowerCase() === 'accountant');
  
  if (accountant) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      accountant.id,
      { password: '12345678' }
    );
    if (!updateError) console.log('Successfully set password to 12345678');
  }
}

main();
