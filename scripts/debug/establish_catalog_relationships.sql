-- ============================================================
-- ZUMA CATALOG - FOREIGN KEY RELATIONSHIPS
-- Run this in Supabase SQL Editor to ensure all relationships
-- ============================================================

-- 1. BRANDS -> CATEGORIES (already applied via fix_brands_relationship.sql)
-- Ensures brands.category_id references categories.id

-- 2. OFFERS -> BRANDS
-- Ensures offers.brand_id references brands.id
ALTER TABLE public.offers 
DROP CONSTRAINT IF EXISTS offers_brand_id_fkey;

ALTER TABLE public.offers
ADD CONSTRAINT offers_brand_id_fkey
FOREIGN KEY (brand_id)
REFERENCES public.brands(id)
ON DELETE CASCADE;

-- 3. OFFERS -> REGIONS
-- First, check if regions uses 'id' or 'code' as primary identifier
-- If regions has 'code' as unique, we create FK on that
-- If regions has 'id' as PK and offers.region_code is text, we need to match by code

-- Option A: If regions.code is unique and offers.region_code matches
ALTER TABLE public.offers 
DROP CONSTRAINT IF EXISTS offers_region_code_fkey;

-- Ensure regions.code has a unique constraint
ALTER TABLE public.regions
DROP CONSTRAINT IF EXISTS regions_code_key;

ALTER TABLE public.regions
ADD CONSTRAINT regions_code_key UNIQUE (code);

-- Now add FK from offers.region_code to regions.code
ALTER TABLE public.offers
ADD CONSTRAINT offers_region_code_fkey
FOREIGN KEY (region_code)
REFERENCES public.regions(code)
ON DELETE RESTRICT;

-- ============================================================
-- VERIFICATION QUERIES (Run these to check relationships)
-- ============================================================

-- Check brands -> categories relationship
-- SELECT b.name as brand, c.name as category 
-- FROM brands b 
-- LEFT JOIN categories c ON b.category_id = c.id 
-- LIMIT 5;

-- Check offers -> brands relationship
-- SELECT o.id, b.name as brand, o.region_code, o.price 
-- FROM offers o 
-- LEFT JOIN brands b ON o.brand_id = b.id 
-- LIMIT 5;

-- Check offers -> regions relationship
-- SELECT o.id, o.region_code, r.name as region 
-- FROM offers o 
-- LEFT JOIN regions r ON o.region_code = r.code 
-- LIMIT 5;
