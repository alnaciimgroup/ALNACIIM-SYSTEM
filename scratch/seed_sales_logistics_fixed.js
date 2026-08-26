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
    { name: 'Al-Naciim Retail Store', customer_type: 'retail', address: 'Mogadishu' },
    { name: 'Mogadishu Wholesale', customer_type: 'regular', address: 'Mogadishu' }
  ]).select();
  if (cErr) { console.error("Error customers", cErr); return; }
  console.log("Customers created:", customers.length);

  // 2. Create Trucks
  const { data: trucks, error: tErr } = await supabase.from('trucks').insert([
    { plate_number: 'TRK-9001', capacity_liters: 10000, status: 'active' },
    { plate_number: 'TRK-9002', capacity_liters: 5000, status: 'active' }
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
