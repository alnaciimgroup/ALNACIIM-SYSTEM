import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteUsers() {
  const emailsToDelete = ['jamal@gmail.com', 'faarax@gmail.com', 'mohamed@gmail.com'];
  
  const { data: authUsers, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  const usersToDelete = authUsers.users.filter(u => emailsToDelete.includes(u.email));
  
  if (usersToDelete.length === 0) {
    console.log("None of those emails were found in the system.");
    return;
  }

  for (const user of usersToDelete) {
    const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
    if (delError) {
      console.error(`Error deleting ${user.email}:`, delError);
    } else {
      console.log(`Successfully deleted ${user.email}`);
    }
  }
}

deleteUsers();
