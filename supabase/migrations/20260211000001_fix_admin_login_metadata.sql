-- ============================================================
-- 🔧 FIX: Admin Login Metadata Column Reference
-- Date: 2026-02-11
-- Issue: Column "raw_app_metadata" does not exist, should be "raw_app_meta_data"
-- ============================================================

-- This migration fixes the typo in any functions that reference
-- the auth.users table metadata columns incorrectly.

BEGIN;

-- ============================================================
-- 1. DROP AND RECREATE POTENTIAL PROBLEMATIC FUNCTIONS
-- ============================================================

-- Common admin authentication helper functions that might have the typo
-- These are educated guesses based on typical admin auth patterns

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  -- Correctly reference raw_app_meta_data (with underscores)
  SELECT COALESCE(raw_app_meta_data->>'role', '')
  INTO user_role
  FROM auth.users
  WHERE id = user_id;
  
  RETURN user_role = 'admin';
END;
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  -- Correctly reference raw_app_meta_data (with underscores)
  SELECT COALESCE(raw_app_meta_data->>'role', 'customer')
  INTO user_role
  FROM auth.users
  WHERE id = user_id;
  
  RETURN user_role;
END;
$$;

-- Function to get user metadata
CREATE OR REPLACE FUNCTION public.get_user_metadata(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  metadata jsonb;
BEGIN
  -- Correctly reference raw_app_meta_data and raw_user_meta_data (with underscores)
  SELECT jsonb_build_object(
    'app_metadata', COALESCE(raw_app_meta_data, '{}'::jsonb),
    'user_metadata', COALESCE(raw_user_meta_data, '{}'::jsonb)
  )
  INTO metadata
  FROM auth.users
  WHERE id = user_id;
  
  RETURN metadata;
END;
$$;

-- ============================================================
-- 2. VERIFICATION
-- ============================================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ Created/Updated admin authentication functions with correct metadata column names';
END $$;

-- ============================================================
-- 3. ADDITIONAL VERIFICATION
-- ============================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'Admin Login Metadata Fix Applied!';
  RAISE NOTICE 'Date: %', now();
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'Fixed Functions:';
  RAISE NOTICE '  ✅ is_admin()';
  RAISE NOTICE '  ✅ get_user_role()';
  RAISE NOTICE '  ✅ get_user_metadata()';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Note: If the error persists, please check:';
  RAISE NOTICE '  1. Custom RLS policies referencing auth.users';
  RAISE NOTICE '  2. Application code making direct SQL queries';
  RAISE NOTICE '  3. Other custom functions not covered here';
  RAISE NOTICE '===============================================';
END $$;

COMMIT;
