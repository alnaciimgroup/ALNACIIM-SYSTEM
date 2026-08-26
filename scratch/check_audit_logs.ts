import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .gte('created_at', oneHourAgo);
    
  console.log('Recent audit logs:', data, error);
}
test();
