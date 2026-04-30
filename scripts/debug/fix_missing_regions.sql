-- ============================================================
-- FIX: Insert missing regions referenced by offers
-- ============================================================

-- Step 1: Insert any region codes from offers that don't exist in regions table
INSERT INTO public.regions (name, code)
SELECT DISTINCT 
    CASE offer_codes.region_code
        WHEN 'MZ' THEN 'Moçambique'
        WHEN 'ZA' THEN 'África do Sul'
        WHEN 'US' THEN 'Estados Unidos'
        WHEN 'UK' THEN 'Reino Unido'
        WHEN 'BR' THEN 'Brasil'
        WHEN 'PT' THEN 'Portugal'
        WHEN 'AO' THEN 'Angola'
        WHEN 'EU' THEN 'Europa'
        ELSE offer_codes.region_code  -- Use code as name if unknown
    END as name,
    offer_codes.region_code as code
FROM (SELECT DISTINCT region_code FROM public.offers WHERE region_code IS NOT NULL) offer_codes
WHERE offer_codes.region_code NOT IN (SELECT code FROM public.regions);

-- Step 2: Now safe to add FK constraint
ALTER TABLE public.offers 
DROP CONSTRAINT IF EXISTS offers_region_code_fkey;

-- Ensure regions.code has a unique constraint
ALTER TABLE public.regions
DROP CONSTRAINT IF EXISTS regions_code_key;

ALTER TABLE public.regions
ADD CONSTRAINT regions_code_key UNIQUE (code);

-- Add FK from offers.region_code to regions.code
ALTER TABLE public.offers
ADD CONSTRAINT offers_region_code_fkey
FOREIGN KEY (region_code)
REFERENCES public.regions(code)
ON DELETE RESTRICT;

-- Verify: Check what regions now exist
-- SELECT * FROM public.regions ORDER BY name;
