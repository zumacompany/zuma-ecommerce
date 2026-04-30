-- ============================================================
-- Zuma - Schema overview audit
-- ============================================================
-- Purpose:
--   - List all application tables/views/sequences in the selected schemas.
--   - List columns, keys, FKs, indexes, RLS policies, triggers and functions.
--   - Generate a Mermaid ER diagram from the live database catalog.
--
-- Safety:
--   - Read-only for application data.
--   - Creates only temporary tables in the current session.
--   - Exact row counts are bounded by max_exact_count_bytes.
--
-- How to use:
--   - Run in Supabase SQL Editor.
--   - If the SQL client only displays the last result, run the final SELECTs
--     one by one after executing the setup section.
--   - Copy the value from report 09_mermaid_er_diagram into a Markdown file.
-- ============================================================

BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '10min';

DROP TABLE IF EXISTS pg_temp._schema_config;
CREATE TEMP TABLE _schema_config AS
SELECT
  ARRAY['public']::text[] AS included_schemas,
  true::boolean AS exact_row_counts,
  200000000::bigint AS max_exact_count_bytes;

DROP TABLE IF EXISTS pg_temp._schema_objects;
CREATE TEMP TABLE _schema_objects AS
SELECT
  n.nspname AS table_schema,
  c.relname AS object_name,
  c.oid AS relid,
  c.relkind,
  CASE c.relkind
    WHEN 'r' THEN 'table'
    WHEN 'p' THEN 'partitioned_table'
    WHEN 'v' THEN 'view'
    WHEN 'm' THEN 'materialized_view'
    WHEN 'S' THEN 'sequence'
    ELSE c.relkind::text
  END AS object_type,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  c.reltuples::bigint AS planner_rows,
  pg_total_relation_size(c.oid) AS total_bytes,
  pg_relation_size(c.oid) AS table_bytes,
  pg_indexes_size(c.oid) AS index_bytes,
  obj_description(c.oid, 'pg_class') AS object_comment
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE EXISTS (
    SELECT 1
    FROM _schema_config cfg
    WHERE n.nspname::text = ANY (cfg.included_schemas)
  )
  AND c.relkind IN ('r', 'p', 'v', 'm', 'S')
  AND c.relpersistence = 'p'
ORDER BY n.nspname, c.relname;

DROP TABLE IF EXISTS pg_temp._schema_row_counts;
CREATE TEMP TABLE _schema_row_counts (
  table_schema name NOT NULL,
  table_name name NOT NULL,
  row_count bigint NULL,
  row_count_source text NOT NULL,
  PRIMARY KEY (table_schema, table_name)
);

INSERT INTO _schema_row_counts(table_schema, table_name, row_count, row_count_source)
SELECT
  table_schema,
  object_name,
  CASE WHEN planner_rows < 0 THEN NULL ELSE planner_rows END,
  'planner_estimate'
FROM _schema_objects
WHERE relkind IN ('r', 'p', 'm');

DO $$
DECLARE
  r record;
  v_count bigint;
BEGIN
  IF NOT (SELECT exact_row_counts FROM _schema_config LIMIT 1) THEN
    RETURN;
  END IF;

  FOR r IN
    SELECT table_schema, object_name, total_bytes
    FROM _schema_objects
    WHERE relkind IN ('r', 'p')
      AND total_bytes <= (SELECT max_exact_count_bytes FROM _schema_config LIMIT 1)
    ORDER BY table_schema, object_name
  LOOP
    EXECUTE format('SELECT count(*)::bigint FROM %I.%I', r.table_schema, r.object_name)
      INTO v_count;

    UPDATE _schema_row_counts
    SET row_count = v_count,
        row_count_source = 'exact_count'
    WHERE table_schema = r.table_schema
      AND table_name = r.object_name;
  END LOOP;
END $$;

DROP TABLE IF EXISTS pg_temp._schema_constraints;
CREATE TEMP TABLE _schema_constraints AS
SELECT
  child_ns.nspname AS table_schema,
  child_cls.relname AS table_name,
  con.conname AS constraint_name,
  con.contype AS constraint_type_code,
  CASE con.contype
    WHEN 'p' THEN 'primary_key'
    WHEN 'f' THEN 'foreign_key'
    WHEN 'u' THEN 'unique'
    WHEN 'c' THEN 'check'
    WHEN 'x' THEN 'exclusion'
    ELSE con.contype::text
  END AS constraint_type,
  pg_get_constraintdef(con.oid, true) AS constraint_definition,
  parent_ns.nspname AS referenced_schema,
  parent_cls.relname AS referenced_table,
  CASE con.confdeltype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
    ELSE NULL
  END AS on_delete,
  CASE con.confupdtype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
    ELSE NULL
  END AS on_update,
  con.conkey,
  con.confkey,
  con.oid AS constraint_oid
FROM pg_constraint con
JOIN pg_class child_cls ON child_cls.oid = con.conrelid
JOIN pg_namespace child_ns ON child_ns.oid = child_cls.relnamespace
LEFT JOIN pg_class parent_cls ON parent_cls.oid = con.confrelid
LEFT JOIN pg_namespace parent_ns ON parent_ns.oid = parent_cls.relnamespace
WHERE EXISTS (
    SELECT 1
    FROM _schema_config cfg
    WHERE child_ns.nspname::text = ANY (cfg.included_schemas)
  );

DROP TABLE IF EXISTS pg_temp._schema_column_flags;
CREATE TEMP TABLE _schema_column_flags AS
WITH constraint_cols AS (
  SELECT
    c.table_schema,
    c.table_name,
    c.constraint_name,
    c.constraint_type,
    u.ord,
    child_att.attname AS column_name
  FROM _schema_constraints c
  JOIN pg_class child_cls
    ON child_cls.relname = c.table_name
  JOIN pg_namespace child_ns
    ON child_ns.oid = child_cls.relnamespace
   AND child_ns.nspname = c.table_schema
  CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS u(attnum, ord)
  JOIN pg_attribute child_att
    ON child_att.attrelid = child_cls.oid
   AND child_att.attnum = u.attnum
  WHERE c.conkey IS NOT NULL
)
SELECT
  table_schema,
  table_name,
  column_name,
  bool_or(constraint_type = 'primary_key') AS is_primary_key,
  bool_or(constraint_type = 'foreign_key') AS is_foreign_key,
  bool_or(constraint_type = 'unique') AS is_unique,
  array_agg(constraint_name ORDER BY constraint_name) FILTER (WHERE constraint_name IS NOT NULL) AS constraints
FROM constraint_cols
GROUP BY table_schema, table_name, column_name;

DROP TABLE IF EXISTS pg_temp._schema_columns;
CREATE TEMP TABLE _schema_columns AS
SELECT
  ns.nspname AS table_schema,
  cls.relname AS table_name,
  att.attnum AS ordinal_position,
  att.attname AS column_name,
  format_type(att.atttypid, att.atttypmod) AS data_type,
  NOT att.attnotnull AS is_nullable,
  pg_get_expr(def.adbin, def.adrelid) AS column_default,
  COALESCE(flags.is_primary_key, false) AS is_primary_key,
  COALESCE(flags.is_foreign_key, false) AS is_foreign_key,
  COALESCE(flags.is_unique, false) AS is_unique,
  flags.constraints,
  col_description(att.attrelid, att.attnum) AS column_comment
FROM pg_attribute att
JOIN pg_class cls ON cls.oid = att.attrelid
JOIN pg_namespace ns ON ns.oid = cls.relnamespace
JOIN _schema_objects obj ON obj.relid = cls.oid
LEFT JOIN pg_attrdef def
  ON def.adrelid = att.attrelid
 AND def.adnum = att.attnum
LEFT JOIN _schema_column_flags flags
  ON flags.table_schema = ns.nspname
 AND flags.table_name = cls.relname
 AND flags.column_name = att.attname
WHERE att.attnum > 0
  AND NOT att.attisdropped
  AND cls.relkind IN ('r', 'p', 'v', 'm')
ORDER BY ns.nspname, cls.relname, att.attnum;

DROP TABLE IF EXISTS pg_temp._schema_relationships;
CREATE TEMP TABLE _schema_relationships AS
WITH fk_cols AS (
  SELECT
    c.constraint_name,
    c.table_schema AS child_schema,
    c.table_name AS child_table,
    c.referenced_schema AS parent_schema,
    c.referenced_table AS parent_table,
    c.on_delete,
    c.on_update,
    u.ord,
    child_att.attname AS child_column,
    parent_att.attname AS parent_column
  FROM _schema_constraints c
  JOIN pg_class child_cls ON child_cls.relname = c.table_name
  JOIN pg_namespace child_ns ON child_ns.oid = child_cls.relnamespace AND child_ns.nspname = c.table_schema
  JOIN pg_class parent_cls ON parent_cls.relname = c.referenced_table
  JOIN pg_namespace parent_ns ON parent_ns.oid = parent_cls.relnamespace AND parent_ns.nspname = c.referenced_schema
  CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS u(attnum, ord)
  JOIN pg_attribute child_att ON child_att.attrelid = child_cls.oid AND child_att.attnum = u.attnum
  JOIN pg_attribute parent_att ON parent_att.attrelid = parent_cls.oid AND parent_att.attnum = c.confkey[u.ord::integer]
  WHERE c.constraint_type = 'foreign_key'
)
SELECT
  child_schema,
  child_table,
  array_agg(child_column ORDER BY ord) AS child_columns,
  parent_schema,
  parent_table,
  array_agg(parent_column ORDER BY ord) AS parent_columns,
  constraint_name,
  on_delete,
  on_update,
  'many_to_one' AS relationship_shape
FROM fk_cols
GROUP BY child_schema, child_table, parent_schema, parent_table, constraint_name, on_delete, on_update
ORDER BY parent_schema, parent_table, child_schema, child_table, constraint_name;

DROP TABLE IF EXISTS pg_temp._schema_indexes;
CREATE TEMP TABLE _schema_indexes AS
SELECT
  schemaname AS table_schema,
  tablename AS table_name,
  indexname AS index_name,
  indexdef AS index_definition
FROM pg_indexes
WHERE EXISTS (
    SELECT 1
    FROM _schema_config cfg
    WHERE schemaname::text = ANY (cfg.included_schemas)
  )
ORDER BY schemaname, tablename, indexname;

DROP TABLE IF EXISTS pg_temp._schema_policies;
CREATE TEMP TABLE _schema_policies AS
SELECT
  schemaname AS table_schema,
  tablename AS table_name,
  policyname AS policy_name,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE EXISTS (
    SELECT 1
    FROM _schema_config cfg
    WHERE schemaname::text = ANY (cfg.included_schemas)
  )
ORDER BY schemaname, tablename, policyname;

DROP TABLE IF EXISTS pg_temp._schema_triggers;
CREATE TEMP TABLE _schema_triggers AS
SELECT
  ns.nspname AS table_schema,
  cls.relname AS table_name,
  trg.tgname AS trigger_name,
  proc_ns.nspname || '.' || proc.proname AS function_name,
  pg_get_triggerdef(trg.oid, true) AS trigger_definition
FROM pg_trigger trg
JOIN pg_class cls ON cls.oid = trg.tgrelid
JOIN pg_namespace ns ON ns.oid = cls.relnamespace
JOIN pg_proc proc ON proc.oid = trg.tgfoid
JOIN pg_namespace proc_ns ON proc_ns.oid = proc.pronamespace
WHERE NOT trg.tgisinternal
  AND EXISTS (
    SELECT 1
    FROM _schema_config cfg
    WHERE ns.nspname::text = ANY (cfg.included_schemas)
  )
ORDER BY ns.nspname, cls.relname, trg.tgname;

DROP TABLE IF EXISTS pg_temp._schema_functions;
CREATE TEMP TABLE _schema_functions AS
SELECT
  ns.nspname AS function_schema,
  proc.proname AS function_name,
  pg_get_function_arguments(proc.oid) AS arguments,
  pg_get_function_result(proc.oid) AS returns,
  proc.prosecdef AS security_definer,
  lang.lanname AS language
FROM pg_proc proc
JOIN pg_namespace ns ON ns.oid = proc.pronamespace
JOIN pg_language lang ON lang.oid = proc.prolang
WHERE EXISTS (
    SELECT 1
    FROM _schema_config cfg
    WHERE ns.nspname::text = ANY (cfg.included_schemas)
  )
ORDER BY ns.nspname, proc.proname, pg_get_function_arguments(proc.oid);

DROP TABLE IF EXISTS pg_temp._schema_tables;
CREATE TEMP TABLE _schema_tables AS
WITH constraint_counts AS (
  SELECT
    table_schema,
    table_name,
    count(*) FILTER (WHERE constraint_type = 'primary_key') AS primary_key_count,
    count(*) FILTER (WHERE constraint_type = 'foreign_key') AS outbound_fk_count,
    count(*) FILTER (WHERE constraint_type = 'unique') AS unique_count,
    count(*) FILTER (WHERE constraint_type = 'check') AS check_count
  FROM _schema_constraints
  GROUP BY table_schema, table_name
), inbound_fk_counts AS (
  SELECT
    parent_schema AS table_schema,
    parent_table AS table_name,
    count(*) AS inbound_fk_count
  FROM _schema_relationships
  GROUP BY parent_schema, parent_table
), policy_counts AS (
  SELECT table_schema, table_name, count(*) AS policy_count
  FROM _schema_policies
  GROUP BY table_schema, table_name
), trigger_counts AS (
  SELECT table_schema, table_name, count(*) AS trigger_count
  FROM _schema_triggers
  GROUP BY table_schema, table_name
)
SELECT
  obj.table_schema,
  obj.object_name AS table_name,
  obj.object_type,
  rc.row_count,
  rc.row_count_source,
  pg_size_pretty(obj.total_bytes) AS total_size,
  obj.total_bytes,
  pg_size_pretty(obj.table_bytes) AS table_size,
  pg_size_pretty(obj.index_bytes) AS index_size,
  COALESCE(cc.primary_key_count, 0) AS primary_key_count,
  COALESCE(cc.outbound_fk_count, 0) AS outbound_fk_count,
  COALESCE(ifk.inbound_fk_count, 0) AS inbound_fk_count,
  COALESCE(cc.unique_count, 0) AS unique_count,
  COALESCE(cc.check_count, 0) AS check_count,
  obj.rls_enabled,
  obj.rls_forced,
  COALESCE(pc.policy_count, 0) AS policy_count,
  COALESCE(tc.trigger_count, 0) AS trigger_count,
  st.seq_scan,
  st.idx_scan,
  st.n_tup_ins,
  st.n_tup_upd,
  st.n_tup_del,
  obj.object_comment
FROM _schema_objects obj
LEFT JOIN _schema_row_counts rc
  ON rc.table_schema = obj.table_schema
 AND rc.table_name = obj.object_name
LEFT JOIN constraint_counts cc
  ON cc.table_schema = obj.table_schema
 AND cc.table_name = obj.object_name
LEFT JOIN inbound_fk_counts ifk
  ON ifk.table_schema = obj.table_schema
 AND ifk.table_name = obj.object_name
LEFT JOIN policy_counts pc
  ON pc.table_schema = obj.table_schema
 AND pc.table_name = obj.object_name
LEFT JOIN trigger_counts tc
  ON tc.table_schema = obj.table_schema
 AND tc.table_name = obj.object_name
LEFT JOIN pg_stat_user_tables st ON st.relid = obj.relid
ORDER BY obj.table_schema, obj.object_name;

DROP TABLE IF EXISTS pg_temp._schema_mermaid_lines;
CREATE TEMP TABLE _schema_mermaid_lines (
  sort_key numeric NOT NULL,
  line text NOT NULL
);

INSERT INTO _schema_mermaid_lines(sort_key, line)
VALUES (0, 'erDiagram');

WITH table_order AS (
  SELECT
    row_number() OVER (ORDER BY table_schema, table_name) AS rn,
    table_schema,
    table_name,
    CASE WHEN table_schema = 'public' THEN table_name ELSE table_schema || '_' || table_name END AS entity_name
  FROM _schema_tables
  WHERE object_type IN ('table', 'partitioned_table', 'materialized_view')
)
INSERT INTO _schema_mermaid_lines(sort_key, line)
SELECT rn * 1000, '  ' || entity_name || ' {'
FROM table_order
UNION ALL
SELECT
  (t.rn * 1000) + c.ordinal_position,
  rtrim(format(
    '    %s %s %s',
    regexp_replace(lower(c.data_type), '[^a-z0-9_]+', '_', 'g'),
    c.column_name,
    concat_ws(' ',
      CASE WHEN c.is_primary_key THEN 'PK' END,
      CASE WHEN c.is_foreign_key THEN 'FK' END,
      CASE WHEN c.is_unique THEN 'UK' END
    )
  ))
FROM table_order t
JOIN _schema_columns c
  ON c.table_schema = t.table_schema
 AND c.table_name = t.table_name
UNION ALL
SELECT (rn * 1000) + 999, '  }'
FROM table_order;

WITH external_entities AS (
  SELECT DISTINCT
    parent_schema,
    parent_table,
    parent_schema || '_' || parent_table AS entity_name,
    row_number() OVER (ORDER BY parent_schema, parent_table) AS rn
  FROM _schema_relationships rel
  WHERE NOT EXISTS (
    SELECT 1
    FROM _schema_tables t
    WHERE t.table_schema = rel.parent_schema
      AND t.table_name = rel.parent_table
  )
)
INSERT INTO _schema_mermaid_lines(sort_key, line)
SELECT 90000 + (rn * 10), '  ' || entity_name || ' {'
FROM external_entities
UNION ALL
SELECT 90000 + (rn * 10) + 1, '    text external_table'
FROM external_entities
UNION ALL
SELECT 90000 + (rn * 10) + 2, '  }'
FROM external_entities;

WITH rel_order AS (
  SELECT
    row_number() OVER (ORDER BY parent_schema, parent_table, child_schema, child_table, constraint_name) AS rn,
    CASE WHEN parent_schema = 'public' THEN parent_table ELSE parent_schema || '_' || parent_table END AS parent_entity,
    CASE WHEN child_schema = 'public' THEN child_table ELSE child_schema || '_' || child_table END AS child_entity,
    array_to_string(child_columns, ', ') AS child_columns
  FROM _schema_relationships
)
INSERT INTO _schema_mermaid_lines(sort_key, line)
SELECT
  100000 + rn,
  format('  %s ||--o{ %s : "%s"', parent_entity, child_entity, child_columns)
FROM rel_order;

DROP TABLE IF EXISTS pg_temp._schema_table_groups;
CREATE TEMP TABLE _schema_table_groups AS
SELECT
  table_name,
  CASE
    WHEN table_name IN ('categories', 'regions', 'brands', 'products', 'offers', 'digital_codes', 'price_history') THEN 'catalog_inventory'
    WHEN table_name IN ('customers', 'customer_preferences', 'customer_payment_profiles') THEN 'customers'
    WHEN table_name IN ('orders', 'order_items', 'order_status_history', 'order_deliveries', 'order_sequence') THEN 'orders'
    WHEN table_name IN ('payment_methods', 'stripe_events') THEN 'payments'
    WHEN table_name IN ('home_content', 'home_featured_brands', 'trust_points', 'faqs', 'site_content') THEN 'site_content'
    WHEN table_name IN ('analytics_events') THEN 'analytics'
    WHEN table_name IN ('audit_logs', 'admin_audit_log', 'admin_users') THEN 'admin_audit_auth'
    WHEN table_name IN ('provinces', 'cities') THEN 'locations'
    WHEN table_name IN ('subscription_plans', 'subscriptions') THEN 'subscriptions_future'
    ELSE 'other'
  END AS domain_group,
  CASE
    WHEN table_name = 'categories' THEN 'Catalog category grouping for brands.'
    WHEN table_name = 'regions' THEN 'Sellable region/currency/country code used by offers.'
    WHEN table_name = 'brands' THEN 'Storefront brands under categories.'
    WHEN table_name = 'products' THEN 'Optional product layer between brand and offer.'
    WHEN table_name = 'offers' THEN 'Sellable variants: brand/product + region + denomination + price.'
    WHEN table_name = 'digital_codes' THEN 'Inventory codes assigned to offers and optionally orders.'
    WHEN table_name = 'customers' THEN 'Customer profile, auth link, and denormalized order stats.'
    WHEN table_name = 'orders' THEN 'Order header and customer/payment snapshot.'
    WHEN table_name = 'order_items' THEN 'Order lines linked to offers.'
    WHEN table_name = 'order_status_history' THEN 'Order status audit trail.'
    WHEN table_name = 'order_deliveries' THEN 'Structured delivery payload per order.'
    WHEN table_name = 'payment_methods' THEN 'Manual/Stripe/M-Pesa payment methods shown at checkout.'
    WHEN table_name = 'analytics_events' THEN 'Tracking events for pages, categories, brands, offers and orders.'
    WHEN table_name = 'home_content' THEN 'Singleton homepage content row.'
    WHEN table_name = 'home_featured_brands' THEN 'Ordered list of featured brand slugs.'
    WHEN table_name = 'trust_points' THEN 'Homepage trust blocks.'
    WHEN table_name = 'faqs' THEN 'Homepage/FAQ content blocks.'
    WHEN table_name = 'site_content' THEN 'General key/value JSON site settings.'
    WHEN table_name = 'admin_users' THEN 'Admin role mapping to auth.users.'
    WHEN table_name = 'admin_audit_log' THEN 'Current admin audit log.'
    WHEN table_name = 'audit_logs' THEN 'Legacy admin audit log.'
    WHEN table_name = 'provinces' THEN 'Province list for location selection.'
    WHEN table_name = 'cities' THEN 'Cities under provinces.'
    WHEN table_name = 'subscription_plans' THEN 'Future subscription plan catalog.'
    WHEN table_name = 'subscriptions' THEN 'Future customer subscriptions.'
    WHEN table_name = 'stripe_events' THEN 'Stripe webhook event idempotency/logging.'
    ELSE 'No description assigned.'
  END AS purpose
FROM _schema_tables;

-- ============================================================
-- Report output
-- ============================================================

SELECT '01_schema_summary' AS report, *
FROM (
  SELECT 'schemas' AS metric, array_to_string((SELECT included_schemas FROM _schema_config LIMIT 1), ', ') AS value
  UNION ALL SELECT 'objects', count(*)::text FROM _schema_objects
  UNION ALL SELECT 'tables', count(*)::text FROM _schema_tables WHERE object_type IN ('table', 'partitioned_table')
  UNION ALL SELECT 'views', count(*)::text FROM _schema_tables WHERE object_type IN ('view', 'materialized_view')
  UNION ALL SELECT 'columns', count(*)::text FROM _schema_columns
  UNION ALL SELECT 'foreign_keys', count(*)::text FROM _schema_relationships
  UNION ALL SELECT 'indexes', count(*)::text FROM _schema_indexes
  UNION ALL SELECT 'rls_enabled_tables', count(*)::text FROM _schema_tables WHERE rls_enabled
  UNION ALL SELECT 'policies', count(*)::text FROM _schema_policies
  UNION ALL SELECT 'triggers', count(*)::text FROM _schema_triggers
  UNION ALL SELECT 'functions', count(*)::text FROM _schema_functions
) s;

SELECT '02_table_inventory' AS report, t.*, g.domain_group, g.purpose
FROM _schema_tables t
LEFT JOIN _schema_table_groups g USING (table_name)
ORDER BY g.domain_group, t.table_schema, t.table_name;

SELECT '03_column_inventory' AS report, *
FROM _schema_columns
ORDER BY table_schema, table_name, ordinal_position;

SELECT '04_relationships' AS report, *
FROM _schema_relationships
ORDER BY parent_schema, parent_table, child_schema, child_table, constraint_name;

SELECT '05_constraints' AS report, *
FROM _schema_constraints
ORDER BY table_schema, table_name, constraint_type, constraint_name;

SELECT '06_indexes' AS report, *
FROM _schema_indexes
ORDER BY table_schema, table_name, index_name;

SELECT '07_rls_policies' AS report, *
FROM _schema_policies
ORDER BY table_schema, table_name, policy_name;

SELECT '08_triggers_and_functions' AS report, 'trigger' AS object_type, table_schema, table_name, trigger_name AS object_name, function_name, trigger_definition AS definition
FROM _schema_triggers
UNION ALL
SELECT '08_triggers_and_functions', 'function', function_schema, NULL::name, function_name, NULL::text, format('%s(%s) returns %s; security_definer=%s; language=%s', function_name, arguments, returns, security_definer, language)
FROM _schema_functions
ORDER BY object_type, table_schema, table_name, object_name;

SELECT '09_mermaid_er_diagram' AS report, string_agg(line, E'\n' ORDER BY sort_key) AS mermaid
FROM _schema_mermaid_lines;

SELECT '10_table_purpose_map' AS report, *
FROM _schema_table_groups
ORDER BY domain_group, table_name;

COMMIT;
