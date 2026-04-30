# 📋 ZUMA DATABASE SCHEMA - COMPLETE DOCUMENTATION

**Version:** 2.0 (Post-QA Implementation)  
**Date:** 2026-02-10  
**Status:** Production Ready ✅

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Schema Comparison](#schema-comparison)
3. [Complete Table List](#complete-table-list)
4. [Key Differences Resolved](#key-differences-resolved)
5. [QA Fixes Implemented](#qa-fixes-implemented)
6. [Execution Order](#execution-order)
7. [Migration Guide](#migration-guide)

---

## 🎯 Overview

This document explains the complete, unified database schema for the Zuma application. The **MASTER_SCHEMA.sql** file represents the definitive, production-ready structure that combines:

1. **Live Production Database** (from `merge_14JAN26.txt`)
2. **Development Schema** (from `schema.sql`)
3. **All QA Fixes** (from recent implementation)

---

## 🔍 Schema Comparison

### Tables in Production (Live DB) NOT in schema.sql

These tables exist in your live database and have been added to MASTER_SCHEMA.sql:

| Table | Purpose |
|-------|---------|
| `admin_users` | Admin authentication and role management |
| `customer_payment_profiles` | Stripe customer payment integration |
| `order_deliveries` | Digital delivery tracking |
| `subscription_plans` | Future subscription features |
| `subscriptions` | Active customer subscriptions |
| `stripe_events` | Stripe webhook event logging |
| `order_sequence` | Sequential order number generation |

### Key Column Differences

#### `customers` table:
- **Live DB:** `whatsapp_e164` is `NOT NULL UNIQUE`
- **schema.sql:** `whatsapp_e164` was `NULL` with UNIQUE
- **MASTER:** Uses live DB structure (NOT NULL)

#### `customers` table - New Columns:
- ✅ `city text` - Added (QA Fix #19)
- ✅ `birthdate date` - Added (QA Fix #18)

#### `orders` table:
- ✅ `city text` - Added for delivery address
- ✅ `delivery_codes text` - Manual digital code entry
- ✅ `admin_notes text` - Admin comments

### Status Constraints

#### `orders.status` Constraint:

**Live DB (Correct):**
```sql
CHECK (status IN ('new', 'on_hold', 'delivered', 'canceled'))
```

**schema.sql (Had extra statuses):**
```sql
CHECK (status IN ('new', 'on_hold', 'pending', 'processing', 'shipped', 'delivered', 'canceled'))
```

**MASTER:** Uses live DB constraint (simpler workflow)  
✅ **QA Fix #7:** Standardized to 'canceled' (not 'cancelled')

---

## 📊 Complete Table List

### Core Tables (22 tables)

| # | Table Name | Category | Description |
|---|------------|----------|-------------|
| 1 | `admin_users` | Auth | Admin role management |
| 2 | `categories` | Catalog | Product categories |
| 3 | `regions` | Catalog | Geographic regions |
| 4 | `brands` | Catalog | Brand information |
| 5 | `products` | Catalog | Product definitions |
| 6 | `offers` | Catalog | Product offers by region |
| 7 | `customers` | CRM | Customer profiles |
| 8 | `customer_payment_profiles` | Payments | Stripe integrations |
| 9 | `payment_methods` | Payments | Available payment methods |
| 10 | `order_sequence` | Orders | Order number generation |
| 11 | `orders` | Orders | Main orders table |
| 12 | `order_items` | Orders | Order line items |
| 13 | `order_status_history` | Orders | Status change audit trail |
| 14 | `order_deliveries` | Orders | Delivery tracking |
| 15 | `digital_codes` | Inventory | Digital code inventory |
| 16 | `analytics_events` | Analytics | User interaction tracking |
| 17 | `audit_logs` | Audit | Admin action logging |
| 18 | `home_content` | Content | Homepage content |
| 19 | `home_featured_brands` | Content | Featured brand selection |
| 20 | `trust_points` | Content | Trust indicator content |
| 21 | `faqs` | Content | FAQ content |
| 22 | `site_content` | Content | General site content (JSONB) |
| 23 | `subscription_plans` | Subscriptions | Subscription offerings |
| 24 | `subscriptions` | Subscriptions | Active subscriptions |
| 25 | `stripe_events` | Payments | Stripe webhook logs |

---

## 🔧 Key Differences Resolved

### 1. ✅ Foreign Key Relationships

**MASTER_SCHEMA.sql includes proper cascading:**

```sql
-- Brands -> Categories
brands.category_id → categories.id (ON DELETE RESTRICT)

-- Offers -> Brands
offers.brand_id → brands.id (ON DELETE CASCADE)

-- Offers -> Regions
offers.region_code → regions.code (ON DELETE RESTRICT)

-- Orders -> Customers
orders.customer_id → customers.id (ON DELETE SET NULL)
```

### 2. ✅ Indexes for Performance

**Added from QA Fix #20:**

```sql
-- Analytics optimization
CREATE INDEX analytics_events_created_at_idx ON analytics_events(created_at DESC);
CREATE INDEX analytics_events_event_name_idx ON analytics_events(event_name);
CREATE INDEX analytics_events_order_id_idx ON analytics_events(order_id);

-- Orders optimization
CREATE INDEX orders_created_at_idx ON orders(created_at DESC);
```

### 3. ✅ Triggers

All triggers are properly implemented:

- `brands_set_updated_at`
- `products_set_updated_at`
- `offers_set_updated_at`
- `customers_set_updated_at`
- `payment_methods_set_updated_at`
- `orders_set_updated_at`
- `on_digital_code_change` - Syncs stock
- `on_order_change` - Updates customer stats

---

## 🛠️ QA Fixes Implemented

The MASTER_SCHEMA includes all critical QA fixes:

| Fix # | Issue | Implementation |
|-------|-------|----------------|
| #1 | SQL syntax error | ✅ Fixed `$$` delimiters |
| #2 | Dev auth bypass | ✅ Proper middleware (code fix, not schema) |
| #3 | Stock validation | ✅ `FOR UPDATE` lock in `create_order()` |
| #4 | Input sanitization | ✅ Validation in API (code fix) |
| #5 | Debug console.logs | ✅ Removed from code |
| #6 | Weak email validation | ✅ Enhanced regex (code fix) |
| #7 | Status inconsistency | ✅ Standardized to 'canceled' |
| #8 | Hardcoded values | ✅ Centralized config (code fix) |
| #18 | Birthdate not stored | ✅ `customers.birthdate` column |
| #19 | City not stored | ✅ `customers.city` and `orders.city` columns |
| #20 | Missing indexes | ✅ 3 new indexes on `analytics_events` |

---

## ⚙️ Execution Order

### Option 1: Fresh Database (Recommended)

Execute in this order:

```bash
# 1. Run master schema
psql -U postgres -d zuma < supabase/MASTER_SCHEMA.sql

# 2. Run additional migrations (if any)
psql -U postgres -d zuma < supabase/migrations/20240102000000_add_analytics_indexes.sql
psql -U postgres -d zuma < supabase/migrations/20240103000000_add_customer_fields.sql
```

### Option 2: Migrate from Existing Database

```sql
-- Add missing columns
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS birthdate date;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_codes text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_notes text;

-- Fix order status constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('new', 'on_hold', 'delivered', 'canceled'));

-- Add indexes
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_event_name_idx ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS analytics_events_order_id_idx ON analytics_events(order_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);

-- Update upsert function (replace entire function from MASTER_SCHEMA.sql)
```

---

## 🚀 Migration Guide

### Step-by-Step Migration

#### 1. **Backup Current Database**

```bash
# Via Supabase CLI
supabase db dump > backup_$(date +%Y%m%d).sql

# Or via psql
pg_dump -U postgres -d zuma > backup_$(date +%Y%m%d).sql
```

#### 2. **Review Current Schema**

```sql
-- Check existing tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check constraints
SELECT conname, conrelid::regclass, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid::regclass::text LIKE '%orders%';
```

#### 3. **Test Migration in Development**

Create a test database and apply MASTER_SCHEMA.sql:

```bash
createdb zuma_test
psql -U postgres -d zuma_test < supabase/MASTER_SCHEMA.sql
```

#### 4. **Apply to Production**

If using Supabase:

```bash
# Push schema
supabase db push

# Or reset and apply master schema
supabase db reset
```

#### 5. **Verify Schema**

```sql
-- Check all tables exist
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Should return 25

-- Check functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
-- Should include: create_order, update_order_status, upsert_customer_by_whatsapp, etc.

-- Check triggers
SELECT trigger_name, event_object_table FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

---

## 📝 Important Notes

### Database Extensions Required

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Environment Variables Needed

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Row Level Security (RLS)

**Note:** The MASTER_SCHEMA.sql does NOT include RLS policies. You should add appropriate policies based on your security requirements:

```sql
-- Example: Enable RLS on sensitive tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own data" ON customers
  FOR SELECT USING (auth.uid() = id);
```

---

## 🎯 Next Steps

After applying MASTER_SCHEMA.sql:

1. ✅ Verify all tables exist
2. ✅ Test create_order() function
3. ✅ Test upsert_customer_by_whatsapp() function
4. ✅ Run the application
5. ✅ Test checkout flow
6. ✅ Test admin panel
7. ⚠️ Set up RLS policies (if needed)
8. ⚠️ Configure backups
9. ⚠️ Monitor performance

---

## 🆘 Troubleshooting

### Issue: "Function already exists"

```sql
-- Drop and recreate
DROP FUNCTION IF EXISTS public.create_order CASCADE;
-- Then recreate from MASTER_SCHEMA.sql
```

### Issue: "Constraint violation"

```sql
-- Check existing data
SELECT DISTINCT status FROM orders;
-- Should only show: new, on_hold, delivered, canceled

-- Fix data if needed
UPDATE orders SET status = 'canceled' WHERE status = 'cancelled';
```

### Issue: "Missing column"

```sql
-- The schema includes all columns. If missing, add manually:
ALTER TABLE customers ADD COLUMN city text;
ALTER TABLE customers ADD COLUMN birthdate date;
```

---

## ✅ Schema Health Checklist

- [ ] All 25 tables created
- [ ] All foreign keys in place
- [ ] All indexes created
- [ ] All triggers active
- [ ] All functions created
- [ ] Seed data inserted
- [ ] Test order creation works
- [ ] Test customer upsert works
- [ ] No duplicate order statuses
- [ ] Stock validation working

---

**This schema is production-ready and includes all QA fixes and features!** 🎉

