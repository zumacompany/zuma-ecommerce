-- ============================================================
-- 🔐 CUSTOMER AUTHENTICATION SYSTEM
-- Migration: Add authentication support for customers
-- Date: 2026-02-11
-- ============================================================

-- This migration enables hybrid customer login:
-- - Customers can checkout without login (guest)
-- - Customers can optionally create accounts
-- - Guest orders are linked to new accounts via WhatsApp

BEGIN;

-- ============================================================
-- 1. ADD AUTH LINK TO CUSTOMERS TABLE
-- ============================================================

-- Add auth_user_id to link customers with auth.users
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add unique constraint to prevent duplicate auth links
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'customers_auth_user_id_unique'
  ) THEN
    ALTER TABLE public.customers 
    ADD CONSTRAINT customers_auth_user_id_unique UNIQUE (auth_user_id);
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id 
ON public.customers(auth_user_id);

RAISE NOTICE '✅ Added auth_user_id to customers table';

-- ============================================================
-- 2. CREATE CUSTOMER PREFERENCES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.customer_preferences (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  email_notifications boolean DEFAULT true,
  whatsapp_notifications boolean DEFAULT true,
  language text DEFAULT 'pt' CHECK (language IN ('pt', 'en')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique constraint on customer_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'customer_preferences_customer_id_unique'
  ) THEN
    ALTER TABLE public.customer_preferences 
    ADD CONSTRAINT customer_preferences_customer_id_unique UNIQUE (customer_id);
  END IF;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_customer_preferences_customer_id 
ON public.customer_preferences(customer_id);

RAISE NOTICE '✅ Created customer_preferences table';

-- ============================================================
-- 3. ENABLE RLS ON CUSTOMER PREFERENCES
-- ============================================================

ALTER TABLE public.customer_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. CREATE RLS POLICIES FOR CUSTOMERS
-- ============================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "customers_view_own_data" ON public.customers;
DROP POLICY IF EXISTS "customers_update_own_profile" ON public.customers;

-- Customers can only view their own data
CREATE POLICY "customers_view_own_data" ON public.customers
  FOR SELECT 
  USING (auth.uid() = auth_user_id);

-- Customers can update their own profile
CREATE POLICY "customers_update_own_profile" ON public.customers
  FOR UPDATE 
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

RAISE NOTICE '✅ Created RLS policies for customers';

-- ============================================================
-- 5. CREATE RLS POLICIES FOR CUSTOMER PREFERENCES
-- ============================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "customers_view_own_preferences" ON public.customer_preferences;
DROP POLICY IF EXISTS "customers_update_own_preferences" ON public.customer_preferences;
DROP POLICY IF EXISTS "customers_insert_own_preferences" ON public.customer_preferences;

-- Customers can view own preferences
CREATE POLICY "customers_view_own_preferences" ON public.customer_preferences
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
  );

-- Customers can update own preferences
CREATE POLICY "customers_update_own_preferences" ON public.customer_preferences
  FOR UPDATE
  USING (
    customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
  );

-- Customers can insert own preferences
CREATE POLICY "customers_insert_own_preferences" ON public.customer_preferences
  FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
  );

RAISE NOTICE '✅ Created RLS policies for customer_preferences';

-- ============================================================
-- 6. CREATE FUNCTION TO LINK GUEST ORDERS TO NEW ACCOUNT
-- ============================================================

CREATE OR REPLACE FUNCTION public.link_guest_orders_to_account(
  p_auth_user_id uuid,
  p_whatsapp_e164 text
)
RETURNS TABLE(
  customer_id uuid,
  orders_linked integer,
  total_spent numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id uuid;
  v_orders_count integer;
  v_total_spent numeric;
BEGIN
  -- Find customer by WhatsApp (guest orders)
  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE whatsapp_e164 = p_whatsapp_e164
    AND auth_user_id IS NULL
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    -- No guest customer found, return zeros
    RETURN QUERY SELECT NULL::uuid, 0::integer, 0::numeric;
    RETURN;
  END IF;

  -- Link customer to auth user
  UPDATE public.customers
  SET auth_user_id = p_auth_user_id,
      updated_at = now()
  WHERE id = v_customer_id;

  -- Count linked orders and total spent
  SELECT 
    COUNT(*)::integer,
    COALESCE(SUM(total_amount), 0)::numeric
  INTO v_orders_count, v_total_spent
  FROM public.orders
  WHERE customer_id = v_customer_id;

  -- Return results
  RETURN QUERY SELECT v_customer_id, v_orders_count, v_total_spent;
END;
$$;

RAISE NOTICE '✅ Created link_guest_orders_to_account function';

-- ============================================================
-- 7. CREATE FUNCTION TO GET CUSTOMER BY AUTH USER
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_customer_by_auth_user(
  p_auth_user_id uuid
)
RETURNS TABLE(
  customer_id uuid,
  name text,
  email text,
  whatsapp_e164 text,
  whatsapp_display text,
  country text,
  province text,
  city text,
  birthdate date,
  loyalty_points integer,
  orders_count integer,
  total_spent numeric,
  last_order_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.email,
    c.whatsapp_e164,
    c.whatsapp_display,
    c.country,
    c.province,
    c.city,
    c.birthdate,
    c.loyalty_points,
    c.orders_count,
    c.delivered_total,
    c.last_order_at
  FROM public.customers c
  WHERE c.auth_user_id = p_auth_user_id;
END;
$$;

RAISE NOTICE '✅ Created get_customer_by_auth_user function';

-- ============================================================
-- 8. CREATE TRIGGER FOR LOYALTY POINTS
-- ============================================================

-- Function to award points after delivery
CREATE OR REPLACE FUNCTION public.award_loyalty_points()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_points_to_add integer;
BEGIN
  -- Only award points when status changes to delivered
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    -- Award 1 point per 100 MZN spent (rounded down)
    v_points_to_add := FLOOR(NEW.total_amount / 100);
    
    -- Update customer loyalty points
    UPDATE public.customers
    SET loyalty_points = loyalty_points + v_points_to_add,
        updated_at = now()
    WHERE id = NEW.customer_id;
    
    RAISE NOTICE 'Awarded % points to customer %', v_points_to_add, NEW.customer_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_award_loyalty_points ON public.orders;

-- Create trigger
CREATE TRIGGER trigger_award_loyalty_points
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.award_loyalty_points();

RAISE NOTICE '✅ Created loyalty points trigger';

-- ============================================================
-- 9. CREATE FUNCTION TO GET CUSTOMER ORDERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_customer_orders(
  p_auth_user_id uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  order_id uuid,
  order_number text,
  status text,
  total_amount numeric,
  currency text,
  created_at timestamptz,
  payment_method_name text,
  items_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.status,
    o.total_amount,
    o.currency,
    o.created_at,
    pm.name as payment_method_name,
    (SELECT COUNT(*)::integer FROM public.order_items oi WHERE oi.order_id = o.id) as items_count
  FROM public.orders o
  LEFT JOIN public.payment_methods pm ON o.payment_method_id = pm.id
  WHERE o.customer_id IN (
    SELECT id FROM public.customers WHERE auth_user_id = p_auth_user_id
  )
  ORDER BY o.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

RAISE NOTICE '✅ Created get_customer_orders function';

-- ============================================================
-- 10. VERIFICATION SECTION
-- ============================================================

DO $$ 
DECLARE
  v_customers_with_auth integer;
  v_total_customers integer;
BEGIN
  -- Count customers
  SELECT COUNT(*) INTO v_total_customers FROM public.customers;
  SELECT COUNT(*) INTO v_customers_with_auth FROM public.customers WHERE auth_user_id IS NOT NULL;

  RAISE NOTICE '';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'Customer Authentication Migration Complete!';
  RAISE NOTICE 'Date: %', now();
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'Tables updated:';
  RAISE NOTICE '  ✅ customers (added auth_user_id)';
  RAISE NOTICE '  ✅ customer_preferences (created)';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '  ✅ link_guest_orders_to_account()';
  RAISE NOTICE '  ✅ get_customer_by_auth_user()';
  RAISE NOTICE '  ✅ get_customer_orders()';
  RAISE NOTICE '  ✅ award_loyalty_points()';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS Policies created:';
  RAISE NOTICE '  ✅ customers (view/update own data)';
  RAISE NOTICE '  ✅ customer_preferences (full CRUD)';
  RAISE NOTICE '';
  RAISE NOTICE 'Statistics:';
  RAISE NOTICE '  📊 Total customers: %', v_total_customers;
  RAISE NOTICE '  🔗 Customers with auth: %', v_customers_with_auth;
  RAISE NOTICE '===============================================';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '  1. Create customer pages (login, dashboard)';
  RAISE NOTICE '  2. Implement authentication hooks';
  RAISE NOTICE '  3. Update checkout integration';
  RAISE NOTICE '===============================================';
END $$;

COMMIT;
