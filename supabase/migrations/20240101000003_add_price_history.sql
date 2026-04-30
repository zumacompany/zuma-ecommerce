-- Migration: Add Price and Cost History
-- Tracks margin changes and price elasticity over time

-- 1. Create Price History Table
CREATE TABLE IF NOT EXISTS public.price_history (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    offer_id uuid NOT NULL,
    old_price numeric NULL,
    new_price numeric NULL,
    old_cost_price numeric NULL,
    new_cost_price numeric NULL,
    changed_at timestamp with time zone NOT NULL DEFAULT now(),
    changed_by uuid NULL, -- Option to link to admin user
    
    CONSTRAINT price_history_pkey PRIMARY KEY (id),
    CONSTRAINT price_history_offer_id_fkey FOREIGN KEY (offer_id) 
        REFERENCES public.offers(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 2. Function to record price changes
CREATE OR REPLACE FUNCTION public.log_price_change()
RETURNS TRIGGER AS 5055
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
5055 LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger for price logging
DROP TRIGGER IF EXISTS on_offer_price_change ON public.offers;
CREATE TRIGGER on_offer_price_change
AFTER UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.log_price_change();
