-- ============================================================
-- ZUMA - DATABASE SCHEMA (CANONICAL)
-- ============================================================

-- Extensions
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Helper: updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Catalog
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL,
  color text NULL,
  icon text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_slug_key UNIQUE (slug)
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.regions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  code text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT regions_pkey PRIMARY KEY (id),
  CONSTRAINT regions_code_key UNIQUE (code)
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.brands (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  category_id uuid NULL,
  name text NOT NULL,
  slug text NOT NULL,
  logo_path text NULL,
  hero_image_path text NULL,
  description_md text NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT brands_pkey PRIMARY KEY (id),
  CONSTRAINT brands_slug_key UNIQUE (slug),
  CONSTRAINT brands_category_id_fkey FOREIGN KEY (category_id)
    REFERENCES public.categories(id) ON DELETE SET NULL,
  CONSTRAINT brands_status_check CHECK (status IN ('active', 'inactive'))
) TABLESPACE pg_default;

DROP TRIGGER IF EXISTS brands_set_updated_at ON public.brands;
CREATE TRIGGER brands_set_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  brand_id uuid NOT NULL,
  name text NOT NULL,
  description_md text NULL,
  product_type text NOT NULL DEFAULT 'digital',
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id)
    REFERENCES public.brands(id) ON DELETE CASCADE,
  CONSTRAINT products_status_check CHECK (status IN ('active', 'inactive')),
  CONSTRAINT products_type_check CHECK (product_type IN ('digital', 'service', 'physical'))
) TABLESPACE pg_default;

DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;
CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.offers (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  brand_id uuid NOT NULL,
  product_id uuid NULL,
  region_code text NOT NULL,
  denomination_value numeric NOT NULL,
  denomination_currency text NOT NULL DEFAULT 'USD',
  price numeric NOT NULL,
  cost_price numeric NOT NULL DEFAULT 0,
  stock_quantity integer NOT NULL DEFAULT 0,
  is_unlimited boolean NOT NULL DEFAULT false,
  auto_fulfill boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT offers_pkey PRIMARY KEY (id),
  CONSTRAINT offers_brand_id_fkey FOREIGN KEY (brand_id)
    REFERENCES public.brands(id) ON DELETE CASCADE,
  CONSTRAINT offers_product_id_fkey FOREIGN KEY (product_id)
    REFERENCES public.products(id) ON DELETE SET NULL,
  CONSTRAINT offers_region_code_fkey FOREIGN KEY (region_code)
    REFERENCES public.regions(code) ON DELETE RESTRICT,
  CONSTRAINT offers_status_check CHECK (status IN ('active', 'inactive'))
) TABLESPACE pg_default;

DROP TRIGGER IF EXISTS offers_set_updated_at ON public.offers;
CREATE TRIGGER offers_set_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS offers_brand_id_idx ON public.offers(brand_id);
CREATE INDEX IF NOT EXISTS offers_region_code_idx ON public.offers(region_code);

-- ============================================================
-- Customers & Orders
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  email text NULL,
  whatsapp_e164 text NULL,
  whatsapp_display text NULL,
  country text NULL,
  province text NULL,
  city text NULL,
  birthdate date NULL,
  status text NOT NULL DEFAULT 'active',
  orders_count integer NOT NULL DEFAULT 0,
  delivered_total numeric NOT NULL DEFAULT 0,
  delivered_orders_count integer NOT NULL DEFAULT 0,
  last_order_at timestamp with time zone NULL,
  first_order_at timestamp with time zone NULL,
  loyalty_points integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_whatsapp_e164_key UNIQUE (whatsapp_e164),
  CONSTRAINT customers_status_check CHECK (status IN ('active', 'inactive'))
) TABLESPACE pg_default;

DROP TRIGGER IF EXISTS customers_set_updated_at ON public.customers;
CREATE TRIGGER customers_set_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  type text NOT NULL,
  instructions_md text NULL,
  details jsonb NULL,
  status text NOT NULL DEFAULT 'active',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payment_methods_pkey PRIMARY KEY (id),
  CONSTRAINT payment_methods_type_check CHECK (type IN ('manual', 'stripe', 'mpesa')),
  CONSTRAINT payment_methods_status_check CHECK (status IN ('active', 'inactive'))
) TABLESPACE pg_default;

DROP TRIGGER IF EXISTS payment_methods_set_updated_at ON public.payment_methods;
CREATE TRIGGER payment_methods_set_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  order_number text NOT NULL,
  customer_id uuid NULL,
  customer_name text NOT NULL,
  customer_email text NULL,
  customer_whatsapp text NULL,
  payment_method_id uuid NULL,
  payment_method_snapshot jsonb NULL,
  currency text NOT NULL DEFAULT 'USD',
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new',
  handoff_clicked_at timestamp with time zone NULL,
  delivery_codes text NULL,
  admin_notes text NULL,
  earned_points integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_order_number_key UNIQUE (order_number),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id)
    REFERENCES public.customers(id) ON DELETE SET NULL,
  CONSTRAINT orders_payment_method_id_fkey FOREIGN KEY (payment_method_id)
    REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  CONSTRAINT orders_status_check CHECK (status IN (
    'new', 'on_hold', 'pending', 'processing', 'shipped', 'delivered', 'canceled'
  ))
) TABLESPACE pg_default;

DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON public.orders(customer_id);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  order_id uuid NOT NULL,
  offer_id uuid NOT NULL,
  qty integer NOT NULL,
  unit_price numeric NOT NULL,
  total numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id)
    REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_offer_id_fkey FOREIGN KEY (offer_id)
    REFERENCES public.offers(id) ON DELETE RESTRICT
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  order_id uuid NOT NULL,
  from_status text NULL,
  to_status text NOT NULL,
  note text NULL,
  changed_by uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_status_history_pkey PRIMARY KEY (id),
  CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id)
    REFERENCES public.orders(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ============================================================
-- Inventory & Pricing
-- ============================================================
CREATE TABLE IF NOT EXISTS public.digital_codes (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  offer_id uuid NOT NULL,
  code_content text NOT NULL,
  status text NOT NULL DEFAULT 'available',
  order_id uuid NULL,
  assigned_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT digital_codes_pkey PRIMARY KEY (id),
  CONSTRAINT digital_codes_offer_id_fkey FOREIGN KEY (offer_id)
    REFERENCES public.offers(id) ON DELETE CASCADE,
  CONSTRAINT digital_codes_order_id_fkey FOREIGN KEY (order_id)
    REFERENCES public.orders(id) ON DELETE SET NULL,
  CONSTRAINT digital_codes_status_check CHECK (status IN ('available', 'sold', 'revoked'))
) TABLESPACE pg_default;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_digital_code_change ON public.digital_codes;
CREATE TRIGGER on_digital_code_change
  AFTER INSERT OR UPDATE OR DELETE ON public.digital_codes
  FOR EACH ROW EXECUTE FUNCTION public.sync_offer_stock();

CREATE TABLE IF NOT EXISTS public.price_history (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  offer_id uuid NOT NULL,
  old_price numeric NULL,
  new_price numeric NULL,
  old_cost_price numeric NULL,
  new_cost_price numeric NULL,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  changed_by uuid NULL,
  CONSTRAINT price_history_pkey PRIMARY KEY (id),
  CONSTRAINT price_history_offer_id_fkey FOREIGN KEY (offer_id)
    REFERENCES public.offers(id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE OR REPLACE FUNCTION public.log_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.price != OLD.price OR COALESCE(NEW.cost_price, 0) != COALESCE(OLD.cost_price, 0)) THEN
    INSERT INTO public.price_history (
      offer_id,
      old_price,
      new_price,
      old_cost_price,
      new_cost_price
    ) VALUES (
      NEW.id,
      OLD.price,
      NEW.price,
      OLD.cost_price,
      NEW.cost_price
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_offer_price_change ON public.offers;
CREATE TRIGGER on_offer_price_change
  AFTER UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.log_price_change();

-- ============================================================
-- Analytics & Audit
-- ============================================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  session_id text NULL,
  event_name text NOT NULL,
  order_id uuid NULL,
  metadata jsonb NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT analytics_events_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_events_order_id_fkey FOREIGN KEY (order_id)
    REFERENCES public.orders(id) ON DELETE SET NULL
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  admin_email text NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid NULL,
  details jsonb NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- ============================================================
-- Site Content
-- ============================================================
CREATE TABLE IF NOT EXISTS public.home_content (
  id integer NOT NULL,
  hero_title text NULL,
  hero_subtitle text NULL,
  hero_banner_image text NULL,
  featured_brands_title text NULL,
  trust_points_title text NULL,
  faq_title text NULL,
  whatsapp_number text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT home_content_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

DROP TRIGGER IF EXISTS home_content_set_updated_at ON public.home_content;
CREATE TRIGGER home_content_set_updated_at
  BEFORE UPDATE ON public.home_content
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.trust_points (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  title text NOT NULL,
  subtitle text NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT trust_points_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT faqs_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.home_featured_brands (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  brand_slug text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT home_featured_brands_pkey PRIMARY KEY (id),
  CONSTRAINT home_featured_brands_brand_slug_key UNIQUE (brand_slug)
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.site_content (
  key text NOT NULL,
  value jsonb NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT site_content_pkey PRIMARY KEY (key)
) TABLESPACE pg_default;

DROP TRIGGER IF EXISTS site_content_set_updated_at ON public.site_content;
CREATE TRIGGER site_content_set_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.notes (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  content text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notes_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- ============================================================
-- Derived Views
-- ============================================================
CREATE OR REPLACE VIEW public.customer_aggregates AS
SELECT
  id AS customer_id,
  orders_count,
  last_order_at,
  delivered_total
FROM public.customers;

-- ============================================================
-- Functions & Triggers (Orders)
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text AS $$
DECLARE
  seq_val bigint;
BEGIN
  SELECT nextval('public.order_number_seq') INTO seq_val;
  RETURN 'ZM-' || lpad(seq_val::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

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
  -- Validate stock for each item
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

  v_order_num := public.generate_order_number();

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
  IF p_whatsapp_e164 IS NULL OR p_whatsapp_e164 = '' THEN
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
      NULL,
      p_whatsapp_display,
      p_country,
      p_province,
      p_city,
      p_birthdate
    )
    RETURNING id INTO v_id;

    RETURN v_id;
  END IF;

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

DROP TRIGGER IF EXISTS on_order_change ON public.orders;
CREATE TRIGGER on_order_change
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_customer_stats();

CREATE OR REPLACE FUNCTION public.process_order_loyalty()
RETURNS TRIGGER AS $$
DECLARE
  points_to_grant integer;
BEGIN
  IF (NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered')) THEN
    points_to_grant := FLOOR(NEW.total_amount / 10);

    IF (points_to_grant > 0) THEN
      UPDATE public.orders SET earned_points = points_to_grant WHERE id = NEW.id;
      UPDATE public.customers
      SET loyalty_points = loyalty_points + points_to_grant
      WHERE id = NEW.customer_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_delivered_loyalty ON public.orders;
CREATE TRIGGER on_order_delivered_loyalty
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.process_order_loyalty();

-- ============================================================
-- Seeds
-- ============================================================
INSERT INTO public.categories (name, slug, color, icon)
VALUES ('Sem Categoria', 'sem-categoria', 'bg-gray-200', 'folder')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.regions (name, code) VALUES
  ('Mocambique', 'MZ'),
  ('Africa do Sul', 'ZA'),
  ('Estados Unidos', 'US'),
  ('Europa', 'EU'),
  ('Reino Unido', 'UK'),
  ('Brasil', 'BR'),
  ('Portugal', 'PT'),
  ('Angola', 'AO')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.home_content (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
