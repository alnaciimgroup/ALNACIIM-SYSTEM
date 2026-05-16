-- PHASE 1.5: TRUCK ASSIGNMENT & CONSTRAINT REMOVAL

-- 1. Remove the old quantity check constraint from distributions
ALTER TABLE public.distributions DROP CONSTRAINT IF EXISTS distributions_quantity_check;

-- 2. Add driver_id to trucks so each truck is permanently assigned to a staff member
ALTER TABLE public.trucks ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES public.users(id);

-- 3. Ensure the driver_id is unique so one staff member can't have multiple trucks active
ALTER TABLE public.trucks ADD CONSTRAINT unique_driver_id UNIQUE (driver_id);
