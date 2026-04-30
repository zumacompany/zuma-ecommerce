-- ============================================================
-- ZUMA - PRODUCTION DATABASE SCHEMA (MASTER)
-- Version: 2.0 (Post-QA Implementation)
-- Generated: 2026-02-10
-- ============================================================
-- This schema represents the complete, production-ready database
-- structure incorporating all QA fixes, features, and optimizations.
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-

" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ADMIN & AUTHENTICATION
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'admin'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_users_pkey PRIMARY KEY (user_id),
  CONSTRAINT admin_users_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================================
-- CATALOG MANAGEMENT
-- ============================================================

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  color text NULL,
  icon text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_slug_key UNIQUE (slug)
);

-- Regions
CREATE TABLE IF NOT EXISTS public.regions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT regions_pkey PRIMARY KEY (id),
  CONSTRAINT regions_code_key UNIQUE (code)
);

-- Brands
CREATE TABLE IF NOT EXISTS public.brands (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_path text NULL,
  hero_image_path text NULL,
  description_md text NULL,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT brands_pkey PRIMARY KEY (id),
  CONSTRAINT brands_slug_key UNIQUE (slug),
  CONSTRAINT brands_category_id_fkey FOREIGN KEY (category_id) 
    REFERENCES public.categories(id) ON DELETE RESTRICT,
  CONSTRAINT brands_status_check CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text]))
);

CREATE TRIGGER brands_set_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  name text NOT NULL,
  description_md text NULL,
  product_type text NOT NULL DEFAULT 'digital'::text,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) 
    REFERENCES public.brands(id) ON DELETE CASCADE,
  CONSTRAINT products_status_check CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  CONSTRAINT products_type_check CHECK (product_type = ANY (ARRAY['digital'::text, 'service'::text, 'physical'::text]))
);

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Offers
CREATE TABLE IF NOT EXISTS public.offers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  region_code text NOT NULL,
  denomination_value numeric NOT NULL,
  denomination_currency text NOT NULL,
  price numeric NOT NULL,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  cost_price numeric NOT NULL DEFAULT 0,
  product_id uuid NULL,
  stock_quantity integer NOT NULL DEFAULT 0,
  is_unlimited boolean NOT NULL DEFAULT false,
  auto_fulfill boolean NOT NULL DEFAULT false,
  CONSTRAINT offers_pkey PRIMARY KEY (id),
  CONSTRAINT offers_brand_id_fkey FOREIGN KEY (brand_id) 
    REFERENCES public.brands(id) ON DELETE CASCADE,
  CONSTRAINT offers_region_code_fkey FOREIGN KEY (region_code) 
    REFERENCES public.regions(code) ON DELETE RESTRICT,
  CONSTRAINT offers_product_id_fkey FOREIGN KEY (product_id) 
    REFERENCES public.products(id) ON DELETE SET NULL,
  CONSTRAINT offers_status_check CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text]))
);

CREATE TRIGGER offers_set_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS offers_brand_id_idx ON public.offers(brand_id);
CREATE INDEX IF NOT EXISTS offers_region_code_idx ON public.offers(region_code);

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  whatsapp_e164 text NOT NULL UNIQUE,
  whatsapp_display text NULL,
  name text NOT NULL,
  email text NOT NULL,
  country text NOT NULL,
  province text NOT NULL,
  city text NULL,
  birthdate date NULL,
  first_order_at timestamp with time zone NULL,
  last_order_at timestamp with time zone NULL,
  orders_count integer NOT NULL DEFAULT 0,
  delivered_orders_count integer NOT NULL DEFAULT 0,
  delivered_total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_whatsapp_e164_key UNIQUE (whatsapp_e164),
  CONSTRAINT customers_status_check CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text]))
);

CREATE TRIGGER customers_set_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Customer Payment Profiles (for Stripe integration)
CREATE TABLE IF NOT EXISTS public.customer_payment_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL UNIQUE,
  provider text NOT NULL DEFAULT 'stripe'::text,
  provider_customer_id text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT customer_payment_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT customer_payment_profiles_customer_id_fkey FOREIGN KEY (customer_id) 
    REFERENCES public.customers(id) ON DELETE CASCADE
);

-- ============================================================
-- PAYMENT METHODS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  instructions_md text NULL,
  details jsonb NULL,
  status text NOT NULL DEFAULT 'active'::text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payment_methods_pkey PRIMARY KEY (id),
  CONSTRAINT payment_methods_type_check CHECK (type = ANY (ARRAY['manual'::text, 'stripe'::text, 'mpesa'::text])),
  CONSTRAINT payment_methods_status_check CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text]))
);

CREATE TRIGGER payment_methods_set_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- ORDERS
-- ============================================================

-- Order Sequence
CREATE TABLE IF NOT EXISTS public.order_sequence (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_sequence_pkey PRIMARY KEY (id)
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  customer_email text NULL,
  customer_whatsapp text NOT NULL,
  status text NOT NULL DEFAULT 'new'::text,
  payment_method_id uuid NULL,
  payment_method_snapshot jsonb NULL,
  total_amount numeric NOT NULL,
  currency text NOT NULL,
  handoff_clicked_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  customer_id uuid NULL,
  city text NULL,
  delivery_codes text NULL,
  admin_notes text NULL,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_order_number_key UNIQUE (order_number),
  CONSTRAINT orders_payment_method_id_fkey FOREIGN KEY (payment_method_id) 
    REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) 
    REFERENCES public.customers(id) ON DELETE SET NULL,
  CONSTRAINT orders_status_check CHECK (status = ANY (ARRAY['new'::text, 'on_hold'::text, 'delivered'::text, 'canceled'::text]))
);

CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders(created_at DESC);

-- Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  offer_id uuid NOT NULL,
  qty integer NOT NULL,
  unit_price numeric NOT NULL,
  total numeric NOT NULL,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) 
    REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_offer_id_fkey FOREIGN KEY (offer_id) 
    REFERENCES public.offers(id) ON DELETE RESTRICT,
  CONSTRAINT order_items_qty_check CHECK (qty > 0)
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);

-- Order Status History
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  changed_by uuid NULL,
  from_status text NOT NULL,
  to_status text NOT NULL,
  note text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_status_history_pkey PRIMARY KEY (id),
  CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) 
    REFERENCES public.orders(id) ON DELETE CASCADE
);

-- Order Deliveries
CREATE TABLE IF NOT EXISTS public.order_deliveries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE,
  delivery_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  delivered_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_deliveries_pkey PRIMARY KEY (id),
  CONSTRAINT order_deliveries_order_id_fkey FOREIGN KEY (order_id) 
    REFERENCES public.orders(id) ON DELETE CASCADE
);

CREATE TRIGGER order_deliveries_set_updated_at
  BEFORE UPDATE ON public.order_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- DIGITAL INVENTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.digital_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL,
  code_content text NOT NULL,
  status text NOT NULL DEFAULT 'available'::text,
  order_id uuid NULL,
  assigned_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT digital_codes_pkey PRIMARY KEY (id),
  CONSTRAINT digital_codes_offer_id_fkey FOREIGN KEY (offer_id) 
    REFERENCES public.offers(id) ON DELETE CASCADE,
  CONSTRAINT digital_codes_order_id_fkey FOREIGN KEY (order_id) 
    REFERENCES public.orders(id) ON DELETE SET NULL,
  CONSTRAINT digital_codes_status_check CHECK (status = ANY (ARRAY['available'::text, 'sold'::text, 'revoked'::text]))
);

-- Function to sync offer stock
CREATE OR REPLACE FUNCTION public.sync_offer_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF (NEW.status = 'available') THEN
      UPDATE public.offers
      SET stock_quantity = (
        SELECT count(*) FROM public.digital_codes
        WHERE offer_id = NEW.offer_id AND status = 'available'
      )
      WHERE id = NEW.offer_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.offers
    SET stock_quantity = (
      SELECT count(*) FROM public.digital_codes
      WHERE offer_id = OLD.offer_id AND status = 'available'
    )
    WHERE id = OLD.offer_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_digital_code_change
  AFTER INSERT OR UPDATE OR DELETE ON public.digital_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_offer_stock();

-- ============================================================
-- ANALYTICS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id text NULL,
  event_name text NOT NULL,
  path text NULL,
  referrer text NULL,
  country_code text NULL,
  category_slug text NULL,
  brand_slug text NULL,
  offer_id uuid NULL,
  order_id uuid NULL,
  metadata jsonb NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT analytics_events_pkey PRIMARY KEY (id)
);

-- Indexes for performance (QA Fix #20)
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_event_name_idx ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS analytics_events_order_id_idx ON public.analytics_events(order_id);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_email text NOT NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text NOT NULL,
  details jsonb NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

-- ============================================================
-- SITE CONTENT
-- ============================================================

-- Home Content
CREATE TABLE IF NOT EXISTS public.home_content (
  id integer NOT NULL DEFAULT 1,
  hero_title text NULL,
  hero_subtitle text NULL,
  hero_banner_image text NULL,
  featured_brands_title text NULL,
  trust_points_title text NULL,
  faq_title text NULL,
  whatsapp_number text NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT home_content_pkey PRIMARY KEY (id),
  CONSTRAINT home_content_id_check CHECK (id = 1)
);

CREATE TRIGGER home_content_set_updated_at
  BEFORE UPDATE ON public.home_content
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Home Featured Brands
CREATE TABLE IF NOT EXISTS public.home_featured_brands (
  brand_slug text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT home_featured_brands_pkey PRIMARY KEY (brand_slug),
  CONSTRAINT home_featured_brands_brand_slug_fkey FOREIGN KEY (brand_slug) 
    REFERENCES public.brands(slug) ON DELETE CASCADE
);

-- Trust Points
CREATE TABLE IF NOT EXISTS public.trust_points (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text NULL,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT trust_points_pkey PRIMARY KEY (id)
);

-- FAQs
CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT faqs_pkey PRIMARY KEY (id)
);

-- Site Content (General)
CREATE TABLE IF NOT EXISTS public.site_content (
  key text NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT site_content_pkey PRIMARY KEY (key)
);

CREATE TRIGGER site_content_set_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- SUBSCRIPTIONS (FOR FUTURE USE)
-- ============================================================

-- Subscription Plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  name text NOT NULL,
  interval text NOT NULL,
  interval_count integer NOT NULL DEFAULT 1,
  currency text NOT NULL DEFAULT 'USD'::text,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'active'::text,
  stripe_price_id text UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT subscription_plans_pkey PRIMARY KEY (id),
  CONSTRAINT subscription_plans_product_id_fkey FOREIGN KEY (product_id) 
    REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT subscription_plans_interval_count_check CHECK (interval_count > 0),
  CONSTRAINT subscription_plans_amount_check CHECK (amount >= 0::numeric)
);

CREATE TRIGGER subscription_plans_set_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active'::text,
  current_period_start timestamp with time zone NULL,
  current_period_end timestamp with time zone NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  stripe_subscription_id text UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_customer_id_fkey FOREIGN KEY (customer_id) 
    REFERENCES public.customers(id) ON DELETE CASCADE,
  CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) 
    REFERENCES public.subscription_plans(id) ON DELETE RESTRICT
);

CREATE TRIGGER subscriptions_set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Stripe Events
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id text NOT NULL,
  type text NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT stripe_events_pkey PRIMARY KEY (id)
);

-- ============================================================
-- ORDER FUNCTIONS
-- ============================================================

-- Generate Order Number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text AS $$
DECLARE
  seq_val bigint;
BEGIN
  INSERT INTO public.order_sequence DEFAULT VALUES RETURNING id INTO seq_val;
  RETURN 'ZM-' || lpad(seq_val::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Create Order with Stock Validation (QA Fix #3)
CREATE OR REPLACE FUNCTION public.create_order(
  p_customer_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_whatsapp text,
  p_payment_method_id uuid,
  p_payment_method_snapshot jsonb,
  p_items jsonb,
  p_currency text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id uuid;
  v_order_num text;
  v_total numeric := 0;
  v_item jsonb;
  v_offer_stock integer;
  v_offer_unlimited boolean;
BEGIN
  -- Validate stock for each item (QA Fix #3)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT stock_quantity, is_unlimited INTO v_offer_stock, v_offer_unlimited
    FROM public.offers
    WHERE id = (v_item->>'offer_id')::uuid
    FOR UPDATE; -- Lock the row to prevent race conditions

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Offer % not found', v_item->>'offer_id';
    END IF;

    IF NOT v_offer_unlimited AND v_offer_stock < (v_item->>'qty')::int THEN
      RAISE EXCEPTION 'Insufficient stock for offer %. Available: %, Requested: %', 
        v_item->>'offer_id', v_offer_stock, v_item->>'qty';
    END IF;

    v_total := v_total + ((v_item->>'qty')::int * (v_item->>'unit_price')::numeric);
  END LOOP;

  -- Generate order number
  v_order_num := public.generate_order_number();

  -- Create order
  INSERT INTO public.orders (
    order_number,
    customer_id,
    customer_name,
    customer_email,
    customer_whatsapp,
    payment_method_id,
    payment_method_snapshot,
    currency,
    total_amount,
    status
  )
  VALUES (
    v_order_num,
    p_customer_id,
    p_customer_name,
    p_customer_email,
    p_customer_whatsapp,
    p_payment_method_id,
    p_payment_method_snapshot,
    p_currency,
    v_total,
    'new'
  )
  RETURNING id INTO v_order_id;

  -- Insert order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      offer_id,
      qty,
      unit_price,
      total
    )
    VALUES (
      v_order_id,
      (v_item->>'offer_id')::uuid,
      (v_item->>'qty')::int,
      (v_item->>'unit_price')::numeric,
      ((v_item->>'qty')::int * (v_item->>'unit_price')::numeric)
    );
  END LOOP;

  RETURN (
    SELECT jsonb_build_object(
      'order_id', o.id,
      'order_number', o.order_number
    )
    FROM public.orders o
    WHERE o.id = v_order_id
  );
END;
$$;

-- Update Order Status
CREATE OR REPLACE FUNCTION public.update_order_status(
  p_order_id uuid,
  p_new_status text,
  p_note text,
  p_changed_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prev_status text;
BEGIN
  SELECT status INTO v_prev_status FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  UPDATE public.orders
  SET status = p_new_status,
      updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO public.order_status_history (
    order_id,
    from_status,
    to_status,
    note,
    changed_by
  ) VALUES (
    p_order_id,
    v_prev_status,
    p_new_status,
    p_note,
    p_changed_by
  );

  RETURN jsonb_build_object(
    'order_id', p_order_id,
    'from_status', v_prev_status,
    'to_status', p_new_status
  );
END;
$$;

-- Upsert Customer by WhatsApp (QA Fix #18, #19)
CREATE OR REPLACE FUNCTION public.upsert_customer_by_whatsapp(
  p_whatsapp_e164 text,
  p_whatsapp_display text,
  p_name text,
  p_email text,
  p_country text,
  p_province text,
  p_city text,
  p_birthdate date,
  p_order_created_at timestamp with time zone
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.customers (
    name,
    email,
    whatsapp_e164,
    whatsapp_display,
    country,
    province,
    city,
    birthdate
  ) VALUES (
    p_name,
    p_email,
    p_whatsapp_e164,
    p_whatsapp_display,
    p_country,
    p_province,
    p_city,
    p_birthdate
  )
  ON CONFLICT (whatsapp_e164)
  DO UPDATE SET
    name = COALESCE(EXCLUDED.name, public.customers.name),
    email = COALESCE(EXCLUDED.email, public.customers.email),
    whatsapp_display = COALESCE(EXCLUDED.whatsapp_display, public.customers.whatsapp_display),
    country = COALESCE(EXCLUDED.country, public.customers.country),
    province = COALESCE(EXCLUDED.province, public.customers.province),
    city = COALESCE(EXCLUDED.city, public.customers.city),
    birthdate = COALESCE(EXCLUDED.birthdate, public.customers.birthdate),
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Update Customer Stats Trigger
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_customer_id uuid;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    target_customer_id := OLD.customer_id;
  ELSE
    target_customer_id := NEW.customer_id;
  END IF;

  IF target_customer_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.customers
  SET
    orders_count = (
      SELECT COUNT(*) FROM public.orders
      WHERE customer_id = target_customer_id
    ),
    delivered_total = (
      SELECT COALESCE(SUM(total_amount), 0) FROM public.orders
      WHERE customer_id = target_customer_id AND status = 'delivered'
    ),
    delivered_orders_count = (
      SELECT COUNT(*) FROM public.orders
      WHERE customer_id = target_customer_id AND status = 'delivered'
    ),
    last_order_at = (
      SELECT MAX(created_at) FROM public.orders
      WHERE customer_id = target_customer_id
    ),
    first_order_at = (
      SELECT MIN(created_at) FROM public.orders
      WHERE customer_id = target_customer_id
    )
  WHERE id = target_customer_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_change
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_stats();

-- ============================================================
-- SEED DATA
-- ============================================================

-- Catalog seed (merged from zuma_seed.sql)
INSERT INTO public.categories (id, name, slug, created_at, color, icon) VALUES
  ('22b28344-4a0a-4af9-89f6-9d81c898b749', 'Serviços de Streaming', 'streaming', '2026-02-12 03:43:23.336522+00', 'bg-[#FF5252]', '📺'),
  ('8bd746a6-903e-4d7e-8c0c-a4f32991d0ea', 'Sem Categoria', 'sem-categoria', '2025-12-29 12:38:25.604028+00', 'bg-gray-200', '📁'),
  ('91868ad5-d50a-4913-a6d8-f4d787a16f2e', 'Jumias', 'jumia', '2025-12-29 12:42:12.995804+00', 'bg-[#40C4FF]', '📦'),
  ('c949f9d9-9254-4b47-ba0e-66cff24efaae', 'Gift Cards', 'gift-cards', '2025-12-27 09:16:33.752324+00', NULL, NULL)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon;

INSERT INTO public.regions (id, name, code, created_at) VALUES
  ('148670c9-78fc-4c3c-af12-c975f3988acc', 'Inglaterra', 'GBP', '2025-12-28 17:09:18.700525+00'),
  ('184b72ae-d985-46c7-9e97-395fca71d3fb', 'Europa', 'EU', '2025-12-29 13:37:59.740303+00'),
  ('1fcc9b4c-1b5c-420c-960c-fbdb3c07a944', 'Moçambique', 'MZN', '2025-12-28 17:08:44.618557+00'),
  ('4d553aa9-388d-4d54-946e-9cc6480baa66', 'Portugal', 'EUR', '2025-12-28 17:08:55.538599+00'),
  ('54e5f30e-c966-46a7-9ade-66f98ebad796', 'Reino Unido', 'UK', '2025-12-29 13:37:59.740303+00'),
  ('792fbc85-4e37-4623-8b8a-b99306641b82', 'Brasil', 'BR', '2025-12-29 13:35:07.737056+00'),
  ('8d05a924-ec75-465d-b549-579fad3d3b19', 'Moçambique', 'MZ', '2025-12-29 13:35:07.737056+00'),
  ('94a00129-496b-454a-8ce6-7992f7631adb', 'África do Sul', 'ZAR', '2025-12-28 17:08:22.984661+00'),
  ('b760e2ae-4b51-44b3-8c51-972a11398178', 'Portugal', 'PT', '2025-12-29 13:37:59.740303+00'),
  ('c98a7568-b1ba-405f-a734-52afec2d6469', 'Estados Unidos', 'US', '2025-12-29 13:35:07.737056+00'),
  ('eee28f9e-ae47-472b-9c60-975351d2b39f', 'Estados Unidos', 'USA', '2025-12-28 17:09:05.233691+00')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name;

INSERT INTO public.brands (
  id, category_id, name, slug, logo_path, description_md, status, created_at, updated_at, hero_image_path
)
SELECT
  v.id,
  c.id,
  v.name,
  v.slug,
  v.logo_path,
  v.description_md,
  v.status,
  v.created_at,
  v.updated_at,
  v.hero_image_path
FROM (
  VALUES
    ('4b6c8565-121b-4faf-8ea4-2ce37e0d9a38'::uuid, 'gift-cards', 'PlayStation', 'playstation', NULL::text, 'Códigos digitais por região. Selecione a região correta antes de comprar. Atendimento e entrega via WhatsApp.', 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, NULL::text),
    ('99b19e62-69e7-4f0f-b7f2-29636969439d'::uuid, 'gift-cards', 'Bitcoin Top-up', 'bitcoin', NULL::text, 'Voucher/top-up digital. Não é exchange. Atendimento via WhatsApp para concluir.', 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-29 13:35:57.114852+00'::timestamptz, NULL::text),
    ('b0cb5b7d-9ad8-4409-9c05-c1ddab4525f5'::uuid, 'gift-cards', 'Apple Gift Card', 'apple', NULL::text, 'Compatibilidade depende da região. Confirme antes de finalizar. Entrega via WhatsApp.', 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, NULL::text),
    ('bc3230a3-c886-45bb-a03d-30dbf7b00ce7'::uuid, 'sem-categoria', 'Spotify', 'spotify', NULL::text, 'Escolha a região para ver valores. Atendimento no WhatsApp para concluir.', 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-29 12:48:44.973296+00'::timestamptz, NULL::text),
    ('c923076d-2d1d-4f9a-bcaf-96d17fddf975'::uuid, 'gift-cards', 'Steam', 'steam', NULL::text, 'Escolha a região para ver os valores disponíveis. Finalize o atendimento via WhatsApp.', 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, NULL::text),
    ('e5f274fb-d6c7-4dc1-81cc-4af687386a52'::uuid, 'gift-cards', 'XBOX', 'xbox', NULL::text, '', 'active', '2025-12-29 10:05:22.43107+00'::timestamptz, '2026-02-12 03:31:11.406711+00'::timestamptz, NULL::text),
    ('ec72a252-d3a8-4051-935f-a6695e2ff6de'::uuid, 'sem-categoria', 'Netflix', 'netflix', NULL::text, 'Assinaturas e gift cards por região. Selecione a região e finalize via WhatsApp.', 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-29 12:48:44.973296+00'::timestamptz, NULL::text)
) AS v(id, category_slug, name, slug, logo_path, description_md, status, created_at, updated_at, hero_image_path)
JOIN public.categories c
  ON c.slug = v.category_slug
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  logo_path = EXCLUDED.logo_path,
  hero_image_path = EXCLUDED.hero_image_path,
  description_md = EXCLUDED.description_md,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.payment_methods (
  id, name, type, instructions_md, details, status, sort_order, created_at, updated_at
) VALUES
  ('9057f8fa-acb8-464d-a45f-b6d6652fee50', 'Carteira Móvel (M-Pesa)', 'manual', 'Faça o pagamento via carteira móvel. Depois, finalize no WhatsApp e confirme o pagamento.', '{"phone":"847969837","account_name":"Marcos Tchamo"}'::jsonb, 'active', 2, '2025-12-27 09:16:33.752324+00', '2026-02-11 05:54:20.712657+00'),
  ('c865a9c1-618f-48c1-95f5-f6ed04b87ca7', 'Transferência (Outro Banco)', 'manual', 'Use os dados abaixo para transferência. Em seguida, finalize no WhatsApp.', '{"nib":"1111 1111 1111 1111 1111 1","account_name":"Zuma Digital"}'::jsonb, 'active', 3, '2025-12-27 09:16:33.752324+00', '2025-12-27 09:16:33.752324+00'),
  ('ea26d4a2-f1ed-4768-92d1-ce5025460598', 'Transferência Bancária (BIM)', 'manual', 'Faça a transferência usando os dados abaixo. Após o pagamento, finalize no WhatsApp e envie o comprovativo.', '{"bank":"BIM","account_name":"Marcos Tchamo","Numero da conta":"184385652"}'::jsonb, 'active', 1, '2025-12-27 09:16:33.752324+00', '2026-02-11 05:55:15.070951+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  instructions_md = EXCLUDED.instructions_md,
  details = EXCLUDED.details,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.offers (
  id, brand_id, region_code, denomination_value, denomination_currency, price, status,
  created_at, updated_at, cost_price, product_id, stock_quantity, is_unlimited, auto_fulfill
)
SELECT
  v.id,
  b.id,
  v.region_code,
  v.denomination_value,
  v.denomination_currency,
  v.price,
  v.status,
  v.created_at,
  v.updated_at,
  v.cost_price,
  v.product_id,
  v.stock_quantity,
  v.is_unlimited,
  v.auto_fulfill
FROM (
  VALUES
    ('0feb59e4-6432-4c5f-8952-b3ceb4ad3fc2'::uuid, 'steam', 'BR', 100::numeric, 'BRL', 118::numeric, 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, 0::numeric, NULL::uuid, 0, false, false),
    ('1387f34f-c400-463f-8356-bb14d90777e2'::uuid, 'steam', 'US', 20::numeric, 'USD', 22.0::numeric, 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, 0::numeric, NULL::uuid, 0, false, false),
    ('1cf70c4f-3481-4c46-ba97-5cae4f6b3d41'::uuid, 'steam', 'US', 50::numeric, 'USD', 54.0::numeric, 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, 0::numeric, NULL::uuid, 0, false, false),
    ('2580580a-527d-4f19-ad6b-5b0d108a44df'::uuid, 'xbox', 'MZ', 300::numeric, 'MZN', 330::numeric, 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, 0::numeric, NULL::uuid, 0, false, false),
    ('2822f8ed-e6a1-4bff-9996-4c22e66d9e4f'::uuid, 'apple', 'US', 50::numeric, 'USD', 54.0::numeric, 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, 0::numeric, NULL::uuid, 0, false, false),
    ('2ba928b4-00f3-465e-baaa-dda7e0ba33d5'::uuid, 'apple', 'BR', 50::numeric, 'BRL', 60::numeric, 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, 0::numeric, NULL::uuid, 0, false, false),
    ('2c9df9e8-4f38-4504-a305-c6554064dc0b'::uuid, 'playstation', 'BR', 100::numeric, 'BRL', 120::numeric, 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, 0::numeric, NULL::uuid, 0, false, false),
    ('36df713e-ba72-43f2-b4a9-62a748a75b0a'::uuid, 'bitcoin', 'US', 50::numeric, 'USD', 54.0::numeric, 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, 0::numeric, NULL::uuid, 0, false, false),
    ('40d39762-7c39-463c-939c-299c908191ad'::uuid, 'apple', 'US', 25::numeric, 'USD', 27.0::numeric, 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, 0::numeric, NULL::uuid, 0, false, false),
    ('43252106-3cda-4260-b4e7-da8c150d5509'::uuid, 'bitcoin', 'MZ', 1000::numeric, 'MZN', 1100::numeric, 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, 0::numeric, NULL::uuid, 0, false, false),
    ('6682291c-3dc1-43ea-9850-e60ff55c7625'::uuid, 'netflix', 'MZ', 500::numeric, 'MZN', 545::numeric, 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, 0::numeric, NULL::uuid, 0, false, false),
    ('7518dd1e-22ba-4f11-8032-9a1818397054'::uuid, 'playstation', 'US', 10::numeric, 'USD', 11.5::numeric, 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, 0::numeric, NULL::uuid, 0, false, false),
    ('779b134b-73d1-485d-abd4-fe49ef4dcc1c'::uuid, 'xbox', 'BR', 100::numeric, 'BRL', 112::numeric, 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, 0::numeric, NULL::uuid, 0, false, false),
    ('8a7b07ea-2374-4643-bf48-fd6c9f9fb8ed'::uuid, 'spotify', 'MZ', 250::numeric, 'MZN', 280::numeric, 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, 0::numeric, NULL::uuid, 0, false, false),
    ('a026464a-d8a0-4c05-b0f4-328dda628791'::uuid, 'spotify', 'US', 30::numeric, 'USD', 32.0::numeric, 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, 0::numeric, NULL::uuid, 0, false, false),
    ('b157ab9f-7519-4542-aac9-e0fa791e0be9'::uuid, 'playstation', 'BR', 35::numeric, 'BRL', 42::numeric, 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, 0::numeric, NULL::uuid, 0, false, false),
    ('b9499b4a-b8d0-4390-908d-bf5351aa1b0e'::uuid, 'spotify', 'US', 10::numeric, 'USD', 11.0::numeric, 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, 0::numeric, NULL::uuid, 0, false, false),
    ('bd073515-cdd3-4201-8cb2-a1820f7e5760'::uuid, 'bitcoin', 'US', 20::numeric, 'USD', 24::numeric, 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-29 09:21:16.400246+00'::timestamptz, 0::numeric, NULL::uuid, 0, false, false),
    ('d5985f17-61f1-41ef-904e-9eba76ecd3f8'::uuid, 'netflix', 'US', 15::numeric, 'USD', 16.5::numeric, 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, 0::numeric, NULL::uuid, 0, false, false),
    ('d7117c11-f8e2-4e2d-b9e6-5f339207a10b'::uuid, 'netflix', 'US', 25::numeric, 'USD', 27.0::numeric, 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, 0::numeric, NULL::uuid, 0, false, false),
    ('dfd80ce7-d433-49de-a19c-54fb23533b1a'::uuid, 'netflix', 'BR', 50::numeric, 'BRL', 58::numeric, 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, 0::numeric, NULL::uuid, 0, false, false),
    ('e5b969a8-2abc-44fe-83cb-03be52502ee6'::uuid, 'spotify', 'MZ', 400::numeric, 'MZN', 450::numeric, 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, 0::numeric, NULL::uuid, 0, false, false),
    ('e78b4ca0-67fb-420c-aff8-1b4fa5cabe58'::uuid, 'steam', 'BR', 50::numeric, 'BRL', 60::numeric, 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, 0::numeric, NULL::uuid, 0, false, false),
    ('fd4a5e28-f573-493f-bd63-f2aa0cb4e335'::uuid, 'playstation', 'US', 25::numeric, 'USD', 27.5::numeric, 'active', '2025-12-27 09:16:33.752324+00'::timestamptz, '2025-12-27 09:16:33.752324+00'::timestamptz, 0::numeric, NULL::uuid, 0, false, false)
) AS v(id, brand_slug, region_code, denomination_value, denomination_currency, price, status, created_at, updated_at, cost_price, product_id, stock_quantity, is_unlimited, auto_fulfill)
JOIN public.brands b
  ON b.slug = v.brand_slug
ON CONFLICT (id) DO UPDATE SET
  brand_id = EXCLUDED.brand_id,
  region_code = EXCLUDED.region_code,
  denomination_value = EXCLUDED.denomination_value,
  denomination_currency = EXCLUDED.denomination_currency,
  price = EXCLUDED.price,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at,
  cost_price = EXCLUDED.cost_price,
  product_id = EXCLUDED.product_id,
  stock_quantity = EXCLUDED.stock_quantity,
  is_unlimited = EXCLUDED.is_unlimited,
  auto_fulfill = EXCLUDED.auto_fulfill;

INSERT INTO public.faqs (id, question, answer, sort_order, created_at) VALUES
  ('cf44b42e-b148-4125-802a-a9cef4ec4891', 'Como recebo meu código?', 'O código é enviado automaticamente para seu WhatsApp e E-mail assim que o pagamento é confirmado.', 1, '2025-12-29 06:17:48.237502+00'),
  ('e6bdf0af-7cc0-465d-bb58-fe0c5c162946', 'O código funciona em contas dos EUA?', 'Depende do produto. Verifique a região indicada na descrição ("Global", "US", "MZ") antes de comprar.', 3, '2025-12-29 06:17:48.237502+00'),
  ('eab862d6-efbc-457f-8b82-17ffca727c9e', 'Posso pagar com M-Pesa ou E-mola?', 'Sim! Aceitamos M-Pesa, E-Mola e cartões de crédito/débito.', 2, '2025-12-29 06:17:48.237502+00')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  answer = EXCLUDED.answer,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.home_content (
  id, hero_title, hero_subtitle, hero_banner_image, featured_brands_title,
  trust_points_title, faq_title, whatsapp_number, updated_at
) VALUES (
  1,
  'O melhor site de compras digitais',
  'em Moçambique e no mundo',
  NULL,
  'Melhores Marcas',
  'Porque comprar com a Zuma',
  'Duvidas e respostas',
  '+258847969837',
  '2025-12-29 06:03:43.691315+00'
)
ON CONFLICT (id) DO UPDATE SET
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  hero_banner_image = EXCLUDED.hero_banner_image,
  featured_brands_title = EXCLUDED.featured_brands_title,
  trust_points_title = EXCLUDED.trust_points_title,
  faq_title = EXCLUDED.faq_title,
  whatsapp_number = EXCLUDED.whatsapp_number,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.home_featured_brands (brand_slug, sort_order, created_at) VALUES
  ('netflix', 0, '2026-02-11 06:12:19.83575+00'),
  ('playstation', 1, '2026-02-11 06:12:19.83575+00'),
  ('spotify', 2, '2026-02-11 06:12:19.83575+00')
ON CONFLICT (brand_slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.site_content (key, value, updated_at) VALUES
  ('admin_name', '{"value":"Marcos"}'::jsonb, '2025-12-28 15:49:34.187+00'),
  ('admin_title', '{"value":""}'::jsonb, '2025-12-28 15:49:35.283+00'),
  ('contact_email', '{"value":""}'::jsonb, '2025-12-28 15:49:28.348+00'),
  ('contact_whatsapp', '{"value":"+258847969837"}'::jsonb, '2025-12-29 02:40:25.346+00'),
  ('currency', '{"value":"MZN"}'::jsonb, '2025-12-28 15:49:10.231+00'),
  ('home', '{"faqs":[{"answer":"Após a confirmação do pagamento, você receberá o código do gift card diretamente no seu WhatsApp em até 10 minutos.","question":"Como funciona a entrega?"},{"answer":"Aceitamos M-Pesa, transferência bancária e outros métodos configurados pelo administrador.","question":"Quais métodos de pagamento vocês aceitam?"},{"answer":"A validade varia de acordo com cada marca. Consulte os termos específicos de cada gift card na página do produto.","question":"Os gift cards têm validade?"},{"answer":"Depende da marca. Alguns gift cards são regionais. Verifique a descrição do produto para mais detalhes.","question":"Posso usar o gift card em qualquer país?"}],"faq_title":"FAQ","hero_title":"Os maior loja de gift cards","trust_points":[{"icon":"⚡","title":"Entrega Instantânea","subtitle":"Depois do pagamento","description":"Receba seus códigos via WhatsApp em minutos"},{"icon":"🔒","title":"Pagamento Seguro","subtitle":"SIm","description":"Múltiplos métodos de pagamento disponíveis"},{"icon":"💳","title":"Marcas Confiáveis","subtitle":"Nossa procuradoria","description":"Apenas gift cards oficiais e verificados"},{"icon":"🎁","title":"Presente Perfeito","subtitle":"Sim","description":"Ideal para qualquer ocasião"}],"hero_subtitle":"As melhores marcas, entrega instantânea via WhatsApp e suporte","hero_banner_image":null,"featured_brand_slugs":["playstation","bitcoin"]}'::jsonb, '2025-12-29 03:24:14.431395+00'),
  ('language', '{"value":"pt"}'::jsonb, '2025-12-28 15:49:13.3+00'),
  ('site', '{"whatsapp_number":"+258847969837"}'::jsonb, '2025-12-27 10:31:31.965767+00'),
  ('whatsapp_number', to_jsonb('+258847969837'::text), '2025-12-29 02:40:27.211+00')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = EXCLUDED.updated_at;

-- ============================================================
-- END OF SCHEMA
-- ============================================================
