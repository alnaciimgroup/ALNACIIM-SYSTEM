
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ifgmzgofehlmgfsfabrb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmZ216Z29mZWhsbWdmc2ZhYnJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2NDA1MSwiZXhwIjoyMDkwMDQwMDUxfQ.Rcl7R3Gfw3XSXKHUs9bikAC1qC7EU01In9zgrXtr-vw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findFaarax() {
  // 1. Find user
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, full_name, role')
    .ilike('full_name', '%faarax%');
    
  if (userError) {
    console.error('User Error:', userError);
    return;
  }
  
  if (!users || users.length === 0) {
    console.log('No user named faarax found');
    return;
  }
  
  const faarax = users[0];
  console.log('User found:', faarax);
  
  // 2. Find Sales
  const { data: sales, error: salesError } = await supabase
    .from('sales')
    .select('id, total_amount, created_at')
    .eq('staff_id', faarax.id);
    
  if (salesError) {
    console.error('Sales Error:', salesError);
  } else {
    console.log(`Sales found for ${faarax.full_name}: ${sales.length}`);
    if (sales.length > 0) {
      console.log('First 3 sales:', sales.slice(0, 3));
    }
  }
  
  // 3. Find Submissions
  const { data: subs, error: subsError } = await supabase
    .from('cash_submissions')
    .select('id, money_collected, submission_date, status')
    .eq('staff_id', faarax.id);
    
  if (subsError) {
    console.error('Submissions Error:', subsError);
  } else {
    console.log(`Submissions found for ${faarax.full_name}: ${subs.length}`);
    if (subs.length > 0) {
      console.log('First 3 submissions:', subs.slice(0, 3));
    }
  }
}

findFaarax();
