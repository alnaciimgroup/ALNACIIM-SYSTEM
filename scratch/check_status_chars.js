import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data } = await supabase
    .from('customers')
    .select('id, name, status, tank_number')
    .eq('tank_number', '11100')
    .single();

  if (data) {
    const value = data.status;
    const charCodes = [];
    for (let i = 0; i < value.length; i++) {
      charCodes.push(value.charCodeAt(i));
    }
    console.log(`Customer: "${data.name}"`);
    console.log(`  Status Value: "${value}" (Length: ${value.length})`);
    console.log(`  Char Codes:  [${charCodes.join(', ')}]`);
  }
}
test();
