BEGIN;

CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page_views bigint;
  v_category_views jsonb;
BEGIN
  SELECT COUNT(*)
  INTO v_page_views
  FROM public.analytics_events
  WHERE event_name = 'page_view'
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);

  SELECT jsonb_agg(
    jsonb_build_object(
      'category_slug', category_slug,
      'views_count', views_count
    )
  )
  INTO v_category_views
  FROM (
    SELECT
      metadata->>'category_slug' AS category_slug,
      COUNT(*) AS views_count
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

NOTIFY pgrst, 'reload schema';

COMMIT;
