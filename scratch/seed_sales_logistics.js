import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Seeding Sales & Logistics...");

  // 1. Create Customers
  const { data: customers, error: cErr } = await supabase.from('customers').insert([
    { code: 'CUST-001', name: 'Al-Naciim Retail Store', type: 'retail', credit_limit: 5000, city: 'Mogadishu' },
    { code: 'CUST-002', name: 'Mogadishu Wholesale', type: 'wholesale', credit_limit: 20000, city: 'Mogadishu' }
  ]).select();
  if (cErr) { console.error("Error customers", cErr); return; }
  console.log("Customers created:", customers.length);

  // 2. Create Trucks
  const { data: trucks, error: tErr } = await supabase.from('trucks').insert([
    { plate_number: 'TRK-9001', capacity: 10000, capacity_unit: 'Liters', status: 'active' },
    { plate_number: 'TRK-9002', capacity: 5000, capacity_unit: 'Liters', status: 'active' }
  ]).select();
  if (tErr) { console.error("Error trucks", tErr); return; }
  console.log("Trucks created:", trucks.length);

  // 3. Create a Sales Order
  const { data: order, error: oErr } = await supabase.from('sales_orders').insert({
    order_number: 'ORD-10001',
    customer_id: customers[0].id,
    status: 'approved',
    payment_status: 'unpaid',
    subtotal: 500,
    total_amount: 500
  }).select().single();
  if (oErr) { console.error("Error order", oErr); return; }
  
  // 4. Create a Delivery (for Logistics)
  // Need to get the driver_id which is a UUID from auth.users...
  // Let's get the first user to be the driver.
  const { data: users } = await supabase.auth.admin.listUsers();
  const driverId = users?.users[0]?.id;

  if (driverId) {
    const { error: dErr } = await supabase.from('deliveries').insert({
      sales_order_id: order.id,
      truck_id: trucks[0].id,
      driver_id: driverId,
      status: 'scheduled',
      delivery_address: 'Mogadishu Main Road'
    });
    if (dErr) console.error("Error delivery", dErr);
    else console.log("Delivery assigned to user:", users.users[0].email);
  }

  console.log("Seeding complete!");
}

seed();
