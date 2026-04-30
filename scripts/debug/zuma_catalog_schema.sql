-- ============================================================
-- ZUMA CATALOG SCHEMA - COMPLETE RELATIONSHIPS
-- Run this in Supabase SQL Editor
-- ============================================================

-- First, create helper function for updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. CATEGORIES TABLE (Top level - no dependencies)
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

-- ============================================================
-- 2. REGIONS TABLE (Independent - no dependencies)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.regions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name text NOT NULL,
    code text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    
    CONSTRAINT regions_pkey PRIMARY KEY (id),
    CONSTRAINT regions_code_key UNIQUE (code)
) TABLESPACE pg_default;

-- ============================================================
-- 3. BRANDS TABLE (Depends on: categories)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.brands (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    category_id uuid NULL,  -- NULL allowed for "Sem Categoria"
    name text NOT NULL,
    slug text NOT NULL,
    logo_path text NULL,
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

-- Trigger for updated_at
DROP TRIGGER IF EXISTS brands_set_updated_at ON public.brands;
CREATE TRIGGER brands_set_updated_at
    BEFORE UPDATE ON public.brands
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 4. OFFERS TABLE (Depends on: brands, regions)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.offers (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    brand_id uuid NOT NULL,
    region_code text NOT NULL,
    denomination_value numeric NOT NULL,
    denomination_currency text NOT NULL DEFAULT 'USD',
    price numeric NOT NULL,
    cost_price numeric NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'active',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    
    CONSTRAINT offers_pkey PRIMARY KEY (id),
    CONSTRAINT offers_brand_id_fkey FOREIGN KEY (brand_id) 
        REFERENCES public.brands(id) ON DELETE CASCADE,
    CONSTRAINT offers_region_code_fkey FOREIGN KEY (region_code) 
        REFERENCES public.regions(code) ON DELETE RESTRICT,
    CONSTRAINT offers_status_check CHECK (status IN ('active', 'inactive'))
) TABLESPACE pg_default;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS offers_set_updated_at ON public.offers;
CREATE TRIGGER offers_set_updated_at
    BEFORE UPDATE ON public.offers
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- RELATIONSHIP SUMMARY
-- ============================================================
-- 
-- categories (1) ──────< brands (many)
--     │                      │
--     │  ON DELETE           │  ON DELETE
--     │  SET NULL            │  CASCADE
--     ▼                      ▼
-- (brands.category_id     offers
--  becomes NULL)          (deleted)
--
-- regions (1) ────────────────< offers (many)
--                                  │
--                    ON DELETE     │
--                    RESTRICT      │
--                    (blocked)     │
--                                  ▼
--                              (cannot delete
--                               region with offers)
--
-- ============================================================

-- ============================================================
-- SEED: Default "Sem Categoria" category
-- ============================================================
INSERT INTO public.categories (name, slug, color, icon)
VALUES ('Sem Categoria', 'sem-categoria', 'bg-gray-200', '📁')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED: Default regions for Mozambique
-- ============================================================
INSERT INTO public.regions (name, code) VALUES
    ('Moçambique', 'MZ'),
    ('África do Sul', 'ZA'),
    ('Estados Unidos', 'US'),
    ('Europa', 'EU'),
    ('Reino Unido', 'UK'),
    ('Brasil', 'BR'),
    ('Portugal', 'PT'),
    ('Angola', 'AO')
ON CONFLICT (code) DO NOTHING;
