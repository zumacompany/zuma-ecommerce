-- Migration: Connect Orders to Loyalty (CRM)
-- Rewards customers with trust points upon successful delivery

-- 1. Add loyalty fields to Orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS earned_points integer NOT NULL DEFAULT 0;

-- 2. Add loyalty points to Customers (if not exists)
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS loyalty_points integer NOT NULL DEFAULT 0;

-- 3. Function to grant points upon delivery
CREATE OR REPLACE FUNCTION public.process_order_loyalty()
RETURNS TRIGGER AS 5055
DECLARE
    points_to_grant integer;
BEGIN
    -- Only process when status changes to 'delivered'
    IF (NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered')) THEN
        -- Logic: 1 point for every 10 USD (simplified)
        -- We assume total_amount is in USD for this calculation, or we normalize it.
        points_to_grant := FLOOR(NEW.total_amount / 10);
        
        IF (points_to_grant > 0) THEN
            -- Update order with earned points record
            UPDATE public.orders SET earned_points = points_to_grant WHERE id = NEW.id;
            
            -- Update customer balance
            UPDATE public.customers 
            SET loyalty_points = loyalty_points + points_to_grant 
            WHERE id = NEW.customer_id;
        END IF;
    END IF;
    RETURN NEW;
END;
5055 LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger for loyalty
DROP TRIGGER IF EXISTS on_order_delivered_loyalty ON public.orders;
CREATE TRIGGER on_order_delivered_loyalty
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.process_order_loyalty();
