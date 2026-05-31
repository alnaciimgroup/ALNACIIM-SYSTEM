import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: trucks } = await supabase.from('trucks').select('*');
  const { data: users } = await supabase.from('users').select('id, full_name').eq('role', 'staff');
  return NextResponse.json({ users, trucks });
}
