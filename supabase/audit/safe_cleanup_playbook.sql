-- ============================================================
-- Zuma - Safe cleanup SQL playbook
-- ============================================================
-- Use this after reviewing supabase/audit/database_cleanup_audit.sql.
-- The script is intentionally conservative:
--   - It creates an archive schema/helper inside a transaction.
--   - It ends with ROLLBACK by default.
--   - Change the final ROLLBACK to COMMIT only after reviewing generated SQL.
--
-- This file contains SQL templates. It does not know which rows/tables you
-- approved for cleanup until you fill the candidate temp tables below.
-- ============================================================

BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '10min';

CREATE SCHEMA IF NOT EXISTS cleanup_archive;

CREATE TABLE IF NOT EXISTS cleanup_archive.cleanup_manifest (
  id bigserial PRIMARY KEY,
  archived_at timestamptz NOT NULL DEFAULT now(),
  source_schema text NOT NULL,
  source_table text NOT NULL,
  archive_table text NOT NULL,
  row_count bigint NOT NULL,
  reason text NOT NULL,
  approved_by text NULL
);

CREATE OR REPLACE FUNCTION cleanup_archive.archive_table(
  p_source_schema text,
  p_source_table text,
  p_reason text,
  p_approved_by text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_source regclass;
  v_archive_schema text := 'cleanup_archive';
  v_archive_table text;
  v_archive_fq text;
  v_row_count bigint;
BEGIN
  v_source := to_regclass(format('%I.%I', p_source_schema, p_source_table));
  IF v_source IS NULL THEN
    RAISE EXCEPTION 'Source table %.% does not exist', p_source_schema, p_source_table;
  END IF;

  v_archive_table := p_source_table || '_' || to_char(clock_timestamp(), 'YYYYMMDD_HH24MISS');
  v_archive_fq := format('%I.%I', v_archive_schema, v_archive_table);

  EXECUTE format('CREATE TABLE %s AS TABLE %s WITH DATA', v_archive_fq, v_source);
  EXECUTE format('SELECT count(*)::bigint FROM %s', v_archive_fq) INTO v_row_count;

  INSERT INTO cleanup_archive.cleanup_manifest(
    source_schema,
    source_table,
    archive_table,
    row_count,
    reason,
    approved_by
  ) VALUES (
    p_source_schema,
    p_source_table,
    v_archive_fq,
    v_row_count,
    p_reason,
    p_approved_by
  );

  RETURN v_archive_fq;
END;
$$;

-- Fill these temp tables with approved targets only.
DROP TABLE IF EXISTS pg_temp.cleanup_approved_tables;
CREATE TEMP TABLE cleanup_approved_tables (
  source_schema text NOT NULL DEFAULT 'public',
  source_table text NOT NULL,
  reason text NOT NULL,
  approved_by text NULL,
  PRIMARY KEY (source_schema, source_table)
);

DROP TABLE IF EXISTS pg_temp.cleanup_approved_columns;
CREATE TEMP TABLE cleanup_approved_columns (
  source_schema text NOT NULL DEFAULT 'public',
  source_table text NOT NULL,
  column_name text NOT NULL,
  reason text NOT NULL,
  approved_by text NULL,
  PRIMARY KEY (source_schema, source_table, column_name)
);

-- Example only. Keep commented until approved.
-- INSERT INTO cleanup_approved_tables(source_table, reason, approved_by)
-- VALUES ('subscription_plans', 'empty future feature table confirmed unused by app', 'marcos');

-- Example only. Keep commented until approved.
-- INSERT INTO cleanup_approved_columns(source_table, column_name, reason, approved_by)
-- VALUES ('orders', 'admin_notes', 'all null and confirmed unused', 'marcos');

-- 1. Generate archive commands for approved tables.
SELECT
  'archive_table' AS step,
  source_schema,
  source_table,
  format(
    'SELECT cleanup_archive.archive_table(%L, %L, %L, %L);',
    source_schema,
    source_table,
    reason,
    approved_by
  ) AS sql_to_run
FROM cleanup_approved_tables
ORDER BY source_schema, source_table;

-- 2. Generate post-archive drop commands for approved empty/useless tables.
-- Run only after archive row_count matches source row_count and app usage is checked.
SELECT
  'drop_table_after_archive_and_hold' AS step,
  source_schema,
  source_table,
  format('DROP TABLE IF EXISTS %I.%I;', source_schema, source_table) AS sql_to_run
FROM cleanup_approved_tables
ORDER BY source_schema, source_table;

-- 3. Generate column prechecks.
SELECT
  'column_precheck' AS step,
  source_schema,
  source_table,
  column_name,
  format(
    'SELECT count(*) AS total_rows, count(*) FILTER (WHERE %1$I IS NOT NULL) AS non_null_rows FROM %2$I.%3$I;',
    column_name,
    source_schema,
    source_table
  ) AS sql_to_run
FROM cleanup_approved_columns
ORDER BY source_schema, source_table, column_name;

-- 4. Generate column archive commands.
-- This archives only the primary key + candidate column when a primary key exists.
-- If no primary key exists, archive the whole table first with archive_table().
WITH pk_cols AS (
  SELECT
    ns.nspname AS table_schema,
    cls.relname AS table_name,
    array_agg(att.attname ORDER BY u.ord) AS pk_columns
  FROM pg_constraint con
  JOIN pg_class cls ON cls.oid = con.conrelid
  JOIN pg_namespace ns ON ns.oid = cls.relnamespace
  CROSS JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS u(attnum, ord)
  JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = u.attnum
  WHERE con.contype = 'p'
  GROUP BY ns.nspname, cls.relname
)
SELECT
  'archive_column_values' AS step,
  c.source_schema,
  c.source_table,
  c.column_name,
  CASE
    WHEN pk.pk_columns IS NULL THEN
      format('SELECT cleanup_archive.archive_table(%L, %L, %L, %L);', c.source_schema, c.source_table, 'full table archive before dropping column ' || c.column_name || ': ' || c.reason, c.approved_by)
    ELSE
      format(
        'CREATE TABLE cleanup_archive.%I AS SELECT %s, %I FROM %I.%I;',
        c.source_table || '_' || c.column_name || '_' || to_char(current_date, 'YYYYMMDD'),
        (SELECT string_agg(format('%I', col), ', ') FROM unnest(pk.pk_columns) AS col),
        c.column_name,
        c.source_schema,
        c.source_table
      )
  END AS sql_to_run
FROM cleanup_approved_columns c
LEFT JOIN pk_cols pk
  ON pk.table_schema = c.source_schema
 AND pk.table_name = c.source_table
ORDER BY c.source_schema, c.source_table, c.column_name;

-- 5. Generate column drop commands.
-- Run only after column archive, app deploy without the column, and backup validation.
SELECT
  'drop_column_after_archive_and_deploy' AS step,
  source_schema,
  source_table,
  column_name,
  format('ALTER TABLE %I.%I DROP COLUMN IF EXISTS %I;', source_schema, source_table, column_name) AS sql_to_run
FROM cleanup_approved_columns
ORDER BY source_schema, source_table, column_name;

-- 6. Duplicate cleanup preview templates for high-risk Zuma tables.
-- These preview rows to keep/delete. They do not delete anything.

-- Digital codes duplicated inside the same offer.
SELECT 'digital_codes_duplicate_preview' AS preview, *
FROM (
  SELECT
    id,
    offer_id,
    code_content,
    status,
    order_id,
    assigned_at,
    created_at,
    row_number() OVER (
      PARTITION BY offer_id, code_content
      ORDER BY
        CASE status WHEN 'sold' THEN 1 WHEN 'available' THEN 2 ELSE 3 END,
        assigned_at DESC NULLS LAST,
        created_at DESC,
        id
    ) AS keep_rank
  FROM public.digital_codes
  WHERE to_regclass('public.digital_codes') IS NOT NULL
) ranked
WHERE keep_rank > 1
ORDER BY offer_id, code_content, keep_rank;

-- Customers duplicated by lower(email). Merge only after orders/auth references are reviewed.
SELECT 'customers_duplicate_email_preview' AS preview, *
FROM (
  SELECT
    id,
    auth_user_id,
    name,
    email,
    whatsapp_e164,
    orders_count,
    delivered_total,
    created_at,
    updated_at,
    row_number() OVER (
      PARTITION BY lower(email)
      ORDER BY
        (auth_user_id IS NOT NULL) DESC,
        orders_count DESC,
        delivered_total DESC,
        updated_at DESC NULLS LAST,
        created_at DESC,
        id
    ) AS keep_rank
  FROM public.customers
  WHERE to_regclass('public.customers') IS NOT NULL
    AND email IS NOT NULL
    AND btrim(email) <> ''
) ranked
WHERE keep_rank > 1
ORDER BY lower(email), keep_rank;

-- Offers duplicated by sellable variant. Repoint order_items/digital_codes before deleting any offer.
SELECT 'offers_duplicate_variant_preview' AS preview, *
FROM (
  SELECT
    id,
    brand_id,
    product_id,
    region_code,
    denomination_value,
    denomination_currency,
    price,
    cost_price,
    stock_quantity,
    status,
    created_at,
    updated_at,
    row_number() OVER (
      PARTITION BY brand_id, COALESCE(product_id::text, 'no_product'), region_code, denomination_value, denomination_currency
      ORDER BY
        CASE status WHEN 'active' THEN 1 ELSE 2 END,
        stock_quantity DESC,
        updated_at DESC NULLS LAST,
        created_at DESC,
        id
    ) AS keep_rank
  FROM public.offers
  WHERE to_regclass('public.offers') IS NOT NULL
) ranked
WHERE keep_rank > 1
ORDER BY brand_id, product_id, region_code, denomination_value, keep_rank;

-- 7. Safe delete pattern. Copy/adapt only after preview, archive, and FK repointing.
--
-- WITH rows_to_delete AS (
--   SELECT id
--   FROM some_preview
--   WHERE keep_rank > 1
-- ), archived AS (
--   INSERT INTO cleanup_archive.some_table_deleted_rows
--   SELECT t.*
--   FROM public.some_table t
--   JOIN rows_to_delete d USING (id)
--   RETURNING id
-- )
-- DELETE FROM public.some_table t
-- USING archived a
-- WHERE t.id = a.id;

-- Default safety: nothing persists unless you replace ROLLBACK with COMMIT.
ROLLBACK;
