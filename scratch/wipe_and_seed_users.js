import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function wipeAndSeedUsers() {
  console.log('Fetching all existing users...');
  const { data: users, error: fetchErr } = await supabase.auth.admin.listUsers();
  
  if (fetchErr) {
    console.error('Failed to fetch users:', fetchErr);
    return;
  }

  console.log(`Found ${users.users.length} users. Deleting them all...`);
  
  // Delete all auth users (this should cascade to public.users via trigger)
  for (const user of users.users) {
    console.log(`Deleting ${user.email}...`);
    await supabase.auth.admin.deleteUser(user.id);
  }

  // Double check public.users is empty and wipe if not
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('All users wiped! Seeding the 5 Big Perfect Users...');

  const bigRoles = [
    { email: 'superadmin@alnaciim.com', role: 'superadmin', name: 'Superadmin Boss' },
    { email: 'accountant@alnaciim.com', role: 'accountant', name: 'Finance Officer' },
    { email: 'agent@alnaciim.com', role: 'agent', name: 'Logistics Manager' },
    { email: 'staff@alnaciim.com', role: 'staff', name: 'Sales Storekeeper' },
    { email: 'production@alnaciim.com', role: 'production', name: 'Production Tech' }
  ];

  for (const user of bigRoles) {
    console.log(`Creating ${user.email}...`);
    
    // 1. Create Auth User
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: user.email,
      password: 'Password123!',
      email_confirm: true,
      user_metadata: { full_name: user.name, role: user.role }
    });

    if (authErr) {
      console.error(`Failed to create ${user.email} in Auth:`, authErr.message);
      continue;
    }

    // 2. Insert into public.users
    const { error: dbErr } = await supabase.from('users').upsert({
      id: authData.user.id,
      full_name: user.name,
      role: user.role
    });

    if (dbErr) {
      console.error(`DB Error for ${user.email}:`, dbErr.message);
    } else {
      console.log(`✅ Successfully created ${user.email} (Password: Password123!)`);
    }
  }

  console.log('--- Done ---');
}

wipeAndSeedUsers();
