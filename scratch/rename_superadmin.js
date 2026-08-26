import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching superadmin users...');
  
  // 1. Update users table (if 'superadmin' exists)
  const { data: dbUsers, error: dbErr } = await supabase.from('users').select('*').eq('role', 'superadmin');
  if (dbErr) console.error('DB Error:', dbErr);
  
  for (const u of dbUsers || []) {
    console.log(`Updating users table for ${u.email}`);
    await supabase.from('users').update({ role: 'manager' }).eq('id', u.id);
  }

  // 2. Update Auth app_metadata
  const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) return console.error('Auth Error:', authErr);

  for (const u of authUsers.users) {
    const r = u.user_metadata?.role || u.app_metadata?.role;
    if (r === 'superadmin') {
      console.log(`Updating Auth metadata for ${u.email}`);
      await supabase.auth.admin.updateUserById(u.id, {
        user_metadata: { ...u.user_metadata, role: 'manager' },
        app_metadata: { ...u.app_metadata, role: 'manager' }
      });
    }
  }
  
  console.log('Done renaming role in database.');
}
run();
