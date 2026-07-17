-- PHASE 3: OPTIONAL CUSTOMER STAFF ASSIGNMENT MIGRATION
-- Drop NOT NULL constraint from staff_id in customers table
-- This allows customers to be created/imported as "unassigned" to any staff.

ALTER TABLE public.customers ALTER COLUMN staff_id DROP NOT NULL;
