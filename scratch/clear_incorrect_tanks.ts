import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function executeClearance() {
  console.log('Fetching all customers for duplicate tank clearance...');
  let allCustomers = [];
  let start = 0;
  const limit = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, tank_number, phone')
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

  // Identify incorrect customers (all except the last one in each group)
  const incorrectIds = [];
  const sharedTanksCount = { count: 0 };
  
  Object.keys(groups).forEach(tank => {
    const customers = groups[tank];
    
    // Check unique names in this group to confirm it is actually shared by different people
    const uniqueNames = new Set(
      customers.map(c => c.name.toLowerCase().trim().replace(/\s+/g, ' '))
    );
    
    if (uniqueNames.size > 1) {
      sharedTanksCount.count++;
      const incorrectCustomersInGroup = customers.slice(0, customers.length - 1);
      incorrectCustomersInGroup.forEach(c => {
        incorrectIds.push(c.id);
      });
    }
  });

  console.log(`Found ${sharedTanksCount.count} shared tank IDs.`);
  console.log(`Identified ${incorrectIds.length} customer profiles to clear the tank ID from.`);

  if (incorrectIds.length === 0) {
    console.log('No duplicate tank assignments found. Database is already clean.');
    return;
  }

  // Perform bulk update to set tank_number = null for incorrect customer profiles
  console.log(`Updating database... Setting tank_number = null for ${incorrectIds.length} customers...`);
  
  // We can do it in batches of 100 to be perfectly safe and display progress
  const batchSize = 100;
  let successCount = 0;
  
  for (let i = 0; i < incorrectIds.length; i += batchSize) {
    const batch = incorrectIds.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('customers')
      .update({ tank_number: null })
      .in('id', batch)
      .select('id');
      
    if (error) {
      console.error(`Failed to update batch starting at index ${i}:`, error);
    } else {
      successCount += data?.length || 0;
      console.log(`Updated batch [${i} to ${Math.min(i + batchSize, incorrectIds.length)}]: Successfully cleared ${data?.length || 0} rows.`);
    }
  }

  console.log(`Database clearance completed! Successfully cleared tank ID for ${successCount} customers.`);
}

executeClearance();
