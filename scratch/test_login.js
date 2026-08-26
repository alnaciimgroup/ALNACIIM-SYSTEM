import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin(email, password) {
  console.log(`Testing login for ${email}...`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    console.error("Login failed:", error.message);
  } else {
    console.log("Login successful! User ID:", data.user.id);
  }
}

testLogin('staff@alnaciim.com', 'password123');
testLogin('superadmin@alnaciim.com', 'password123');
