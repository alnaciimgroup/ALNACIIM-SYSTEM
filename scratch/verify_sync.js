
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ifgmzgofehlmgfsfabrb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmZ216Z29mZWhsbWdmc2ZhYnJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2NDA1MSwiZXhwIjoyMDkwMDQwMDUxfQ.Rcl7R3Gfw3XSXKHUs9bikAC1qC7EU01In9zgrXtr-vw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySync() {
  const staffId = '47e335da-6663-42e1-9599-2476595ce940'; // faarax
  
  // 1. Get raw submissions
  const { data: subs } = await supabase.from('cash_submissions').select('money_collected').eq('staff_id', staffId).eq('status', 'verified');
  const rawSubTotal = subs.reduce((a, b) => a + Number(b.money_collected), 0);
  console.log('Raw Submissions Total:', rawSubTotal);

  // 2. Get Sales Total
  const { data: sales } = await supabase.from('sales').select('total_amount').eq('staff_id', staffId);
  const salesTotal = sales.reduce((a, b) => a + Number(b.total_amount), 0);
  console.log('Sales Total:', salesTotal);
  
  // 3. Get Payments (replenishing debt)
  const { data: payments } = await supabase.from('payments').select('amount').eq('payment_method', 'debt_repayment');
  // Need to filter by staff... payments don't have staff_id. They have sale_id.
  const { data: staffPayments } = await supabase.from('payments').select('amount, sales!inner(staff_id)').eq('sales.staff_id', staffId);
  const payTotal = staffPayments.reduce((a, b) => a + Number(b.amount), 0);
  console.log('Payments Total:', payTotal);
}

verifySync();
