-- admin_audit_log records every mutation performed by an admin user. Writes
-- happen via the service role from API route handlers; the table is read-only
-- for normal users (no public RLS policy is added on purpose).

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  admin_user_id uuid NULL,
  admin_email text NULL,
  action text NOT NULL,           -- e.g. 'order.update_status', 'customer.delete'
  resource_type text NOT NULL,    -- e.g. 'order', 'customer', 'brand'
  resource_id text NULL,
  diff jsonb NULL,                -- before/after snapshot or arbitrary metadata
  ip_address text NULL,
  user_agent text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx
  ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_resource_idx
  ON public.admin_audit_log (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS admin_audit_log_admin_idx
  ON public.admin_audit_log (admin_user_id);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
-- No public policies. Service role bypasses RLS. Admin UI should query through
-- a server-side route handler that already gates on hasAdminAccess.
