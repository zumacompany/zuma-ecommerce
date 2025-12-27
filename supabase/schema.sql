-- ZUMA Supabase schema (based on the provided blueprint)

-- 2.1 Extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- 2.2 Tables

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

create table if not exists public.site_content (
key text primary key,
value jsonb not null,
updated_at timestamptz not null default now()
);

-- Customers
create table if not exists public.customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text null,
  whatsapp text null,
  country text null,
  province text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Updated_at trigger for customers
drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at before update on public.customers
for each row execute function public.set_updated_at();

-- Upsert RPC for customers
create or replace function public.upsert_customer_strict(
  p_name text,
  p_email text,
  p_whatsapp text,
  p_country text,
  p_province text
)
returns table(customer_id uuid) as $$
declare
  existing public.customers%rowtype;
begin
  if p_email is not null then
    select * into existing from public.customers where lower(email) = lower(p_email) limit 1;
  end if;

  if existing is null and p_whatsapp is not null then
    select * into existing from public.customers where whatsapp = p_whatsapp limit 1;
  end if;

  if existing is null then
    insert into public.customers(name, email, whatsapp, country, province) values (p_name, p_email, p_whatsapp, p_country, p_province) returning id into customer_id;
    return next;
  else
    update public.customers set name = coalesce(p_name, existing.name), email = coalesce(p_email, existing.email), whatsapp = coalesce(p_whatsapp, existing.whatsapp), country = coalesce(p_country, existing.country), province = coalesce(p_province, existing.province) where id = existing.id;
    customer_id := existing.id;
    return next;
  end if;
end;
$$ language plpgsql;

-- View for customer aggregates (orders_count, last_order_at, delivered_total)
create or replace view public.customer_aggregates as
select
  customer_id,
  count(*) as orders_count,
  max(created_at) as last_order_at,
  coalesce(sum(case when status = 'delivered' then total_amount else 0 end), 0) as delivered_total
from public.orders
where customer_id is not null
group by customer_id;

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

create table if not exists public.order_items (
id uuid primary key default uuid_generate_v4(),
order_id uuid not null references public.orders(id) on delete cascade,
offer_id uuid not null references public.offers(id) on delete restrict,
qty int not null check (qty > 0),
unit_price numeric not null,
total numeric not null
);

create table if not exists public.order_status_history (
id uuid primary key default uuid_generate_v4(),
order_id uuid not null references public.orders(id) on delete cascade,
changed_by uuid null,
from_status text not null,
to_status text not null,
note text null,
created_at timestamptz not null default now()
);

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
create index if not exists analytics_created_at_idx on public.analytics_events(created_at);

-- 2.3 Triggers (updated_at)
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

-- 2.4 Order number generator
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

-- 2.6 Policies - Enable RLS
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.offers enable row level security;
alter table public.payment_methods enable row level security;
alter table public.site_content enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.analytics_events enable row level security;

-- Public READ policies
-- Use DROP IF EXISTS before CREATE because Postgres doesn't support CREATE POLICY IF NOT EXISTS on some versions

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

-- Orders: public INSERT only

drop policy if exists "public_create_orders" on public.orders;
create policy "public_create_orders" on public.orders
for insert with check (true);

drop policy if exists "public_create_order_items" on public.order_items;
create policy "public_create_order_items" on public.order_items
for insert with check (true);

-- Analytics events: public INSERT

drop policy if exists "public_insert_analytics" on public.analytics_events;
create policy "public_insert_analytics" on public.analytics_events
for insert with check (true);

-- Admin/full access for authenticated (simple approach for MVP)
-- Using a simple check auth.uid() IS NOT NULL as "authenticated"

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

-- Create helper RPC to create order + items atomically
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
    order_number, customer_id, customer_name, customer_email, customer_whatsapp,
    payment_method_id, payment_method_snapshot, total_amount, currency
  ) values (
    public.generate_order_number(), p_customer_id, p_customer_name, p_customer_email, p_customer_whatsapp,
    p_payment_method_id, p_payment_method_snapshot, subtotal, p_currency
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

-- End of schema
