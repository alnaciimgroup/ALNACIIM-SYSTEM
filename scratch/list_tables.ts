import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: "select table_name from information_schema.tables where table_schema = 'public';"
  });
  console.log('Tables:', data, error);
}
test();
