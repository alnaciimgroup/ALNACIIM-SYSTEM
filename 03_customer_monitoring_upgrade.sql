-- PHASE 2: CUSTOMER ACTIVITY MONITORING ENGINE

-- 1. Add customer_type to customers table
-- 'regular' means fixed schedule, 'irregular' means random orders
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'regular' CHECK (customer_type IN ('regular', 'irregular'));

-- 2. Create customer follow-ups table for Sales Team tracking
CREATE TABLE IF NOT EXISTS public.customer_followups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES auth.users(id),
    action_type TEXT NOT NULL CHECK (action_type IN ('called', 'visited', 'messaged', 'other')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Disable RLS for internal development simplicity (just like the previous tables)
ALTER TABLE public.customer_followups DISABLE ROW LEVEL SECURITY;
