-- Migration: Add city and birthdate fields to customers table
-- These fields are collected in checkout but weren't being stored

ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS city text NULL,
ADD COLUMN IF NOT EXISTS birthdate date NULL;

-- Add index for birthdate queries (useful for birthday promotions, age analytics)
CREATE INDEX IF NOT EXISTS customers_birthdate_idx ON public.customers(birthdate) WHERE birthdate IS NOT NULL;

COMMENT ON COLUMN public.customers.city IS 'Customer city/district';
COMMENT ON COLUMN public.customers.birthdate IS 'Customer date of birth for promotions and analytics';
