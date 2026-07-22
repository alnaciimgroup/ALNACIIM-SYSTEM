-- PHASE 4: MISSED SALES BACKDATE & APPROVAL WORKFLOW MIGRATION

-- 1. Modify the check constraint on sales status to allow 'pending_approval' and 'cancelled'
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_status_check;
ALTER TABLE public.sales ADD CONSTRAINT sales_status_check CHECK (status IN ('completed', 'pending', 'pending_approval', 'cancelled'));

-- 2. Add columns to support the backdate request and approval metadata
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS requested_date DATE;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS backdate_reason TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
