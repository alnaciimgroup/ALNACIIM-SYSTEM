import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  console.log("Seeding factory data...");

  // Categories
  let { data: cat1 } = await supabase.from('categories').select('*').eq('name', 'Raw Materials').single();
  let { data: cat2 } = await supabase.from('categories').select('*').eq('name', 'Finished Goods').single();
  
  if (!cat1) {
    const { data } = await supabase.from('categories').insert({ name: 'Raw Materials', product_type: 'raw_material' }).select().single();
    cat1 = data;
  }
  if (!cat2) {
    const { data } = await supabase.from('categories').insert({ name: 'Finished Goods', product_type: 'finished_good' }).select().single();
    cat2 = data;
  }

  // Warehouse 
  let { data: wh } = await supabase.from('warehouses').select('*').eq('code', 'WH-MAIN').single();
  if (!wh) {
    const { data } = await supabase.from('warehouses').insert({ name: 'Main Factory Warehouse', type: 'general', code: 'WH-MAIN', location: 'Zone A' }).select().single();
    wh = data;
  }

  // Products
  if (cat1 && cat2) {
    const { error: e4 } = await supabase.from('products').insert([
      { name: 'Empty Bottles (1L)', sku: 'RAW-BOT-1L', product_type: 'raw_material', category_id: cat1.id, unit: 'pcs', reorder_level: 1000 },
      { name: 'Plastic Labels', sku: 'RAW-LBL-01', product_type: 'raw_material', category_id: cat1.id, unit: 'pcs', reorder_level: 1000 },
      { name: 'Purified Water (1L)', sku: 'FIN-WAT-1L', product_type: 'finished_good', category_id: cat2.id, unit: 'bottles', reorder_level: 500 }
    ]);
    if (e4) console.log('products error', e4);
  }

  // Machines
  const { error: e5 } = await supabase.from('machines').insert([
    { name: 'Bottling Line 1', code: 'MCH-01', type: 'FILLING_LINE', status: 'operational' },
    { name: 'Reverse Osmosis Purifier A', code: 'MCH-02', type: 'RO_PLANT', status: 'operational' }
  ]);
  if (e5) console.log('machines error', e5);
  
  // Suppliers
  const { error: e6 } = await supabase.from('suppliers').insert([
    { name: 'Global Plastics Inc.', code: 'SUP-01', contact_person: 'John Doe', email: 'john@plastics.com', phone: '555-0101' },
    { name: 'Local Spring Source', code: 'SUP-02', contact_person: 'Jane Smith', email: 'jane@springs.com', phone: '555-0202' }
  ]);
  if (e6) console.log('suppliers error', e6);

  console.log("Factory seeded successfully!");
}

seed().catch(console.error);
