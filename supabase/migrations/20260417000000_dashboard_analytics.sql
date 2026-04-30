-- ============================================================
-- Zuma - Performance Optimizations
-- ============================================================

-- 1. Index on created_at for dashboard queries
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS customers_created_at_idx ON public.customers(created_at);

-- 2. View for page views aggregation
CREATE OR REPLACE VIEW public.dashboard_page_views AS
SELECT
  date_trunc('day', created_at) as view_date,
  COUNT(*) as views_count
FROM public.analytics_events
WHERE event_name = 'page_view'
GROUP BY date_trunc('day', created_at);

-- 3. View for category views aggregation
CREATE OR REPLACE VIEW public.dashboard_category_views AS
SELECT
  metadata->>'category_slug' as category_slug,
  COUNT(*) as views_count
FROM public.analytics_events
WHERE event_name = 'view_category' AND metadata->>'category_slug' IS NOT NULL
GROUP BY metadata->>'category_slug';

-- 4. Function for fetching dashboard stats efficiently
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
  p_start_date timestamp with time zone DEFAULT NULL,
  p_end_date timestamp with time zone DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_page_views bigint;
  v_category_views jsonb;
BEGIN
  -- Page views
  SELECT COUNT(*)
  INTO v_page_views
  FROM public.analytics_events
  WHERE event_name = 'page_view'
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);

  -- Category views
  SELECT jsonb_agg(
    jsonb_build_object(
      'category_slug', category_slug,
      'views_count', views_count
    )
  )
  INTO v_category_views
  FROM (
    SELECT
      metadata->>'category_slug' as category_slug,
      COUNT(*) as views_count
    FROM public.analytics_events
    WHERE event_name = 'view_category'
      AND metadata->>'category_slug' IS NOT NULL
      AND (p_start_date IS NULL OR created_at >= p_start_date)
      AND (p_end_date IS NULL OR created_at <= p_end_date)
    GROUP BY metadata->>'category_slug'
    ORDER BY views_count DESC
    LIMIT 10
  ) q;

  RETURN jsonb_build_object(
    'page_views', COALESCE(v_page_views, 0),
    'popular_categories', COALESCE(v_category_views, '[]'::jsonb)
  );
END;
$$;
