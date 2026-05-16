-- PHASE 1: LOGISTICS & DISCOUNT DB UPGRADE
-- DO NOT MODIFY EXISTING FINANCIAL LOGIC

-- 1. Create Trucks Table
CREATE TABLE IF NOT EXISTS public.trucks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plate_number TEXT NOT NULL,
    capacity_liters NUMERIC NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Main Inventory (Production Log) Table
CREATE TABLE IF NOT EXISTS public.production_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    superadmin_id UUID REFERENCES auth.users(id),
    liters_produced NUMERIC NOT NULL,
    log_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Update Distributions Table for Trucks & Liters
-- Adding columns without breaking existing data
ALTER TABLE public.distributions ADD COLUMN IF NOT EXISTS truck_id UUID REFERENCES public.trucks(id);
ALTER TABLE public.distributions ADD COLUMN IF NOT EXISTS liters NUMERIC DEFAULT 0;

-- 4. Update Sales Table for Discounts and Drum Serials
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS drum_serial TEXT;

-- Enable Row Level Security on new tables
ALTER TABLE public.trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Can be refined in application logic via service role)
CREATE POLICY "Allow read access to trucks for authenticated users" ON public.trucks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access to production_logs for authenticated users" ON public.production_logs FOR SELECT USING (auth.role() = 'authenticated');
