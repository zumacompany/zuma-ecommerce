-- ============================================================
-- Zuma - Database cleanup audit
-- ============================================================
-- Purpose:
--   1. Find potentially useless tables.
--   2. Find potentially useless columns.
--   3. Find duplicate business data.
--   4. Identify modeling and integrity problems.
--   5. Emit a safe cleanup plan.
--
-- Safety:
--   - This script does not delete or alter application data.
--   - It creates only temporary tables in the current session.
--   - Exact row/column profiling can scan tables. Tune _audit_config if needed.
--
-- Recommended before running:
--   ANALYZE public.categories;
--   ANALYZE public.brands;
--   ANALYZE public.offers;
--   ANALYZE public.customers;
--   ANALYZE public.orders;
--   ANALYZE public.order_items;
--   ANALYZE public.digital_codes;
--   ANALYZE public.analytics_events;
-- ============================================================

BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '10min';

DROP TABLE IF EXISTS pg_temp._audit_config;
CREATE TEMP TABLE _audit_config AS
SELECT
  'public'::name AS schema_name,
  0.95::numeric AS mostly_null_threshold,
  250000::bigint AS max_rows_for_exact_column_profile,
  20::bigint AS min_rows_for_constant_column_candidate,
  90::integer AS stale_days;

-- ============================================================
-- 1. Table inventory
-- ============================================================

DROP TABLE IF EXISTS pg_temp._audit_table_counts;
CREATE TEMP TABLE _audit_table_counts (
  table_schema name NOT NULL,
  table_name name NOT NULL,
  row_count bigint NOT NULL,
  PRIMARY KEY (table_schema, table_name)
);

DO $$
DECLARE
  r record;
  v_count bigint;
BEGIN
  FOR r IN
    SELECT n.nspname AS table_schema, c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN _audit_config cfg ON cfg.schema_name = n.nspname
    WHERE c.relkind IN ('r', 'p')
      AND c.relpersistence = 'p'
    ORDER BY n.nspname, c.relname
  LOOP
    EXECUTE format('SELECT count(*)::bigint FROM %I.%I', r.table_schema, r.table_name)
      INTO v_count;

    INSERT INTO _audit_table_counts(table_schema, table_name, row_count)
    VALUES (r.table_schema, r.table_name, v_count);
  END LOOP;
END $$;

DROP TABLE IF EXISTS pg_temp._audit_table_recency;
CREATE TEMP TABLE _audit_table_recency (
  table_schema name NOT NULL,
  table_name name NOT NULL,
  latest_created_at timestamptz NULL,
  latest_updated_at timestamptz NULL,
  PRIMARY KEY (table_schema, table_name)
);

DO $$
DECLARE
  r record;
  v_created_expr text;
  v_updated_expr text;
  v_latest_created_at timestamptz;
  v_latest_updated_at timestamptz;
BEGIN
  FOR r IN
    SELECT table_schema, table_name
    FROM _audit_table_counts
    ORDER BY table_schema, table_name
  LOOP
    SELECT
      CASE
        WHEN EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = r.table_schema
            AND table_name = r.table_name
            AND column_name = 'created_at'
            AND data_type IN ('timestamp with time zone', 'timestamp without time zone', 'date')
        ) THEN 'max(created_at)::timestamptz'
        ELSE 'NULL::timestamptz'
      END,
      CASE
        WHEN EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = r.table_schema
            AND table_name = r.table_name
            AND column_name = 'updated_at'
            AND data_type IN ('timestamp with time zone', 'timestamp without time zone', 'date')
        ) THEN 'max(updated_at)::timestamptz'
        ELSE 'NULL::timestamptz'
      END
    INTO v_created_expr, v_updated_expr;

    EXECUTE format(
      'SELECT %s, %s FROM %I.%I',
      v_created_expr,
      v_updated_expr,
      r.table_schema,
      r.table_name
    ) INTO v_latest_created_at, v_latest_updated_at;

    INSERT INTO _audit_table_recency(table_schema, table_name, latest_created_at, latest_updated_at)
    VALUES (r.table_schema, r.table_name, v_latest_created_at, v_latest_updated_at);
  END LOOP;
END $$;

DROP TABLE IF EXISTS pg_temp._audit_table_inventory;
CREATE TEMP TABLE _audit_table_inventory AS
WITH rels AS (
  SELECT
    n.nspname AS table_schema,
    c.relname AS table_name,
    c.oid AS relid,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced,
    c.reltuples::bigint AS planner_row_estimate,
    pg_total_relation_size(c.oid) AS total_bytes,
    pg_relation_size(c.oid) AS table_bytes,
    pg_indexes_size(c.oid) AS index_bytes,
    obj_description(c.oid, 'pg_class') AS table_comment
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN _audit_config cfg ON cfg.schema_name = n.nspname
  WHERE c.relkind IN ('r', 'p')
    AND c.relpersistence = 'p'
), constraint_counts AS (
  SELECT
    conrelid AS relid,
    count(*) FILTER (WHERE contype = 'p') AS pk_count,
    count(*) FILTER (WHERE contype = 'u') AS unique_constraint_count,
    count(*) FILTER (WHERE contype = 'f') AS outbound_fk_count,
    count(*) FILTER (WHERE contype = 'c') AS check_constraint_count
  FROM pg_constraint
  GROUP BY conrelid
), inbound_fk_counts AS (
  SELECT confrelid AS relid, count(*) AS inbound_fk_count
  FROM pg_constraint
  WHERE contype = 'f'
  GROUP BY confrelid
), policy_counts AS (
  SELECT polrelid AS relid, count(*) AS policy_count
  FROM pg_policy
  GROUP BY polrelid
), index_counts AS (
  SELECT indrelid AS relid, count(*) AS index_count
  FROM pg_index
  GROUP BY indrelid
), stats_reset AS (
  SELECT stats_reset
  FROM pg_stat_database
  WHERE datname = current_database()
)
SELECT
  r.table_schema,
  r.table_name,
  c.row_count,
  r.planner_row_estimate,
  pg_size_pretty(r.total_bytes) AS total_size,
  r.total_bytes,
  pg_size_pretty(r.table_bytes) AS table_size,
  pg_size_pretty(r.index_bytes) AS index_size,
  COALESCE(cc.pk_count, 0) > 0 AS has_primary_key,
  COALESCE(cc.unique_constraint_count, 0) AS unique_constraint_count,
  COALESCE(cc.outbound_fk_count, 0) AS outbound_fk_count,
  COALESCE(ifk.inbound_fk_count, 0) AS inbound_fk_count,
  COALESCE(cc.check_constraint_count, 0) AS check_constraint_count,
  COALESCE(ic.index_count, 0) AS index_count,
  r.rls_enabled,
  r.rls_forced,
  COALESCE(pc.policy_count, 0) AS policy_count,
  COALESCE(st.seq_scan, 0) AS seq_scan,
  COALESCE(st.idx_scan, 0) AS idx_scan,
  COALESCE(st.n_tup_ins, 0) AS tuples_inserted_since_stats_reset,
  COALESCE(st.n_tup_upd, 0) AS tuples_updated_since_stats_reset,
  COALESCE(st.n_tup_del, 0) AS tuples_deleted_since_stats_reset,
  tr.latest_created_at,
  tr.latest_updated_at,
  st.last_vacuum,
  st.last_autovacuum,
  st.last_analyze,
  st.last_autoanalyze,
  sr.stats_reset,
  r.table_comment
FROM rels r
JOIN _audit_table_counts c
  ON c.table_schema = r.table_schema
 AND c.table_name = r.table_name
LEFT JOIN constraint_counts cc ON cc.relid = r.relid
LEFT JOIN inbound_fk_counts ifk ON ifk.relid = r.relid
LEFT JOIN policy_counts pc ON pc.relid = r.relid
LEFT JOIN index_counts ic ON ic.relid = r.relid
LEFT JOIN pg_stat_user_tables st ON st.relid = r.relid
LEFT JOIN _audit_table_recency tr
  ON tr.table_schema = r.table_schema
 AND tr.table_name = r.table_name
CROSS JOIN stats_reset sr;

DROP TABLE IF EXISTS pg_temp._audit_table_candidates;
CREATE TEMP TABLE _audit_table_candidates AS
SELECT
  table_schema,
  table_name,
  row_count,
  total_size,
  has_primary_key,
  outbound_fk_count,
  inbound_fk_count,
  rls_enabled,
  policy_count,
  seq_scan,
  idx_scan,
  tuples_inserted_since_stats_reset,
  tuples_updated_since_stats_reset,
  tuples_deleted_since_stats_reset,
  latest_created_at,
  latest_updated_at,
  stats_reset,
  CASE
    WHEN table_name IN ('subscription_plans', 'subscriptions', 'stripe_events', 'customer_payment_profiles')
      AND row_count = 0 THEN 'medium'
    WHEN row_count = 0 AND inbound_fk_count = 0 THEN 'medium'
    WHEN row_count = 0 THEN 'low'
    WHEN row_count > 0
      AND inbound_fk_count = 0
      AND COALESCE(latest_updated_at, latest_created_at) IS NOT NULL
      AND COALESCE(latest_updated_at, latest_created_at) < now() - make_interval(days => (SELECT stale_days FROM _audit_config LIMIT 1)) THEN 'low'
    WHEN row_count > 0
      AND inbound_fk_count = 0
      AND outbound_fk_count = 0
      AND (seq_scan + idx_scan) = 0
      AND (tuples_inserted_since_stats_reset + tuples_updated_since_stats_reset + tuples_deleted_since_stats_reset) = 0 THEN 'low'
    ELSE 'review'
  END AS cleanup_candidate_level,
  concat_ws('; ',
    CASE WHEN row_count = 0 THEN 'empty_table' END,
    CASE WHEN inbound_fk_count = 0 THEN 'not_referenced_by_fk' END,
    CASE WHEN outbound_fk_count = 0 THEN 'references_no_other_tables' END,
    CASE WHEN (seq_scan + idx_scan) = 0 THEN 'no_recorded_reads_since_stats_reset' END,
    CASE WHEN (tuples_inserted_since_stats_reset + tuples_updated_since_stats_reset + tuples_deleted_since_stats_reset) = 0 THEN 'no_recorded_writes_since_stats_reset' END,
    CASE
      WHEN COALESCE(latest_updated_at, latest_created_at) IS NOT NULL
       AND COALESCE(latest_updated_at, latest_created_at) < now() - make_interval(days => (SELECT stale_days FROM _audit_config LIMIT 1))
      THEN 'no_recent_created_or_updated_rows'
    END,
    CASE WHEN table_name IN ('subscription_plans', 'subscriptions', 'stripe_events') THEN 'future_or_integration_feature_name' END,
    CASE WHEN table_name IN ('audit_logs', 'admin_audit_log') THEN 'overlapping_audit_log_domain' END
  ) AS reasons,
  CASE
    WHEN row_count = 0 THEN 'Do not drop immediately. Archive DDL + app check + 30 day hold, then drop in a separate migration.'
    ELSE 'Review application usage and pg_stat reset date before any cleanup.'
  END AS safe_action
FROM _audit_table_inventory
WHERE row_count = 0
   OR table_name IN ('subscription_plans', 'subscriptions', 'stripe_events', 'customer_payment_profiles', 'audit_logs', 'admin_audit_log')
   OR (
     row_count > 0
     AND inbound_fk_count = 0
     AND COALESCE(latest_updated_at, latest_created_at) IS NOT NULL
     AND COALESCE(latest_updated_at, latest_created_at) < now() - make_interval(days => (SELECT stale_days FROM _audit_config LIMIT 1))
   )
   OR (
     inbound_fk_count = 0
     AND outbound_fk_count = 0
     AND (seq_scan + idx_scan) = 0
     AND (tuples_inserted_since_stats_reset + tuples_updated_since_stats_reset + tuples_deleted_since_stats_reset) = 0
   );

-- ============================================================
-- 2. Column inventory and potentially useless columns
-- ============================================================

DROP TABLE IF EXISTS pg_temp._audit_column_profile;
CREATE TEMP TABLE _audit_column_profile (
  table_schema name NOT NULL,
  table_name name NOT NULL,
  column_name name NOT NULL,
  ordinal_position integer NOT NULL,
  data_type text NOT NULL,
  udt_name name NOT NULL,
  is_nullable text NOT NULL,
  column_default text NULL,
  row_count bigint NOT NULL,
  null_count bigint NULL,
  blank_count bigint NULL,
  distinct_count bigint NULL,
  exact_profile boolean NOT NULL,
  profile_note text NULL,
  PRIMARY KEY (table_schema, table_name, column_name)
);

DO $$
DECLARE
  v_col record;
  v_row_count bigint;
  v_null_count bigint;
  v_blank_count bigint;
  v_distinct_count bigint;
  v_max_rows bigint;
  v_distinct_sql text;
  v_blank_sql text;
  v_stats record;
BEGIN
  SELECT max_rows_for_exact_column_profile INTO v_max_rows FROM _audit_config LIMIT 1;

  FOR v_col IN
    SELECT
      c.table_schema,
      c.table_name,
      c.column_name,
      c.ordinal_position,
      c.data_type,
      c.udt_name,
      c.is_nullable,
      c.column_default
    FROM information_schema.columns c
    JOIN _audit_config cfg ON cfg.schema_name = c.table_schema
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema
     AND t.table_name = c.table_name
     AND t.table_type = 'BASE TABLE'
    ORDER BY c.table_schema, c.table_name, c.ordinal_position
  LOOP
    SELECT row_count
    INTO v_row_count
    FROM _audit_table_counts
    WHERE table_schema = v_col.table_schema
      AND table_name = v_col.table_name;

    IF COALESCE(v_row_count, 0) <= v_max_rows THEN
      IF v_col.udt_name IN ('json', 'jsonb', 'bytea') OR v_col.data_type = 'ARRAY' THEN
        v_distinct_sql := 'NULL::bigint';
      ELSE
        v_distinct_sql := format('COUNT(DISTINCT %I)::bigint', v_col.column_name);
      END IF;

      IF v_col.udt_name IN ('text', 'varchar', 'bpchar', 'citext') THEN
        v_blank_sql := format(
          'COUNT(*) FILTER (WHERE %1$I IS NOT NULL AND btrim(%1$I::text) = '''')::bigint',
          v_col.column_name
        );
      ELSE
        v_blank_sql := 'NULL::bigint';
      END IF;

      EXECUTE format(
        'SELECT COUNT(*) FILTER (WHERE %1$I IS NULL)::bigint, %2$s, %3$s FROM %4$I.%5$I',
        v_col.column_name,
        v_blank_sql,
        v_distinct_sql,
        v_col.table_schema,
        v_col.table_name
      ) INTO v_null_count, v_blank_count, v_distinct_count;

      INSERT INTO _audit_column_profile VALUES (
        v_col.table_schema,
        v_col.table_name,
        v_col.column_name,
        v_col.ordinal_position,
        v_col.data_type,
        v_col.udt_name,
        v_col.is_nullable,
        v_col.column_default,
        v_row_count,
        v_null_count,
        v_blank_count,
        v_distinct_count,
        true,
        'exact_count'
      );
    ELSE
      SELECT null_frac, n_distinct
      INTO v_stats
      FROM pg_stats
      WHERE schemaname = v_col.table_schema
        AND tablename = v_col.table_name
        AND attname = v_col.column_name;

      INSERT INTO _audit_column_profile VALUES (
        v_col.table_schema,
        v_col.table_name,
        v_col.column_name,
        v_col.ordinal_position,
        v_col.data_type,
        v_col.udt_name,
        v_col.is_nullable,
        v_col.column_default,
        v_row_count,
        CASE WHEN v_stats.null_frac IS NULL THEN NULL ELSE round(v_stats.null_frac * v_row_count)::bigint END,
        NULL,
        CASE
          WHEN v_stats.n_distinct IS NULL THEN NULL
          WHEN v_stats.n_distinct < 0 THEN round(abs(v_stats.n_distinct) * v_row_count)::bigint
          ELSE v_stats.n_distinct::bigint
        END,
        false,
        'pg_stats_estimate_table_over_max_rows'
      );
    END IF;
  END LOOP;
END $$;

DROP TABLE IF EXISTS pg_temp._audit_column_candidates;
CREATE TEMP TABLE _audit_column_candidates AS
WITH pk_cols AS (
  SELECT ns.nspname AS table_schema, cls.relname AS table_name, att.attname AS column_name
  FROM pg_constraint con
  JOIN pg_class cls ON cls.oid = con.conrelid
  JOIN pg_namespace ns ON ns.oid = cls.relnamespace
  JOIN unnest(con.conkey) AS k(attnum) ON true
  JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = k.attnum
  WHERE con.contype = 'p'
), fk_cols AS (
  SELECT ns.nspname AS table_schema, cls.relname AS table_name, att.attname AS column_name
  FROM pg_constraint con
  JOIN pg_class cls ON cls.oid = con.conrelid
  JOIN pg_namespace ns ON ns.oid = cls.relnamespace
  JOIN unnest(con.conkey) AS k(attnum) ON true
  JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = k.attnum
  WHERE con.contype = 'f'
), unique_cols AS (
  SELECT ns.nspname AS table_schema, cls.relname AS table_name, att.attname AS column_name
  FROM pg_constraint con
  JOIN pg_class cls ON cls.oid = con.conrelid
  JOIN pg_namespace ns ON ns.oid = cls.relnamespace
  JOIN unnest(con.conkey) AS k(attnum) ON true
  JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = k.attnum
  WHERE con.contype IN ('u', 'p')
), enriched AS (
  SELECT
    p.*,
    (pk.column_name IS NOT NULL) AS is_primary_key_column,
    (fk.column_name IS NOT NULL) AS is_foreign_key_column,
    (uq.column_name IS NOT NULL) AS is_unique_or_pk_column,
    CASE
      WHEN p.row_count = 0 THEN 'table_empty_column_unknown'
      WHEN p.null_count = p.row_count THEN 'all_null'
      WHEN p.row_count > 0 AND p.null_count::numeric / NULLIF(p.row_count, 0) >= (SELECT mostly_null_threshold FROM _audit_config LIMIT 1) THEN 'mostly_null'
      WHEN p.row_count > 0 AND p.blank_count IS NOT NULL AND p.blank_count::numeric / NULLIF(p.row_count, 0) >= (SELECT mostly_null_threshold FROM _audit_config LIMIT 1) THEN 'mostly_blank_text'
      WHEN p.row_count >= (SELECT min_rows_for_constant_column_candidate FROM _audit_config LIMIT 1)
        AND p.distinct_count = 1
        AND (p.row_count - COALESCE(p.null_count, 0)) > 0 THEN 'constant_non_null'
      ELSE NULL
    END AS candidate_reason
  FROM _audit_column_profile p
  LEFT JOIN pk_cols pk USING (table_schema, table_name, column_name)
  LEFT JOIN fk_cols fk USING (table_schema, table_name, column_name)
  LEFT JOIN unique_cols uq USING (table_schema, table_name, column_name)
)
SELECT
  table_schema,
  table_name,
  column_name,
  data_type,
  row_count,
  null_count,
  round(null_count::numeric / NULLIF(row_count, 0), 4) AS null_ratio,
  blank_count,
  round(blank_count::numeric / NULLIF(row_count, 0), 4) AS blank_ratio,
  distinct_count,
  exact_profile,
  candidate_reason,
  is_primary_key_column,
  is_foreign_key_column,
  is_unique_or_pk_column,
  column_default,
  CASE
    WHEN is_primary_key_column OR is_foreign_key_column OR is_unique_or_pk_column THEN 'do_not_drop_without_constraint_migration'
    WHEN column_default IS NOT NULL THEN 'review_default_and_writes_before_drop'
    WHEN candidate_reason = 'table_empty_column_unknown' THEN 'decide_at_table_level_first'
    ELSE 'candidate_for_app_usage_review'
  END AS safety_note
FROM enriched
WHERE candidate_reason IS NOT NULL
ORDER BY
  CASE candidate_reason
    WHEN 'all_null' THEN 1
    WHEN 'mostly_null' THEN 2
    WHEN 'mostly_blank_text' THEN 3
    WHEN 'constant_non_null' THEN 4
    ELSE 5
  END,
  table_name,
  column_name;

-- ============================================================
-- 3. Duplicate business data checks
-- ============================================================

DROP TABLE IF EXISTS pg_temp._audit_duplicate_groups;
CREATE TEMP TABLE _audit_duplicate_groups (
  check_name text NOT NULL,
  table_name text NOT NULL,
  duplicate_key text NOT NULL,
  duplicate_count bigint NOT NULL,
  sample_ids text[] NULL,
  action_hint text NOT NULL
);

DO $$
BEGIN
  IF to_regclass('public.categories') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO _audit_duplicate_groups
      SELECT 'categories_lower_slug', 'categories', lower(slug), count(*), (array_agg(id::text ORDER BY created_at DESC))[1:20], 'merge rows or add unique index on lower(slug)'
      FROM public.categories
      WHERE slug IS NOT NULL
      GROUP BY lower(slug)
      HAVING count(*) > 1;

      INSERT INTO _audit_duplicate_groups
      SELECT 'categories_lower_name', 'categories', lower(name), count(*), (array_agg(id::text ORDER BY created_at DESC))[1:20], 'merge or rename duplicated category names'
      FROM public.categories
      WHERE name IS NOT NULL
      GROUP BY lower(name)
      HAVING count(*) > 1;
    $sql$;
  END IF;

  IF to_regclass('public.regions') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO _audit_duplicate_groups
      SELECT 'regions_upper_code', 'regions', upper(code), count(*), (array_agg(id::text ORDER BY created_at DESC))[1:20], 'canonicalize region code casing and add case-insensitive uniqueness if needed'
      FROM public.regions
      WHERE code IS NOT NULL
      GROUP BY upper(code)
      HAVING count(*) > 1;

      INSERT INTO _audit_duplicate_groups
      SELECT 'regions_lower_name', 'regions', lower(name), count(*), (array_agg(id::text ORDER BY created_at DESC))[1:20], 'merge or rename duplicated region names'
      FROM public.regions
      WHERE name IS NOT NULL
      GROUP BY lower(name)
      HAVING count(*) > 1;
    $sql$;
  END IF;

  IF to_regclass('public.brands') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO _audit_duplicate_groups
      SELECT 'brands_lower_slug', 'brands', lower(slug), count(*), (array_agg(id::text ORDER BY created_at DESC))[1:20], 'merge brands or add unique index on lower(slug)'
      FROM public.brands
      WHERE slug IS NOT NULL
      GROUP BY lower(slug)
      HAVING count(*) > 1;

      INSERT INTO _audit_duplicate_groups
      SELECT 'brands_lower_name', 'brands', lower(name), count(*), (array_agg(id::text ORDER BY created_at DESC))[1:20], 'review same-name brands; merge only if they represent the same catalog brand'
      FROM public.brands
      WHERE name IS NOT NULL
      GROUP BY lower(name)
      HAVING count(*) > 1;
    $sql$;
  END IF;

  IF to_regclass('public.products') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO _audit_duplicate_groups
      SELECT 'products_brand_lower_name_type', 'products', brand_id::text || '|' || lower(name) || '|' || product_type, count(*), (array_agg(id::text ORDER BY created_at DESC))[1:20], 'merge duplicate products per brand/type or add unique index'
      FROM public.products
      WHERE name IS NOT NULL
      GROUP BY brand_id, lower(name), product_type
      HAVING count(*) > 1;
    $sql$;
  END IF;

  IF to_regclass('public.offers') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO _audit_duplicate_groups
      SELECT 'offers_same_sellable_variant', 'offers', brand_id::text || '|' || COALESCE(product_id::text, 'no_product') || '|' || region_code || '|' || denomination_value::text || '|' || denomination_currency, count(*), (array_agg(id::text ORDER BY created_at DESC))[1:20], 'review duplicate sellable variants; consolidate inventory/order references before deleting'
      FROM public.offers
      GROUP BY brand_id, COALESCE(product_id::text, 'no_product'), region_code, denomination_value, denomination_currency
      HAVING count(*) > 1;

      INSERT INTO _audit_duplicate_groups
      SELECT 'offers_exact_commercial_duplicate', 'offers', brand_id::text || '|' || COALESCE(product_id::text, 'no_product') || '|' || region_code || '|' || denomination_value::text || '|' || denomination_currency || '|' || price::text || '|' || cost_price::text || '|' || status, count(*), (array_agg(id::text ORDER BY created_at DESC))[1:20], 'exact commercial duplicates; choose canonical offer and repoint dependent rows'
      FROM public.offers
      GROUP BY brand_id, COALESCE(product_id::text, 'no_product'), region_code, denomination_value, denomination_currency, price, cost_price, status
      HAVING count(*) > 1;
    $sql$;
  END IF;

  IF to_regclass('public.customers') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO _audit_duplicate_groups
      SELECT 'customers_lower_email', 'customers', lower(email), count(*), (array_agg(id::text ORDER BY updated_at DESC NULLS LAST, created_at DESC))[1:20], 'merge customer identities after validating orders/auth links'
      FROM public.customers
      WHERE email IS NOT NULL AND btrim(email) <> ''
      GROUP BY lower(email)
      HAVING count(*) > 1;

      INSERT INTO _audit_duplicate_groups
      SELECT 'customers_whatsapp_display_digits', 'customers', regexp_replace(COALESCE(whatsapp_display, ''), '[^0-9]', '', 'g'), count(*), (array_agg(id::text ORDER BY updated_at DESC NULLS LAST, created_at DESC))[1:20], 'normalize phone numbers into whatsapp_e164 and merge duplicate customers'
      FROM public.customers
      WHERE whatsapp_display IS NOT NULL AND regexp_replace(whatsapp_display, '[^0-9]', '', 'g') <> ''
      GROUP BY regexp_replace(COALESCE(whatsapp_display, ''), '[^0-9]', '', 'g')
      HAVING count(*) > 1;
    $sql$;
  END IF;

  IF to_regclass('public.payment_methods') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO _audit_duplicate_groups
      SELECT 'payment_methods_lower_name_type', 'payment_methods', lower(name) || '|' || type, count(*), (array_agg(id::text ORDER BY sort_order, created_at))[1:20], 'merge duplicated payment methods and update orders/payment snapshots policy'
      FROM public.payment_methods
      WHERE name IS NOT NULL
      GROUP BY lower(name), type
      HAVING count(*) > 1;
    $sql$;
  END IF;

  IF to_regclass('public.orders') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO _audit_duplicate_groups
      SELECT 'orders_same_customer_amount_minute', 'orders', COALESCE(customer_whatsapp, '') || '|' || COALESCE(customer_email, '') || '|' || total_amount::text || '|' || date_trunc('minute', created_at)::text, count(*), (array_agg(id::text ORDER BY created_at DESC))[1:20], 'possible double-submit orders; compare order_items before merging/canceling'
      FROM public.orders
      GROUP BY COALESCE(customer_whatsapp, ''), COALESCE(customer_email, ''), total_amount, date_trunc('minute', created_at)
      HAVING count(*) > 1;
    $sql$;
  END IF;

  IF to_regclass('public.order_items') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO _audit_duplicate_groups
      SELECT 'order_items_same_order_offer', 'order_items', order_id::text || '|' || offer_id::text, count(*), (array_agg(id::text ORDER BY id::text))[1:20], 'same offer repeated in one order; aggregate quantities if the business expects one line per offer'
      FROM public.order_items
      GROUP BY order_id, offer_id
      HAVING count(*) > 1;
    $sql$;
  END IF;

  IF to_regclass('public.digital_codes') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO _audit_duplicate_groups
      SELECT 'digital_codes_offer_code_content', 'digital_codes', offer_id::text || '|' || code_content, count(*), (array_agg(id::text ORDER BY created_at DESC))[1:20], 'dangerous duplicate inventory code for the same offer; revoke or merge before selling'
      FROM public.digital_codes
      WHERE code_content IS NOT NULL
      GROUP BY offer_id, code_content
      HAVING count(*) > 1;

      INSERT INTO _audit_duplicate_groups
      SELECT 'digital_codes_global_code_content', 'digital_codes', code_content, count(*), (array_agg(id::text ORDER BY created_at DESC))[1:20], 'same code exists across offers; verify whether codes are provider-global or offer-scoped'
      FROM public.digital_codes
      WHERE code_content IS NOT NULL
      GROUP BY code_content
      HAVING count(*) > 1;
    $sql$;
  END IF;

  IF to_regclass('public.trust_points') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO _audit_duplicate_groups
      SELECT 'trust_points_lower_title', 'trust_points', lower(title), count(*), (array_agg(id::text ORDER BY sort_order, created_at))[1:20], 'remove duplicated homepage trust point'
      FROM public.trust_points
      WHERE title IS NOT NULL
      GROUP BY lower(title)
      HAVING count(*) > 1;
    $sql$;
  END IF;

  IF to_regclass('public.faqs') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO _audit_duplicate_groups
      SELECT 'faqs_lower_question', 'faqs', lower(question), count(*), (array_agg(id::text ORDER BY sort_order, created_at))[1:20], 'remove duplicated FAQ or consolidate answers'
      FROM public.faqs
      WHERE question IS NOT NULL
      GROUP BY lower(question)
      HAVING count(*) > 1;
    $sql$;
  END IF;

  IF to_regclass('public.provinces') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO _audit_duplicate_groups
      SELECT 'provinces_region_lower_name', 'provinces', region_code || '|' || lower(name), count(*), (array_agg(id::text ORDER BY sort_order, created_at))[1:20], 'case-insensitive province duplicate; merge after repointing cities'
      FROM public.provinces
      WHERE name IS NOT NULL
      GROUP BY region_code, lower(name)
      HAVING count(*) > 1;
    $sql$;
  END IF;

  IF to_regclass('public.cities') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO _audit_duplicate_groups
      SELECT 'cities_province_lower_name', 'cities', province_id::text || '|' || lower(name), count(*), (array_agg(id::text ORDER BY sort_order, created_at))[1:20], 'case-insensitive city duplicate; merge if same place'
      FROM public.cities
      WHERE name IS NOT NULL
      GROUP BY province_id, lower(name)
      HAVING count(*) > 1;
    $sql$;
  END IF;
END $$;

-- ============================================================
-- 4. Integrity and modeling findings
-- ============================================================

DROP TABLE IF EXISTS pg_temp._audit_findings;
CREATE TEMP TABLE _audit_findings (
  severity text NOT NULL,
  category text NOT NULL,
  object_name text NOT NULL,
  finding text NOT NULL,
  affected_rows bigint NULL,
  sample text NULL,
  remediation_hint text NOT NULL
);

-- Generic FK orphan checks. These should be zero when constraints are valid.
DO $$
DECLARE
  v_fk record;
  v_count bigint;
BEGIN
  FOR v_fk IN
    WITH fk_cols AS (
      SELECT
        con.oid,
        con.conname,
        con.conrelid,
        con.confrelid,
        u.ord,
        child_att.attname AS child_col,
        parent_att.attname AS parent_col
      FROM pg_constraint con
      JOIN pg_namespace child_ns ON child_ns.oid = (SELECT relnamespace FROM pg_class WHERE oid = con.conrelid)
      JOIN _audit_config cfg ON cfg.schema_name = child_ns.nspname
      CROSS JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS u(attnum, ord)
      JOIN pg_attribute child_att
        ON child_att.attrelid = con.conrelid
       AND child_att.attnum = u.attnum
      JOIN pg_attribute parent_att
        ON parent_att.attrelid = con.confrelid
       AND parent_att.attnum = con.confkey[u.ord::integer]
      WHERE con.contype = 'f'
    )
    SELECT
      oid,
      conname,
      conrelid::regclass::text AS child_table,
      confrelid::regclass::text AS parent_table,
      string_agg(format('c.%I = p.%I', child_col, parent_col), ' AND ' ORDER BY ord) AS join_condition,
      string_agg(format('c.%I IS NOT NULL', child_col), ' AND ' ORDER BY ord) AS child_not_null_condition,
      (array_agg(format('p.%I', parent_col) ORDER BY ord))[1] AS parent_probe_expr
    FROM fk_cols
    GROUP BY oid, conname, conrelid, confrelid
  LOOP
    EXECUTE format(
      'SELECT count(*)::bigint FROM %s c LEFT JOIN %s p ON %s WHERE %s AND %s IS NULL',
      v_fk.child_table,
      v_fk.parent_table,
      v_fk.join_condition,
      v_fk.child_not_null_condition,
      v_fk.parent_probe_expr
    ) INTO v_count;

    IF v_count > 0 THEN
      INSERT INTO _audit_findings
      VALUES (
        'critical',
        'referential_integrity',
        v_fk.conname,
        format('FK orphan rows from %s to %s', v_fk.child_table, v_fk.parent_table),
        v_count,
        NULL,
        'Fix parent/child data before enabling or trusting cleanup. Do not delete parent rows until this is zero.'
      );
    END IF;
  END LOOP;
END $$;

DO $$
BEGIN
  IF to_regclass('public.order_items') IS NOT NULL THEN
    EXECUTE $sql$
      WITH bad AS (
        SELECT id
        FROM public.order_items
        WHERE total IS DISTINCT FROM (qty * unit_price)
      )
      INSERT INTO _audit_findings
      SELECT 'high', 'derived_data_drift', 'order_items.total', 'order_items.total differs from qty * unit_price', count(*)::bigint, (array_agg(id::text))[1], 'Recalculate line totals or add a CHECK/trigger; review before financial reports.'
      FROM bad
      HAVING count(*) > 0;
    $sql$;
  END IF;

  IF to_regclass('public.orders') IS NOT NULL AND to_regclass('public.order_items') IS NOT NULL THEN
    EXECUTE $sql$
      WITH totals AS (
        SELECT o.id, o.total_amount, COALESCE(sum(oi.total), 0) AS item_total
        FROM public.orders o
        LEFT JOIN public.order_items oi ON oi.order_id = o.id
        GROUP BY o.id, o.total_amount
      ), bad AS (
        SELECT id
        FROM totals
        WHERE abs(COALESCE(total_amount, 0) - COALESCE(item_total, 0)) > 0.01
      )
      INSERT INTO _audit_findings
      SELECT 'high', 'derived_data_drift', 'orders.total_amount', 'orders.total_amount differs from sum(order_items.total)', count(*)::bigint, (array_agg(id::text))[1], 'Reconcile order totals before cleanup, refunds, or accounting exports.'
      FROM bad
      HAVING count(*) > 0;

      WITH bad AS (
        SELECT o.id
        FROM public.orders o
        LEFT JOIN public.order_items oi ON oi.order_id = o.id
        GROUP BY o.id
        HAVING count(oi.id) = 0
      )
      INSERT INTO _audit_findings
      SELECT 'medium', 'data_quality', 'orders_without_items', 'orders exist without line items', count(*)::bigint, (array_agg(id::text))[1], 'Validate whether these are abandoned/test orders; archive before deleting.'
      FROM bad
      HAVING count(*) > 0;
    $sql$;
  END IF;

  IF to_regclass('public.customers') IS NOT NULL AND to_regclass('public.orders') IS NOT NULL THEN
    EXECUTE $sql$
      WITH expected AS (
        SELECT
          c.id,
          c.orders_count,
          c.delivered_orders_count,
          c.delivered_total,
          c.first_order_at,
          c.last_order_at,
          count(o.id)::integer AS expected_orders_count,
          count(o.id) FILTER (WHERE o.status = 'delivered')::integer AS expected_delivered_orders_count,
          COALESCE(sum(o.total_amount) FILTER (WHERE o.status = 'delivered'), 0) AS expected_delivered_total,
          min(o.created_at) AS expected_first_order_at,
          max(o.created_at) AS expected_last_order_at
        FROM public.customers c
        LEFT JOIN public.orders o ON o.customer_id = c.id
        GROUP BY c.id
      ), bad AS (
        SELECT id
        FROM expected
        WHERE orders_count IS DISTINCT FROM expected_orders_count
           OR delivered_orders_count IS DISTINCT FROM expected_delivered_orders_count
           OR abs(COALESCE(delivered_total, 0) - COALESCE(expected_delivered_total, 0)) > 0.01
           OR first_order_at IS DISTINCT FROM expected_first_order_at
           OR last_order_at IS DISTINCT FROM expected_last_order_at
      )
      INSERT INTO _audit_findings
      SELECT 'medium', 'derived_data_drift', 'customers.order_stats', 'customer aggregate columns drift from orders', count(*)::bigint, (array_agg(id::text))[1], 'Run a stats reconciliation update after validating triggers.'
      FROM bad
      HAVING count(*) > 0;
    $sql$;
  END IF;

  IF to_regclass('public.offers') IS NOT NULL AND to_regclass('public.digital_codes') IS NOT NULL THEN
    EXECUTE $sql$
      WITH expected AS (
        SELECT
          o.id,
          o.stock_quantity,
          count(dc.id) FILTER (WHERE dc.status = 'available')::integer AS available_codes
        FROM public.offers o
        LEFT JOIN public.digital_codes dc ON dc.offer_id = o.id
        GROUP BY o.id, o.stock_quantity
      ), bad AS (
        SELECT id
        FROM expected
        WHERE stock_quantity IS DISTINCT FROM available_codes
      )
      INSERT INTO _audit_findings
      SELECT 'high', 'derived_data_drift', 'offers.stock_quantity', 'offer stock_quantity differs from available digital_codes', count(*)::bigint, (array_agg(id::text))[1], 'Re-run stock sync before selling or deleting codes.'
      FROM bad
      HAVING count(*) > 0;
    $sql$;
  END IF;

  IF to_regclass('public.digital_codes') IS NOT NULL THEN
    EXECUTE $sql$
      WITH bad AS (
        SELECT id
        FROM public.digital_codes
        WHERE (status = 'available' AND (order_id IS NOT NULL OR assigned_at IS NOT NULL))
           OR (status = 'sold' AND (order_id IS NULL OR assigned_at IS NULL))
      )
      INSERT INTO _audit_findings
      SELECT 'high', 'state_consistency', 'digital_codes.status', 'digital code status conflicts with order assignment fields', count(*)::bigint, (array_agg(id::text))[1], 'Fix state before deleting/revoking inventory; sold codes should have order_id and assigned_at.'
      FROM bad
      HAVING count(*) > 0;
    $sql$;
  END IF;

  IF to_regclass('public.orders') IS NOT NULL AND to_regclass('public.order_status_history') IS NOT NULL THEN
    EXECUTE $sql$
      WITH latest AS (
        SELECT DISTINCT ON (order_id) order_id, to_status
        FROM public.order_status_history
        ORDER BY order_id, created_at DESC
      ), bad AS (
        SELECT o.id
        FROM public.orders o
        JOIN latest l ON l.order_id = o.id
        WHERE l.to_status IS DISTINCT FROM o.status
      )
      INSERT INTO _audit_findings
      SELECT 'medium', 'audit_trail_drift', 'order_status_history', 'latest order_status_history.to_status differs from orders.status', count(*)::bigint, (array_agg(id::text))[1], 'Backfill status history or fix the order row; cleanup should preserve audit trail.'
      FROM bad
      HAVING count(*) > 0;

      WITH bad AS (
        SELECT o.id
        FROM public.orders o
        LEFT JOIN public.order_status_history h ON h.order_id = o.id
        WHERE o.status <> 'new'
        GROUP BY o.id
        HAVING count(h.id) = 0
      )
      INSERT INTO _audit_findings
      SELECT 'low', 'audit_trail_gap', 'order_status_history', 'non-new orders without status history', count(*)::bigint, (array_agg(id::text))[1], 'Backfill a status history row if auditability matters.'
      FROM bad
      HAVING count(*) > 0;
    $sql$;
  END IF;

  IF to_regclass('public.orders') IS NOT NULL AND to_regclass('public.order_deliveries') IS NOT NULL THEN
    EXECUTE $sql$
      WITH bad AS (
        SELECT o.id
        FROM public.orders o
        LEFT JOIN public.order_deliveries d ON d.order_id = o.id
        WHERE o.status = 'delivered'
          AND d.id IS NULL
          AND COALESCE(btrim(o.delivery_codes), '') = ''
      )
      INSERT INTO _audit_findings
      SELECT 'medium', 'fulfillment_gap', 'delivered_orders_without_delivery_record', 'delivered order has no order_deliveries row and no delivery_codes', count(*)::bigint, (array_agg(id::text))[1], 'Verify manual delivery history before archiving or modifying orders.'
      FROM bad
      HAVING count(*) > 0;
    $sql$;
  END IF;

  IF to_regclass('public.products') IS NOT NULL AND to_regclass('public.offers') IS NOT NULL THEN
    EXECUTE $sql$
      WITH bad AS (
        SELECT p.id
        FROM public.products p
        LEFT JOIN public.offers o ON o.product_id = p.id
        WHERE p.status = 'active'
        GROUP BY p.id
        HAVING count(o.id) = 0
      )
      INSERT INTO _audit_findings
      SELECT 'low', 'catalog_modeling', 'products_without_offers', 'active products have no offers', count(*)::bigint, (array_agg(id::text))[1], 'Deactivate or attach offers; do not delete if product history is needed.'
      FROM bad
      HAVING count(*) > 0;
    $sql$;
  END IF;

  IF to_regclass('public.brands') IS NOT NULL AND to_regclass('public.offers') IS NOT NULL THEN
    EXECUTE $sql$
      WITH bad AS (
        SELECT b.id
        FROM public.brands b
        LEFT JOIN public.offers o ON o.brand_id = b.id AND o.status = 'active'
        WHERE b.status = 'active'
        GROUP BY b.id
        HAVING count(o.id) = 0
      )
      INSERT INTO _audit_findings
      SELECT 'low', 'catalog_modeling', 'active_brands_without_active_offers', 'active brands have no active offers', count(*)::bigint, (array_agg(id::text))[1], 'Deactivate empty brands or add offers; check homepage references first.'
      FROM bad
      HAVING count(*) > 0;
    $sql$;
  END IF;

  IF to_regclass('public.home_featured_brands') IS NOT NULL AND to_regclass('public.brands') IS NOT NULL THEN
    EXECUTE $sql$
      WITH bad AS (
        SELECT h.brand_slug
        FROM public.home_featured_brands h
        JOIN public.brands b ON b.slug = h.brand_slug
        WHERE b.status <> 'active'
      )
      INSERT INTO _audit_findings
      SELECT 'medium', 'content_integrity', 'home_featured_brands', 'featured brand is not active', count(*)::bigint, (array_agg(brand_slug))[1], 'Remove from featured list or reactivate brand.'
      FROM bad
      HAVING count(*) > 0;
    $sql$;
  END IF;

  IF to_regclass('public.analytics_events') IS NOT NULL AND to_regclass('public.offers') IS NOT NULL THEN
    EXECUTE $sql$
      WITH bad AS (
        SELECT a.id
        FROM public.analytics_events a
        LEFT JOIN public.offers o ON o.id = a.offer_id
        WHERE a.offer_id IS NOT NULL AND o.id IS NULL
      )
      INSERT INTO _audit_findings
      SELECT 'low', 'analytics_integrity', 'analytics_events.offer_id', 'analytics event references missing offer_id without FK protection', count(*)::bigint, (array_agg(id::text))[1], 'Either allow historical orphan analytics intentionally or add FK/cleanup old events.'
      FROM bad
      HAVING count(*) > 0;
    $sql$;
  END IF;

  IF to_regclass('public.analytics_events') IS NOT NULL AND to_regclass('public.orders') IS NOT NULL THEN
    EXECUTE $sql$
      WITH bad AS (
        SELECT a.id
        FROM public.analytics_events a
        LEFT JOIN public.orders o ON o.id = a.order_id
        WHERE a.order_id IS NOT NULL AND o.id IS NULL
      )
      INSERT INTO _audit_findings
      SELECT 'low', 'analytics_integrity', 'analytics_events.order_id', 'analytics event references missing order_id without FK protection', count(*)::bigint, (array_agg(id::text))[1], 'Either allow historical orphan analytics intentionally or add FK/cleanup old events.'
      FROM bad
      HAVING count(*) > 0;
    $sql$;
  END IF;
END $$;

INSERT INTO _audit_findings
SELECT
  'low',
  'modeling_overlap',
  'audit_logs/admin_audit_log',
  'two audit tables exist with overlapping purpose',
  (SELECT COALESCE(sum(row_count), 0) FROM _audit_table_counts WHERE table_name IN ('audit_logs', 'admin_audit_log')),
  NULL,
  'Choose one canonical audit table; archive the other only after confirming application writes.'
WHERE EXISTS (SELECT 1 FROM _audit_table_counts WHERE table_name = 'audit_logs')
  AND EXISTS (SELECT 1 FROM _audit_table_counts WHERE table_name = 'admin_audit_log');

-- FK-like columns without FK constraints.
DROP TABLE IF EXISTS pg_temp._audit_fk_like_columns_without_fk;
CREATE TEMP TABLE _audit_fk_like_columns_without_fk AS
WITH fk_cols AS (
  SELECT ns.nspname AS table_schema, cls.relname AS table_name, att.attname AS column_name
  FROM pg_constraint con
  JOIN pg_class cls ON cls.oid = con.conrelid
  JOIN pg_namespace ns ON ns.oid = cls.relnamespace
  JOIN unnest(con.conkey) AS k(attnum) ON true
  JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = k.attnum
  WHERE con.contype = 'f'
), pk_cols AS (
  SELECT ns.nspname AS table_schema, cls.relname AS table_name, att.attname AS column_name
  FROM pg_constraint con
  JOIN pg_class cls ON cls.oid = con.conrelid
  JOIN pg_namespace ns ON ns.oid = cls.relnamespace
  JOIN unnest(con.conkey) AS k(attnum) ON true
  JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = k.attnum
  WHERE con.contype = 'p'
)
SELECT
  c.table_schema,
  c.table_name,
  c.column_name,
  c.data_type,
  'Column name looks relational but no FK constraint exists. Review whether this should be enforced or intentionally loose historical data.' AS finding
FROM information_schema.columns c
JOIN _audit_config cfg ON cfg.schema_name = c.table_schema
LEFT JOIN fk_cols fk USING (table_schema, table_name, column_name)
LEFT JOIN pk_cols pk USING (table_schema, table_name, column_name)
WHERE c.table_name IN (SELECT table_name FROM _audit_table_counts)
  AND fk.column_name IS NULL
  AND pk.column_name IS NULL
  AND (
    c.column_name ~ '(_id|_code|_slug)$'
    OR c.column_name IN ('changed_by', 'admin_user_id', 'auth_user_id')
  )
ORDER BY c.table_name, c.ordinal_position;

-- Missing indexes on child-side FK columns.
DROP TABLE IF EXISTS pg_temp._audit_missing_fk_indexes;
CREATE TEMP TABLE _audit_missing_fk_indexes AS
WITH fk AS (
  SELECT
    con.oid,
    con.conname,
    con.conrelid,
    con.confrelid,
    con.conkey,
    child_ns.nspname AS table_schema,
    child_cls.relname AS table_name,
    array_agg(child_att.attname ORDER BY u.ord) AS fk_columns
  FROM pg_constraint con
  JOIN pg_class child_cls ON child_cls.oid = con.conrelid
  JOIN pg_namespace child_ns ON child_ns.oid = child_cls.relnamespace
  JOIN _audit_config cfg ON cfg.schema_name = child_ns.nspname
  CROSS JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS u(attnum, ord)
  JOIN pg_attribute child_att ON child_att.attrelid = con.conrelid AND child_att.attnum = u.attnum
  WHERE con.contype = 'f'
  GROUP BY con.oid, con.conname, con.conrelid, con.confrelid, con.conkey, child_ns.nspname, child_cls.relname
), idx AS (
  SELECT
    i.indrelid,
    i.indexrelid,
    array_agg(k.attnum ORDER BY k.ord) FILTER (WHERE k.attnum > 0) AS index_columns
  FROM pg_index i
  CROSS JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord)
  WHERE i.indisvalid
    AND i.indisready
  GROUP BY i.indrelid, i.indexrelid
)
SELECT
  fk.table_schema,
  fk.table_name,
  fk.conname AS fk_name,
  fk.fk_columns,
  format(
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS %I ON %I.%I (%s);',
    fk.table_name || '_' || array_to_string(fk.fk_columns, '_') || '_fk_idx',
    fk.table_schema,
    fk.table_name,
    (SELECT string_agg(format('%I', col), ', ') FROM unnest(fk.fk_columns) AS col)
  ) AS suggested_sql
FROM fk
WHERE NOT EXISTS (
  SELECT 1
  FROM idx
  WHERE idx.indrelid = fk.conrelid
    AND idx.index_columns[1:cardinality(fk.conkey)] = fk.conkey
)
ORDER BY fk.table_name, fk.conname;

DROP TABLE IF EXISTS pg_temp._audit_rls_policy_gaps;
CREATE TEMP TABLE _audit_rls_policy_gaps AS
SELECT
  table_schema,
  table_name,
  rls_enabled,
  policy_count,
  CASE
    WHEN rls_enabled AND policy_count = 0 THEN 'rls_enabled_without_policies'
    WHEN NOT rls_enabled THEN 'rls_disabled'
  END AS finding,
  CASE
    WHEN table_name IN ('customers', 'customer_preferences') THEN 'customer data should have explicit RLS policies'
    WHEN table_name IN ('admin_audit_log', 'audit_logs') THEN 'admin/audit data should not be readable from anon/authenticated clients'
    ELSE 'confirm access path is server-only or add explicit policies'
  END AS remediation_hint
FROM _audit_table_inventory
WHERE (rls_enabled AND policy_count = 0)
   OR NOT rls_enabled
ORDER BY table_name;

-- ============================================================
-- 5. SQL-generated safe cleanup plan
-- ============================================================

DROP TABLE IF EXISTS pg_temp._audit_cleanup_plan;
CREATE TEMP TABLE _audit_cleanup_plan AS
SELECT
  10 AS step_order,
  'backup' AS phase,
  'full_database' AS target,
  'Take a physical/logical backup before data cleanup.' AS action,
  'supabase db dump --linked > backup_before_cleanup.sql' AS sql_or_command,
  'Run outside this transaction.' AS safety_gate
UNION ALL
SELECT
  15,
  'prepare_archive',
  'cleanup_archive',
  'Create archive schema for approved cleanup snapshots.',
  'CREATE SCHEMA IF NOT EXISTS cleanup_archive;',
  'Run once before archive table commands.'
UNION ALL
SELECT
  20,
  'archive_candidates',
  table_schema || '.' || table_name,
  'Archive candidate table before any drop/delete.',
  format('CREATE TABLE cleanup_archive.%I AS TABLE %I.%I WITH DATA;', table_name || '_' || to_char(current_date, 'YYYYMMDD'), table_schema, table_name),
  'Only after app usage review and row_count/relationships are understood.'
FROM _audit_table_candidates
WHERE cleanup_candidate_level IN ('medium', 'low')
UNION ALL
SELECT
  30,
  'deduplicate_review',
  table_name || ':' || check_name,
  'Review duplicate group and choose canonical rows.',
  'SELECT * FROM _audit_duplicate_groups WHERE check_name = ' || quote_literal(check_name) || ';',
  'Do not delete until dependent FKs are repointed and archive is created.'
FROM _audit_duplicate_groups
UNION ALL
SELECT
  40,
  'column_review',
  table_schema || '.' || table_name || '.' || column_name,
  'Review candidate column before dropping.',
  format('SELECT count(*) AS non_null_count FROM %I.%I WHERE %I IS NOT NULL;', table_schema, table_name, column_name),
  safety_note
FROM _audit_column_candidates
WHERE candidate_reason IN ('all_null', 'mostly_null', 'mostly_blank_text', 'constant_non_null')
  AND safety_note = 'candidate_for_app_usage_review'
UNION ALL
SELECT
  50,
  'fix_integrity_first',
  object_name,
  finding,
  'SELECT * FROM _audit_findings WHERE object_name = ' || quote_literal(object_name) || ';',
  remediation_hint
FROM _audit_findings
WHERE severity IN ('critical', 'high', 'medium')
UNION ALL
SELECT
  60,
  'add_missing_fk_indexes',
  table_schema || '.' || table_name || ':' || fk_name,
  'Add child-side FK index if write/delete performance matters.',
  suggested_sql,
  'CREATE INDEX CONCURRENTLY cannot run inside a transaction block; run separately.'
FROM _audit_missing_fk_indexes;

-- ============================================================
-- Report output. If your SQL client shows only the last result,
-- run each SELECT below separately after executing the setup above.
-- ============================================================

SELECT '01_table_inventory' AS report, *
FROM _audit_table_inventory
ORDER BY total_bytes DESC, table_name;

SELECT '02_candidate_unused_tables' AS report, *
FROM _audit_table_candidates
ORDER BY
  CASE cleanup_candidate_level WHEN 'medium' THEN 1 WHEN 'low' THEN 2 ELSE 3 END,
  row_count,
  table_name;

SELECT '03_candidate_unused_columns' AS report, *
FROM _audit_column_candidates
ORDER BY
  CASE candidate_reason
    WHEN 'all_null' THEN 1
    WHEN 'mostly_null' THEN 2
    WHEN 'mostly_blank_text' THEN 3
    WHEN 'constant_non_null' THEN 4
    ELSE 5
  END,
  table_name,
  column_name;

SELECT '04_duplicate_groups' AS report, *
FROM _audit_duplicate_groups
ORDER BY duplicate_count DESC, table_name, check_name;

SELECT '05_integrity_and_modeling_findings' AS report, *
FROM _audit_findings
ORDER BY
  CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END,
  category,
  object_name;

SELECT '06_fk_like_columns_without_fk' AS report, *
FROM _audit_fk_like_columns_without_fk;

SELECT '07_missing_fk_indexes' AS report, *
FROM _audit_missing_fk_indexes;

SELECT '08_rls_policy_gaps' AS report, *
FROM _audit_rls_policy_gaps;

SELECT '09_cleanup_plan' AS report, *
FROM _audit_cleanup_plan
ORDER BY step_order, target;

COMMIT;
