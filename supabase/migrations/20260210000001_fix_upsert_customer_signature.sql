-- ============================================================
-- 🚀 TARGETED FIX: upsert_customer_by_whatsapp signature
-- Date: 2026-02-10
-- ============================================================

-- This migration fixes the "Could not find function..." error by
-- synchronizing the 9-parameter call from the app with the database.

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
  -- Handle logic for non-WhatsApp customers (e.g., initial email-only or physical)
  IF p_whatsapp_e164 IS NULL OR p_whatsapp_e164 = '' THEN
    INSERT INTO public.customers (
      name,
      email,
      whatsapp_display,
      country,
      province,
      city,
      birthdate
    ) VALUES (
      p_name,
      p_email,
      p_whatsapp_display,
      p_country,
      p_province,
      p_city,
      p_birthdate
    )
    RETURNING id INTO v_id;

    RETURN v_id;
  END IF;

  -- Upsert logic using WhatsApp E164 as unique key
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

-- Verification Section
DO $$ 
BEGIN
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'Database Function Fix Applied!';
  RAISE NOTICE 'Function: upsert_customer_by_whatsapp (9 parameters)';
  RAISE NOTICE '===============================================';
END $$;
