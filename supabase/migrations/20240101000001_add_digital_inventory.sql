-- Migration: Add Digital Inventory & Fulfillment
-- Tracks codes/licenses and automates delivery

-- 1. Create Digital Codes Table
CREATE TABLE IF NOT EXISTS public.digital_codes (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    offer_id uuid NOT NULL,
    code_content text NOT NULL, -- To be encrypted at app level, or stored as is for now
    status text NOT NULL DEFAULT 'available', -- 'available', 'sold', 'revoked'
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

-- 2. Add Automation & Stock Fields to Offers
ALTER TABLE public.offers
ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_unlimited boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_fulfill boolean NOT NULL DEFAULT false;

-- 3. Function to update stock count automatically
CREATE OR REPLACE FUNCTION public.sync_offer_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        IF (NEW.status = 'available') THEN
            UPDATE public.offers 
            SET stock_quantity = (SELECT count(*) FROM public.digital_codes WHERE offer_id = NEW.offer_id AND status = 'available')
            WHERE id = NEW.offer_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.offers 
        SET stock_quantity = (SELECT count(*) FROM public.digital_codes WHERE offer_id = OLD.offer_id AND status = 'available')
        WHERE id = OLD.offer_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger for stock sync
DROP TRIGGER IF EXISTS on_digital_code_change ON public.digital_codes;
CREATE TRIGGER on_digital_code_change
AFTER INSERT OR UPDATE OR DELETE ON public.digital_codes
FOR EACH ROW EXECUTE FUNCTION public.sync_offer_stock();
