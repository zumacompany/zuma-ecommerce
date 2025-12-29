-- Drop the overly restrictive constraint
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_status_check;

-- Add the correct constraint allowing both 'active' and 'inactive'
ALTER TABLE public.customers ADD CONSTRAINT customers_status_check 
CHECK (status IN ('active', 'inactive'));
