-- ============================================================
-- ZUMA - DATABASE ALIGNMENT MIGRATION
-- Version: 2.1
-- Date: 2026-02-10
-- Purpose: Fix mismatches between schema and application code
-- ============================================================
-- Apply this migration AFTER running MASTER_SCHEMA.sql
-- ============================================================

-- ============================================================
-- CRITICAL FIX #1: Add missing hero_image_path column to brands
-- ============================================================
-- The admin brands interface expects this column
ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS hero_image_path text NULL;

COMMENT ON COLUMN public.brands.hero_image_path IS 'Path to brand hero/banner image for brand detail pages';

-- ============================================================
-- PERFORMANCE OPTIMIZATION: Add missing indexes
-- ============================================================

-- Index on orders.order_number for fast lookups (if not already present from UNIQUE)
-- Note: UNIQUE constraint already creates an index, but we verify it exists
CREATE INDEX IF NOT EXISTS orders_order_number_idx 
ON public.orders(order_number);

-- Index on customers.created_at for "new customers" queries
CREATE INDEX IF NOT EXISTS customers_created_at_idx 
ON public.customers(created_at DESC);

-- Composite index on offers for common query pattern
CREATE INDEX IF NOT EXISTS offers_brand_region_status_idx 
ON public.offers(brand_id, region_code, status) 
WHERE status = 'active';

-- Index on payment_methods for active status queries
CREATE INDEX IF NOT EXISTS payment_methods_status_sort_idx 
ON public.payment_methods(status, sort_order) 
WHERE status = 'active';

-- Indexes on sort_order columns for ordered content
CREATE INDEX IF NOT EXISTS trust_points_sort_order_idx 
ON public.trust_points(sort_order);

CREATE INDEX IF NOT EXISTS faqs_sort_order_idx 
ON public.faqs(sort_order);

CREATE INDEX IF NOT EXISTS home_featured_brands_sort_order_idx 
ON public.home_featured_brands(sort_order);

-- Index on brands.category_id for filtering by category
CREATE INDEX IF NOT EXISTS brands_category_id_idx 
ON public.brands(category_id);

-- ============================================================
-- OPTIMIZATION: Additional useful indexes
-- ============================================================

-- Index for order items by offer (for inventory queries)
CREATE INDEX IF NOT EXISTS order_items_offer_id_idx 
ON public.order_items(offer_id);

-- Index on digital_codes for offer stock queries
CREATE INDEX IF NOT EXISTS digital_codes_offer_status_idx 
ON public.digital_codes(offer_id, status) 
WHERE status = 'available';

-- Index on audit_logs for admin activity reports
CREATE INDEX IF NOT EXISTS audit_logs_admin_created_idx 
ON public.audit_logs(admin_email, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_entity_idx 
ON public.audit_logs(entity, entity_id);

-- ============================================================
-- VERIFY ALL EXPECTED COLUMNS EXIST
-- ============================================================

-- Verify customers has all required columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'customers' 
    AND column_name = 'city'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN city text NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'customers' 
    AND column_name = 'birthdate'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN birthdate date NULL;
  END IF;
END $$;

-- Verify orders has all required columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'city'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN city text NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'delivery_codes'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN delivery_codes text NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN admin_notes text NULL;
  END IF;
END $$;

-- ============================================================
-- NOTE: VACUUM ANALYZE removed - cannot run in transaction blocks
-- ============================================================
-- Run these commands manually AFTER migration if needed:
-- VACUUM ANALYZE public.brands;
-- VACUUM ANALYZE public.offers;
-- VACUUM ANALYZE public.customers;
-- VACUUM ANALYZE public.orders;
-- VACUUM ANALYZE public.analytics_events;
-- VACUUM ANALYZE public.payment_methods;

-- ============================================================
-- VERIFICATION QUERIES (Run these after migration)
-- ============================================================

/*
-- Verify hero_image_path column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'brands' AND column_name = 'hero_image_path';

-- Verify all indexes were created
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('brands', 'offers', 'customers', 'orders', 'trust_points', 'faqs')
ORDER BY tablename, indexname;

-- Check index usage (run after some application usage)
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Verify all critical columns exist
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('brands', 'customers', 'orders')
AND column_name IN ('hero_image_path', 'city', 'birthdate', 'delivery_codes', 'admin_notes')
ORDER BY table_name, column_name;
*/

-- ============================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================

/*
-- To rollback this migration (USE WITH CAUTION):

-- Remove hero_image_path column
ALTER TABLE public.brands DROP COLUMN IF EXISTS hero_image_path;

-- Drop indexes (only if causing issues)
DROP INDEX IF EXISTS public.customers_created_at_idx;
DROP INDEX IF EXISTS public.offers_brand_region_status_idx;
DROP INDEX IF EXISTS public.payment_methods_status_sort_idx;
DROP INDEX IF EXISTS public.trust_points_sort_order_idx;
DROP INDEX IF EXISTS public.faqs_sort_order_idx;
DROP INDEX IF EXISTS public.home_featured_brands_sort_order_idx;
DROP INDEX IF EXISTS public.brands_category_id_idx;
DROP INDEX IF EXISTS public.order_items_offer_id_idx;
DROP INDEX IF EXISTS public.digital_codes_offer_status_idx;
DROP INDEX IF EXISTS public.audit_logs_admin_created_idx;
DROP INDEX IF EXISTS public.audit_logs_entity_idx;

-- Note: Do NOT drop city, birthdate, delivery_codes, admin_notes columns
-- as they may contain important data
*/

-- ============================================================
-- END OF MIGRATION
-- ============================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'Database Alignment Migration Complete!';
  RAISE NOTICE 'Version: 2.2';
  RAISE NOTICE 'Date: 2026-02-10';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'Changes applied:';
  RAISE NOTICE '  ✅ Added brands.hero_image_path column';
  RAISE NOTICE '  ✅ Added 11 performance indexes';
  RAISE NOTICE '  ✅ Verified all critical columns exist';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Run verification queries (see comments)';
  RAISE NOTICE '  2. Optionally run VACUUM ANALYZE (see comments)';
  RAISE NOTICE '  3. Test all functionality';
  RAISE NOTICE '===============================================';
END $$;
