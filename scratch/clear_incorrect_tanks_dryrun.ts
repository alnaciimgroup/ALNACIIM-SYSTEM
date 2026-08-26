import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function dryRun() {
  console.log('Fetching all customers for duplicate tank audit...');
  let allCustomers = [];
  let start = 0;
  const limit = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, tank_number, phone, status, customer_type, guarantor')
      .range(start, start + limit - 1);
      
    if (error) {
      console.error('Error fetching customers:', error);
      break;
    }
    if (!data || data.length === 0) break;
    allCustomers = allCustomers.concat(data);
    start += limit;
  }

  console.log(`Fetched ${allCustomers.length} total customers.`);

  // Group by tank_number
  const groups = {};
  allCustomers.forEach(c => {
    const tank = (c.tank_number || '').trim();
    if (tank) {
      if (!groups[tank]) {
        groups[tank] = [];
      }
      groups[tank].push(c);
    }
  });

  const sharedTanks = Object.keys(groups)
    .map(tank => {
      const customers = groups[tank];
      const uniqueNames = new Set(
        customers.map(c => c.name.toLowerCase().trim().replace(/\s+/g, ' '))
      );
      
      return {
        tank,
        uniqueCount: uniqueNames.size,
        totalCount: customers.length,
        customers
      };
    })
    .filter(g => g.uniqueCount > 1)
    .sort((a, b) => b.uniqueCount - a.uniqueCount || b.totalCount - a.totalCount);

  console.log(`Found ${sharedTanks.length} shared tank numbers.`);

  let totalToClear = 0;
  sharedTanks.forEach(g => {
    const correctCustomer = g.customers[g.customers.length - 1];
    const incorrectCustomers = g.customers.slice(0, g.customers.length - 1);
    totalToClear += incorrectCustomers.length;
    
    console.log(`Tank ${g.tank}:`);
    console.log(`  [KEEP TANK] -> ${correctCustomer.name} (ID: ${correctCustomer.id})`);
    incorrectCustomers.forEach(ic => {
      console.log(`  [CLEAR TANK] -> ${ic.name} (ID: ${ic.id})`);
    });
  });

  console.log(`\nDRY RUN SUMMARY:`);
  console.log(`Total shared tanks: ${sharedTanks.length}`);
  console.log(`Total customers whose tank number will be cleared: ${totalToClear}`);
}

dryRun();
