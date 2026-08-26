import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: authUsers, error } = await supabase.auth.admin.listUsers();
  if (error) return console.error(error);

  for (const user of authUsers.users) {
    if (user.email.endsWith('@alnaciim.com')) {
      console.log(`Resetting password for ${user.email}...`);
      const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
        password: 'password123',
        email_confirm: true
      });
      if (updateErr) {
        console.error(`Failed to reset ${user.email}:`, updateErr.message);
      } else {
        console.log(`Successfully reset ${user.email}`);
      }
    }
  }
}
run();
