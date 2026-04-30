-- Migration: Add Products Layer
-- Groups similar offers into a "Product" (e.g., Netflix Giftcard)

-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    brand_id uuid NOT NULL,
    name text NOT NULL,
    description_md text NULL,
    product_type text NOT NULL DEFAULT 'digital', -- 'digital', 'service', 'physical'
    status text NOT NULL DEFAULT 'active',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    
    CONSTRAINT products_pkey PRIMARY KEY (id),
    CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) 
        REFERENCES public.brands(id) ON DELETE CASCADE,
    CONSTRAINT products_status_check CHECK (status IN ('active', 'inactive')),
    CONSTRAINT products_type_check CHECK (product_type IN ('digital', 'service', 'physical'))
) TABLESPACE pg_default;

-- 2. Add product_id to Offers
ALTER TABLE public.offers 
ADD COLUMN IF NOT EXISTS product_id uuid NULL;

-- 3. Add Foreign Key to Offers
ALTER TABLE public.offers
ADD CONSTRAINT offers_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

-- 4. Trigger for updated_at on products
DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;
CREATE TRIGGER products_set_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
