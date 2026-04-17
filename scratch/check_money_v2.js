
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ifgmzgofehlmgfsfabrb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmZ216Z29mZWhsbWdmc2ZhYnJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2NDA1MSwiZXhwIjoyMDkwMDQwMDUxfQ.Rcl7R3Gfw3XSXKHUs9bikAC1qC7EU01In9zgrXtr-vw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findTheDiscrepancy() {
  const staffId = '93291237-e6c4-40f6-9f5d-8a7742a6cbc0'; // correct faarax ID
  
  // 1. Audit Sales
  const { data: sales } = await supabase.from('sales').select('id, total_amount, sale_type, created_at').eq('staff_id', staffId);
  console.log('--- SALES ---');
  sales.forEach(s => console.log(`${s.created_at.split('T')[0]}: ${s.sale_type} - $${s.total_amount}`));
  
  // 2. Audit Payments
  const { data: payments } = await supabase.from('payments').select('amount, payment_method, created_at, sales!inner(staff_id)').eq('sales.staff_id', staffId);
  console.log('\n--- PAYMENTS ---');
  payments.forEach(p => console.log(`${p.created_at.split('T')[0]}: $${p.amount}`));
  
  // 3. Audit Submissions
  const { data: subs } = await supabase.from('cash_submissions').select('money_collected, submitted_amount, status, submission_date').eq('staff_id', staffId);
  console.log('\n--- SUBMISSIONS ---');
  subs.forEach(s => console.log(`${s.submission_date}: $${s.money_collected} (${s.status})`));
}

findTheDiscrepancy();
