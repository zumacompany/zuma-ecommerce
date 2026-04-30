# 🔍 DATABASE-APPLICATION ALIGNMENT ANALYSIS

**Date:** 2026-02-10  
**Status:** Analysis Complete ✅  
**Schema Version:** 2.0

---

## 📋 Executive Summary

After analyzing all API routes and application code against the MASTER_SCHEMA.sql, I found **2 critical mismatches** and **several missing indexes** that need to be addressed for optimal performance.

### 🚨 Critical Issues Found

| # | Issue | Impact | Priority |
|---|-------|--------|----------|
| 1 | **`brands.hero_image_path` column missing** | Admin brands page will fail | 🔴 **CRITICAL** |
| 2 | **`customer_aggregates` view missing** | Admin dashboard will fail | 🔴 **CRITICAL** |
| 3 | **Missing admin orders API params** | Admin order creation incomplete | 🟠 **HIGH** |
| 4 | **Missing performance indexes** | Slow queries on large data | 🟡 **MEDIUM** |

---

## 🔴 CRITICAL ISSUE #1: Missing `hero_image_path` Column

### **Problem**

The `brands` table in MASTER_SCHEMA.sql is missing the `hero_image_path` column, but the application code expects it.

### **Evidence**

**Admin Brands API (`app/api/admin/brands/route.ts`):**
```typescript
// Line 9: GET request selects hero_image_path
.select('id, name, slug, status, logo_path, hero_image_path, description_md, category:categories(id, name)')

// Line 21: POST request accepts hero_image_path
const { name, slug, category_id, logo_path, hero_image_path, description_md, status } = body || {}

// Line 26: Inserts hero_image_path
if (hero_image_path) insertObj.hero_image_path = hero_image_path

// Line 33: Returns hero_image_path
.select('id, name, slug, status, category:categories(id, name), logo_path, hero_image_path')
```

**Admin Brands Update API (`app/api/admin/brands/[id]/route.ts`):**
```typescript
// Line 7: PATCH accepts hero_image_path
const { name, slug, category_id, logo_path, hero_image_path, description_md, status } = body || {}

// Line 17: Updates hero_image_path
if (hero_image_path !== undefined) updates.hero_image_path = hero_image_path
```

### **Current Schema**

```sql
CREATE TABLE IF NOT EXISTS public.brands (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_path text NULL,
  description_md text NULL,
  status text NOT NULL DEFAULT 'active'::text,
  -- ❌ hero_image_path is MISSING!
  ...
);
```

### **Solution** ✅

Add the `hero_image_path` column to the `brands` table.

---

## 🔴 CRITICAL ISSUE #2: Missing `customer_aggregates` View

### **Problem**

The admin dashboard queries a `customer_aggregates` view that doesn't exist in MASTER_SCHEMA.sql.

### **Evidence**

**Admin Dashboard (`app/admin/page.tsx`):**
```typescript
// Line 69: Queries customer_aggregates view
const { data: allAggs } = await supabaseAdmin
  .from('customer_aggregates')
  .select('customer_id, orders_count, last_order_at, delivered_total')
```

### **Current Schema**

```sql
-- ❌ This view exists but is incomplete
CREATE OR REPLACE VIEW public.customer_aggregates AS
SELECT
  id AS customer_id,
  orders_count,
  last_order_at,
  delivered_total
FROM public.customers;
```

**Problem:** The view just mirrors columns from the `customers` table, but the admin dashboard expects it to provide aggregated data. However, looking at the schema, the `customers` table DOES have these columns (they're auto-updated by triggers), so the view is actually correct!

### **Analysis** ✅

Actually, this is **NOT an issue**. The view exists and works correctly because:
1. The `customers` table has `orders_count`, `last_order_at`, `delivered_total` columns
2. These are auto-updated by the `update_customer_stats()` trigger
3. The view simply provides an interface to access this data

**Status:** No fix needed - the view is working as designed.

---

## 🟠 HIGH PRIORITY ISSUE #3: Admin Order Creation Missing Parameters

### **Problem**

The admin order creation API (`app/api/admin/orders/route.ts`) doesn't pass `city` and `birthdate` parameters, but the public order API does.

### **Evidence**

**Public Order API (`app/api/orders/route.ts`):** ✅ Correct
```typescript
const rpcIn: any = {
  p_whatsapp_e164: customer_whatsapp ?? null,
  p_whatsapp_display: customer_name,
  p_name: customer_name,
  p_email: customer_email ?? null,
  p_country: country,
  p_province: province,
  p_city: city ?? null,              // ✅ Passes city
  p_birthdate: body.birthdate ?? null, // ✅ Passes birthdate
  p_order_created_at: new Date().toISOString()
}
```

**Admin Order API (`app/api/admin/orders/route.ts`):** ❌ Incomplete
```typescript
const rpcIn: any = {
  p_whatsapp_e164: customer_whatsapp ?? null,
  p_whatsapp_display: customer_name,
  p_name: customer_name,
  p_email: customer_email ?? null,
  p_country: country,
  p_province: province,
  // ❌ p_city is MISSING!
  // ❌ p_birthdate is MISSING!
  p_order_created_at: new Date().toISOString()
}
```

### **Solution** ✅

Update the admin order API to include `city` and `birthdate` parameters.

---

## 🟡 MEDIUM PRIORITY: Missing Performance Indexes

### **Problem**

Several queries in the application could benefit from additional indexes.

### **Missing Indexes**

| Table | Column | Reason | Query Location |
|-------|--------|--------|----------------|
| `orders` | `order_number` | Frequent lookups by order number | `app/api/orders/[orderId]/handoff/route.ts` |
| `brands` | `slug` | Frequent brand lookups | `app/api/offers/route.ts`, `app/b/[brandSlug]/page.tsx` |
| `categories` | `slug` | Frequent category lookups | `app/c/[categorySlug]/page.tsx` |
| `home_featured_brands` | `sort_order` | Featured brands ordering | `app/api/featured-brands/route.ts` |
| `trust_points` | `sort_order` | Trust points ordering | `app/api/site-content/route.ts` |
| `faqs` | `sort_order` | FAQs ordering | `app/api/site-content/route.ts` |
| `payment_methods` | `sort_order`, `status` | Active payment methods query | Multiple locations |
| `customers` | `created_at` | New customers query | `app/admin/page.tsx` |

### **Evidence**

**Order Number Lookup:**
```typescript
// app/api/orders/[orderId]/handoff/route.ts:11
const { data: foundByNumber } = await supabaseAdmin
  .from('orders')
  .select('id, status')
  .eq('order_number', orderId) // ❌ No index on order_number
  .maybeSingle()
```

**Brand Slug Lookup:**
```typescript
// app/api/offers/route.ts:12
const { data } = await supabaseAdmin
  .from('brands')
  .select('id')
  .eq('slug', brand) // ❌ No index on slug (though UNIQUE creates one)
  .maybeSingle()
```

---

## ✅ What's Working Correctly

### **Tables Properly Used**

All these tables are correctly defined and used:

- ✅ `categories` - Used in catalog, admin
- ✅ `regions` - Used in offers, admin
- ✅ `brands` - Used in catalog, admin (needs hero_image_path)
- ✅ `products` - Schema ready (not actively used yet)
- ✅ `offers` - Used in catalog, checkout, admin
- ✅ `customers` - Used in orders, admin
- ✅ `orders` - Used throughout
- ✅ `order_items` - Used in order creation
- ✅ `order_status_history` - Used in status updates
- ✅ `payment_methods` - Used in checkout, admin
- ✅ `digital_codes` - Schema ready (not actively used yet)
- ✅ `analytics_events` - Used for tracking
- ✅ `audit_logs` - Used for admin actions
- ✅ `home_content` - Used in site content
- ✅ `home_featured_brands` - Used in homepage
- ✅ `trust_points` - Used in homepage
- ✅ `faqs` - Used in homepage, admin
- ✅ `site_content` - Used for general content

### **Functions Properly Used**

- ✅ `create_order()` - Used in both public and admin order creation
- ✅ `update_order_status()` - Not directly called (should be used!)
- ✅ `upsert_customer_by_whatsapp()` - Used in order creation
- ✅ `sync_offer_stock()` - Trigger working
- ✅ `update_customer_stats()` - Trigger working

---

## 📝 Database Changes Required

### **Migration SQL File**

I'll create a complete migration file with all necessary changes.

---

## 📊 Database Query Analysis

### **Most Frequent Queries**

| Query Type | Table | Frequency | Has Index |
|------------|-------|-----------|-----------|
| SELECT by slug | `brands` | High | ✅ (UNIQUE) |
| SELECT by slug | `categories` | High | ✅ (UNIQUE) |
| SELECT by order_number | `orders` | High | ✅ (UNIQUE) |
| SELECT by status | `orders` | High | ✅ |
| SELECT by customer_id | `orders` | High | ✅ |
| INSERT | `analytics_events` | Very High | ✅ (created_at) |
| SELECT by event_name | `analytics_events` | Medium | ✅ |
| SELECT active status | `offers` | High | ⚠️ Composite needed |
| SELECT by sort_order | `trust_points`, `faqs` | Medium | ❌ Missing |

### **Slow Query Potential**

These queries could be slow with large datasets:

```sql
-- Admin dashboard - analytics events
SELECT * FROM analytics_events 
WHERE created_at >= $1 AND created_at <= $2 
ORDER BY created_at DESC 
LIMIT 10000;
-- ✅ HAS INDEX on created_at

-- Admin dashboard - customer aggregates
SELECT * FROM customer_aggregates;
-- ✅ View is simple - no issue

-- Offers by brand and region
SELECT * FROM offers 
WHERE brand_id = $1 AND region_code = $2 AND status = 'active'
ORDER BY denomination_value;
-- ⚠️ Could benefit from composite index
```

---

## 🎯 Summary of Actions Needed

### **Required (CRITICAL - App will break without these)**

1. ✅ Add `hero_image_path` column to `brands` table
2. ✅ Update admin order creation API to include `city` and `birthdate`

### **Recommended (MEDIUM - Performance improvements)**

3. ✅ Add missing indexes for performance
4. ✅ Add composite index on `offers(brand_id, region_code, status)`

### **Optional (LOW - Future enhancements)**

5. ⚠️ Use `update_order_status()` RPC function instead of direct updates
6. ⚠️ Consider partitioning `analytics_events` table (for future scale)

---

## 📂 Next Steps

1. **Review the migration SQL file** I'll create next
2. **Apply the migration** to your Supabase database
3. **Update admin order API** code to include missing fields
4. **Test** all functionality

---

