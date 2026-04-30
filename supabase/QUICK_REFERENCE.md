# 📋 ZUMA DATABASE - QUICK REFERENCE

**Last Updated:** 2026-02-10  
**Schema Version:** 2.0

---

## 🚀 Quick Start

### Fresh Database Setup

```bash
# Option 1: Supabase CLI (Recommended)
supabase link --project-ref YOUR_PROJECT_REF
supabase db reset

# Option 2: Manual
psql YOUR_CONNECTION_STRING < supabase/MASTER_SCHEMA.sql
```

### Apply Additional Migrations

```bash
psql YOUR_CONNECTION_STRING < supabase/migrations/20240102000000_add_analytics_indexes.sql
psql YOUR_CONNECTION_STRING < supabase/migrations/20240103000000_add_customer_fields.sql
```

---

## 📊 Database Overview

### Tables (25 total)

| Category | Tables | Count |
|----------|--------|-------|
| 📦 **Catalog** | categories, regions, brands, products, offers | 5 |
| 👤 **Customers** | customers, customer_payment_profiles | 2 |
| 🛒 **Orders** | orders, order_items, order_status_history, order_deliveries, order_sequence | 5 |
| 💳 **Payments** | payment_methods, stripe_events | 2 |
| 📦 **Inventory** | digital_codes | 1 |
| 📊 **Analytics** | analytics_events | 1 |
| 🔐 **Admin** | admin_users, audit_logs | 2 |
| 🏠 **Content** | home_content, home_featured_brands, trust_points, faqs, site_content | 5 |
| 💰 **Subscriptions** | subscription_plans, subscriptions | 2 |

### Key Functions

| Function | Purpose |
|----------|---------|
| `create_order()` | Create order with stock validation |
| `update_order_status()` | Update order status + history |
| `upsert_customer_by_whatsapp()` | Upsert customer by WhatsApp |
| `sync_offer_stock()` | Auto-sync digital code inventory |
| `update_customer_stats()` | Auto-update customer statistics |
| `generate_order_number()` | Generate sequential order numbers |

---

## 🔗 Key Relationships

```
categories
  └── brands
       ├── products
       │    └── subscription_plans
       └── offers
            ├── digital_codes
            └── order_items
                 └── orders
                      ├── customers
                      ├── payment_methods
                      ├── order_status_history
                      └── order_deliveries

regions
  └── offers
```

---

## 📈 Status Values

### Order Status

```
'new' → 'on_hold' → 'delivered'
                  ↘ 'canceled'
```

Valid values: `new`, `on_hold`, `delivered`, `canceled`

### Digital Code Status

Valid values: `available`, `sold`, `revoked`

### Generic Status (brands, products, offers, etc.)

Valid values: `active`, `inactive`

---

## 🔍 Common Queries

### Get Order with Items

```sql
SELECT 
  o.*,
  json_agg(oi.*) as items
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.id = 'order-uuid'
GROUP BY o.id;
```

### Check Stock Availability

```sql
SELECT 
  o.id,
  o.stock_quantity,
  o.is_unlimited,
  (
    SELECT count(*) 
    FROM digital_codes 
    WHERE offer_id = o.id AND status = 'available'
  ) as available_codes
FROM offers o
WHERE o.id = 'offer-uuid';
```

### Customer Statistics

```sql
SELECT 
  c.*,
  COUNT(o.id) as total_orders,
  SUM(CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
  SUM(CASE WHEN o.status = 'delivered' THEN o.total_amount ELSE 0 END) as lifetime_value
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE c.id = 'customer-uuid'
GROUP BY c.id;
```

### Analytics Dashboard

```sql
SELECT 
  event_name,
  COUNT(*) as count,
  DATE_TRUNC('day', created_at) as day
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY event_name, day
ORDER BY day DESC, count DESC
LIMIT 100;
```

---

## 🛠️ Maintenance

### Vacuum and Analyze

```sql
VACUUM ANALYZE orders;
VACUUM ANALYZE customers;
VACUUM ANALYZE analytics_events;
```

### Check Index Usage

```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Check Table Sizes

```sql
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🔐 Security

### Row Level Security (RLS)

```sql
-- Enable RLS on sensitive tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can only see their own data
CREATE POLICY "users_own_data" ON customers
  FOR SELECT
  USING (auth.uid() = id);
```

### Admin Access

```sql
-- Check if user is admin
SELECT EXISTS (
  SELECT 1 
  FROM admin_users 
  WHERE user_id = auth.uid()
);
```

---

## 📊 Performance Indexes

### Existing Indexes

```sql
-- Analytics (QA Fix #20)
analytics_events(created_at DESC)
analytics_events(event_name)
analytics_events(order_id)

-- Orders
orders(status)
orders(customer_id)
orders(created_at DESC)

-- Offers
offers(brand_id)
offers(region_code)

-- Order Items
order_items(order_id)
```

### Add Custom Index

```sql
CREATE INDEX idx_custom_name 
ON table_name(column_name);
```

---

## 🆘 Troubleshooting

### Check Active Connections

```sql
SELECT 
  datname,
  usename,
  application_name,
  client_addr,
  state,
  query
FROM pg_stat_activity
WHERE datname = current_database();
```

### Find Slow Queries

```sql
SELECT 
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;
```

### Kill Long-Running Query

```sql
SELECT pg_cancel_backend(pid);
-- or force terminate
SELECT pg_terminate_backend(pid);
```

---

## 📖 Documentation Links

- **Full Schema:** [`MASTER_SCHEMA.sql`](./MASTER_SCHEMA.sql)
- **Complete Docs:** [`SCHEMA_DOCUMENTATION.md`](./SCHEMA_DOCUMENTATION.md)
- **Setup Guide:** [`README.md`](../README.md)
- **QA Report:** [`QA_FIXES_SUMMARY.md`](../QA_FIXES_SUMMARY.md)

---

## 🔧 Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Optional
SUPABASE_STORAGE_URL=
```

---

## ✅ Health Check

```sql
-- All tables exist?
SELECT count(*) FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should return: 25

-- All functions exist?
SELECT count(*) FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
-- Should return: 7+

-- All triggers exist?
SELECT count(*) FROM information_schema.triggers 
WHERE trigger_schema = 'public';
-- Should return: 10+
```

---

**Keep this card handy for quick reference!** 📌

