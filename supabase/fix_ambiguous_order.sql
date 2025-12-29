-- Drop the old function first because we are changing the return type from uuid/void to jsonb
DROP FUNCTION IF EXISTS public.create_order(uuid, text, text, text, uuid, jsonb, jsonb, text);

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
BEGIN
  -- 1. Calculate total from items first to avoid NOT NULL constraint on total_amount
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_total := v_total + ((v_item->>'qty')::int * (v_item->>'unit_price')::numeric);
  END LOOP;

  -- 2. Generate order number
  v_order_num := public.generate_order_number();

  -- 3. Insert into orders with total_amount
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

  -- 4. Insert into order_items
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

  -- 5. Return result explicitly referencing order_number from the alias to avoid ambiguity
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
