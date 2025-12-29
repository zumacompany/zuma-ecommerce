-- 1. Create the function to recalculate stats for a single customer
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER AS $$
DECLARE
    target_customer_id uuid;
BEGIN
    -- Determine which customer to update
    IF (TG_OP = 'DELETE') THEN
        target_customer_id := OLD.customer_id;
    ELSE
        target_customer_id := NEW.customer_id;
    END IF;

    -- Update stats for that customer
    UPDATE public.customers
    SET
        orders_count = (
            SELECT COUNT(*)
            FROM public.orders
            WHERE customer_id = target_customer_id
        ),
        delivered_total = (
            SELECT COALESCE(SUM(total_amount), 0)
            FROM public.orders
            WHERE customer_id = target_customer_id
            AND status = 'delivered'
        ),
        delivered_orders_count = (
            SELECT COUNT(*)
            FROM public.orders
            WHERE customer_id = target_customer_id
            AND status = 'delivered'
        ),
        last_order_at = (
            SELECT MAX(created_at)
            FROM public.orders
            WHERE customer_id = target_customer_id
        ),
        first_order_at = (
             SELECT MIN(created_at)
             FROM public.orders
             WHERE customer_id = target_customer_id
        )
    WHERE id = target_customer_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger on the orders table
DROP TRIGGER IF EXISTS on_order_change ON public.orders;

CREATE TRIGGER on_order_change
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_customer_stats();

-- 3. Run initial recalculation for all existing customers (Migration)
UPDATE public.customers c
SET
    orders_count = (SELECT COUNT(*) FROM public.orders o WHERE o.customer_id = c.id),
    delivered_total = (SELECT COALESCE(SUM(o.total_amount), 0) FROM public.orders o WHERE o.customer_id = c.id AND o.status = 'delivered'),
    delivered_orders_count = (SELECT COUNT(*) FROM public.orders o WHERE o.customer_id = c.id AND o.status = 'delivered'),
    last_order_at = (SELECT MAX(o.created_at) FROM public.orders o WHERE o.customer_id = c.id),
    first_order_at = (SELECT MIN(o.created_at) FROM public.orders o WHERE o.customer_id = c.id);
