-- ==========================================
-- ZUMA Supabase Schema (Production Ready)
-- ==========================================

-- 2.1 Extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;
create extension if not exists citext;

-- ==========================================
-- 2.2 Core Tables
-- ==========================================

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.brands (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  logo_path text null,
  hero_image_path text null,
  description_md text null,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default uuid_generate_v4(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  region_code text not null,
  denomination_value numeric not null,
  denomination_currency text not null,
  price numeric not null,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists offers_brand_region_idx on public.offers(brand_id, region_code);
create index if not exists offers_status_idx on public.offers(status);

create table if not exists public.payment_methods (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null check (type in ('manual','stripe','mpesa')),
  instructions_md text null,
  details jsonb null,
  status text not null default 'active' check (status in ('active','inactive')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_methods_status_idx on public.payment_methods(status);

create table if not exists public.site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ==========================================
-- 2.3 Customers CRM Tables
-- ==========================================

create table if not exists public.customers (
  id uuid primary key default uuid_generate_v4(),

  whatsapp_e164 text not null unique,
  whatsapp_display text null,

  name text not null,
  email citext not null unique,

  country text not null,
  province text not null,

  first_order_at timestamptz null,
  last_order_at timestamptz null,

  orders_count int not null default 0,
  delivered_orders_count int not null default 0,
  delivered_total numeric not null default 0,

  status text not null default 'active' check (status in ('active','blocked')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_email_idx on public.customers(email);
create index if not exists customers_whatsapp_idx on public.customers(whatsapp_e164);
create index if not exists customers_last_order_idx on public.customers(last_order_at desc);
create index if not exists customers_delivered_total_idx on public.customers(delivered_total desc);

create table if not exists public.tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  color text null,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_tags (
  customer_id uuid not null references public.customers(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, tag_id)
);

create table if not exists public.customer_notes (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  note text not null,
  created_by uuid null,
  created_at timestamptz not null default now()
);

create index if not exists customer_notes_customer_idx on public.customer_notes(customer_id);

-- ==========================================
-- 2.4 Orders & Order Items
-- ==========================================

create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text not null unique,
  
  customer_id uuid null references public.customers(id) on delete set null,
  customer_name text not null,
  customer_email text null,
  customer_whatsapp text not null,

  status text not null default 'new' check (status in ('new','on_hold','delivered','canceled')),
  payment_method_id uuid null references public.payment_methods(id) on delete set null,
  payment_method_snapshot jsonb null,

  total_amount numeric not null,
  currency text not null,
  handoff_clicked_at timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_customer_idx on public.orders(customer_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);

create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  offer_id uuid not null references public.offers(id) on delete restrict,
  qty int not null check (qty > 0),
  unit_price numeric not null,
  total numeric not null
);

create index if not exists order_items_order_idx on public.order_items(order_id);

create table if not exists public.order_status_history (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  changed_by uuid null,
  from_status text not null,
  to_status text not null,
  note text null,
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_idx on public.order_status_history(order_id);

-- ==========================================
-- 2.5 Analytics
-- ==========================================

create table if not exists public.analytics_events (
  id uuid primary key default uuid_generate_v4(),
  session_id text not null,
  event_name text not null,
  path text null,
  referrer text null,
  country_code text null,
  category_slug text null,
  brand_slug text null,
  offer_id uuid null,
  order_id uuid null,
  metadata jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists analytics_event_name_idx on public.analytics_events(event_name);
create index if not exists analytics_created_at_idx on public.analytics_events(created_at desc);
create index if not exists analytics_session_idx on public.analytics_events(session_id);

-- ==========================================
-- 2.6 Order Sequence
-- ==========================================

create table if not exists public.order_sequence (
  id int primary key generated always as identity,
  created_at timestamptz not null default now()
);

create or replace function public.generate_order_number()
returns text as $$
declare
  seq_id int;
begin
  insert into public.order_sequence default values returning id into seq_id;
  return 'ZM-' || lpad(seq_id::text, 6, '0');
end;
$$ language plpgsql;

-- ==========================================
-- 2.7 Triggers (updated_at)
-- ==========================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists brands_set_updated_at on public.brands;
create trigger brands_set_updated_at before update on public.brands
for each row execute function public.set_updated_at();

drop trigger if exists offers_set_updated_at on public.offers;
create trigger offers_set_updated_at before update on public.offers
for each row execute function public.set_updated_at();

drop trigger if exists payment_methods_set_updated_at on public.payment_methods;
create trigger payment_methods_set_updated_at before update on public.payment_methods
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at before update on public.customers
for each row execute function public.set_updated_at();

-- ==========================================
-- 2.8 RPC: Create Order with Customer
-- ==========================================

create or replace function public.create_order(
  p_customer_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_whatsapp text,
  p_payment_method_id uuid,
  p_payment_method_snapshot jsonb,
  p_items jsonb,
  p_currency text default 'USD'
)
returns table(order_id uuid, order_number text) as $$
declare
  new_order_id uuid;
  row jsonb;
  subtotal numeric := 0;
begin
  -- compute subtotal from items JSON array
  for row in select * from jsonb_array_elements(p_items) loop
    subtotal := subtotal + ((row->>'unit_price')::numeric * (row->>'qty')::int);
  end loop;

  insert into public.orders(
    order_number,
    customer_id,
    customer_name,
    customer_email,
    customer_whatsapp,
    payment_method_id,
    payment_method_snapshot,
    total_amount,
    currency
  ) values (
    public.generate_order_number(),
    p_customer_id,
    p_customer_name,
    p_customer_email,
    p_customer_whatsapp,
    p_payment_method_id,
    p_payment_method_snapshot,
    subtotal,
    p_currency
  ) returning id, order_number into new_order_id, order_number;

  for row in select * from jsonb_array_elements(p_items) loop
    insert into public.order_items(order_id, offer_id, qty, unit_price, total)
    values (
      new_order_id,
      (row->>'offer_id')::uuid,
      (row->>'qty')::int,
      (row->>'unit_price')::numeric,
      ((row->>'unit_price')::numeric * (row->>'qty')::int)
    );
  end loop;

  return query select new_order_id as order_id, order_number;
end;
$$ language plpgsql;

-- ==========================================
-- 2.9 RPC: Upsert Customer (Strict)
-- ==========================================

create or replace function public.upsert_customer_strict(
  p_whatsapp_e164 text,
  p_whatsapp_display text,
  p_name text,
  p_email citext,
  p_country text,
  p_province text,
  p_order_created_at timestamptz
)
returns uuid
language plpgsql
as $$
declare
  c_by_whatsapp record;
  c_by_email record;
  cid uuid;
begin
  -- 1) Match by WhatsApp (primary key for customer identity)
  select * into c_by_whatsapp
  from public.customers
  where whatsapp_e164 = p_whatsapp_e164
  limit 1;

  if c_by_whatsapp.id is not null then
    -- email must not belong to someone else
    select * into c_by_email
    from public.customers
    where email = p_email and id <> c_by_whatsapp.id
    limit 1;

    if c_by_email.id is not null then
      raise exception 'Email already in use by another customer';
    end if;

    -- Update existing customer by WhatsApp
    update public.customers
    set
      whatsapp_display = coalesce(p_whatsapp_display, whatsapp_display),
      name = p_name,
      email = p_email,
      country = p_country,
      province = p_province,
      first_order_at = coalesce(first_order_at, p_order_created_at),
      last_order_at = greatest(coalesce(last_order_at, p_order_created_at), p_order_created_at),
      orders_count = orders_count + 1
    where id = c_by_whatsapp.id
    returning id into cid;

    return cid;
  end if;

  -- 2) Match by Email (secondary match, strict policy)
  select * into c_by_email
  from public.customers
  where email = p_email
  limit 1;

  if c_by_email.id is not null then
    -- email exists but whatsapp differs: strict policy blocks merge
    perform 1
    from public.customers
    where whatsapp_e164 = p_whatsapp_e164 and id <> c_by_email.id;

    if found then
      raise exception 'WhatsApp already in use by another customer';
    end if;

    -- Block: customer exists with this email, must use same WhatsApp
    raise exception 'Customer exists with this email. Please use the same WhatsApp.';
  end if;

  -- 3) Create new customer
  insert into public.customers (
    whatsapp_e164,
    whatsapp_display,
    name,
    email,
    country,
    province,
    first_order_at,
    last_order_at,
    orders_count
  ) values (
    p_whatsapp_e164,
    p_whatsapp_display,
    p_name,
    p_email,
    p_country,
    p_province,
    p_order_created_at,
    p_order_created_at,
    1
  )
  returning id into cid;

  return cid;
end;
$$;

-- ==========================================
-- 2.10 Row Level Security (RLS)
-- ==========================================

alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.offers enable row level security;
alter table public.payment_methods enable row level security;
alter table public.site_content enable row level security;
alter table public.customers enable row level security;
alter table public.customer_notes enable row level security;
alter table public.tags enable row level security;
alter table public.customer_tags enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.analytics_events enable row level security;

-- Public READ policies
drop policy if exists "public_read_categories" on public.categories;
create policy "public_read_categories" on public.categories
for select using (true);

drop policy if exists "public_read_active_brands" on public.brands;
create policy "public_read_active_brands" on public.brands
for select using (status = 'active');

drop policy if exists "public_read_active_offers" on public.offers;
create policy "public_read_active_offers" on public.offers
for select using (status = 'active');

drop policy if exists "public_read_active_payment_methods" on public.payment_methods;
create policy "public_read_active_payment_methods" on public.payment_methods
for select using (status = 'active');

drop policy if exists "public_read_site_content" on public.site_content;
create policy "public_read_site_content" on public.site_content
for select using (true);

-- Orders: public INSERT
drop policy if exists "public_create_orders" on public.orders;
create policy "public_create_orders" on public.orders
for insert with check (true);

drop policy if exists "public_create_order_items" on public.order_items;
create policy "public_create_order_items" on public.order_items
for insert with check (true);

-- Analytics: public INSERT
drop policy if exists "public_insert_analytics" on public.analytics_events;
create policy "public_insert_analytics" on public.analytics_events
for insert with check (true);

-- Admin/authenticated full access (MVP: simple check)
drop policy if exists "auth_full_categories" on public.categories;
create policy "auth_full_categories" on public.categories
for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "auth_full_brands" on public.brands;
create policy "auth_full_brands" on public.brands
for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "auth_full_offers" on public.offers;
create policy "auth_full_offers" on public.offers
for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "auth_full_payment_methods" on public.payment_methods;
create policy "auth_full_payment_methods" on public.payment_methods
for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "auth_full_site_content" on public.site_content;
create policy "auth_full_site_content" on public.site_content
for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "auth_full_customers" on public.customers;
create policy "auth_full_customers" on public.customers
for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "auth_full_customer_notes" on public.customer_notes;
create policy "auth_full_customer_notes" on public.customer_notes
for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "auth_full_tags" on public.tags;
create policy "auth_full_tags" on public.tags
for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "auth_full_customer_tags" on public.customer_tags;
create policy "auth_full_customer_tags" on public.customer_tags
for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "auth_full_orders" on public.orders;
create policy "auth_full_orders" on public.orders
for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "auth_full_order_items" on public.order_items;
create policy "auth_full_order_items" on public.order_items
for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "auth_full_order_status_history" on public.order_status_history;
create policy "auth_full_order_status_history" on public.order_status_history
for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "auth_full_analytics" on public.analytics_events;
create policy "auth_full_analytics" on public.analytics_events
for all using (auth.uid() is not null) with check (auth.uid() is not null);
