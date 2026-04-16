
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ifgmzgofehlmgfsfabrb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmZ216Z29mZWhsbWdmc2ZhYnJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2NDA1MSwiZXhwIjoyMDkwMDQwMDUxfQ.Rcl7R3Gfw3XSXKHUs9bikAC1qC7EU01In9zgrXtr-vw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSubmissions() {
  const { data, error } = await supabase
    .from('cash_submissions')
    .select('id, amount, submitted_amount, status, submission_date, staff_id');
    
  if (error) {
    console.error(error);
    return;
  }
  
  console.log('--- ALL SUBMISSIONS ---');
  console.log(JSON.stringify(data, null, 2));

  const verified = data.filter(s => s.status === 'verified');
  const totalAmount = verified.reduce((acc, s) => acc + Number(s.amount || 0), 0);
  const totalSubmittedAmount = verified.reduce((acc, s) => acc + Number(s.submitted_amount || 0), 0);

  console.log('--- TOTALS ---');
  console.log(`Total amount for verified: ${totalAmount}`);
  console.log(`Total submitted_amount for verified: ${totalSubmittedAmount}`);
}

checkSubmissions();
