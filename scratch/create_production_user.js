import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createProductionUser() {
  const email = 'production@alnaciim.com';
  const password = 'Password123!';
  const fullName = 'Production Manager';
  const role = 'production';

  console.log(`Creating ${role} user: ${email}...`);

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
        console.log('User already exists in auth.');
        // Fetch user to ensure metadata is updated
        const { data: users } = await supabase.auth.admin.listUsers();
        const user = users.users.find(u => u.email === email);
        if (user) {
            await supabase.auth.admin.updateUserById(user.id, { user_metadata: { full_name: fullName, role }, password });
            console.log('Updated existing auth user.');
        }
    } else {
        console.error('Auth Error:', authError);
        return;
    }
  }

  // 2. Fetch the user again to get ID
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);

  if (user) {
    // 3. Upsert into public.users
    const { error: dbError } = await supabase.from('users').upsert({
      id: user.id,
      full_name: fullName,
      role: role,
    });

    if (dbError) {
      console.error('DB Error:', dbError);
    } else {
      console.log('Successfully added/updated production user in public.users!');
    }
  }
}

createProductionUser();
