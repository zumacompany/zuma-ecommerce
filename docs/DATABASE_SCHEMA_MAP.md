# Zuma Database Schema Map

This is a working map of the Zuma application database. It is based on the consolidated schema in `supabase/FULL_SCHEMA.sql` and should be verified against the live database with `supabase/audit/schema_overview_audit.sql`.

## How To Read This

- Solid ER links are real foreign keys in the schema.
- Some logical links are intentionally stored without FK constraints, especially analytics and audit metadata.
- `auth.users` is managed by Supabase Auth and is shown as an external table.
- `products`, `subscription_plans`, `subscriptions`, `stripe_events`, and some delivery/payment profile tables may be future or partially-used features depending on production data.

## High-Level Domains

| Domain | Tables | Purpose |
| --- | --- | --- |
| Admin/Auth | `admin_users`, `admin_audit_log`, `audit_logs`, external `auth.users` | Admin access and audit history. |
| Catalog | `categories`, `brands`, `products`, `regions`, `offers` | Storefront sellable catalog. |
| Inventory | `digital_codes` | Digital code stock for offers. |
| Customers | `customers`, `customer_preferences`, `customer_payment_profiles` | Customer identity, settings, payment provider profile. |
| Orders | `order_sequence`, `orders`, `order_items`, `order_status_history`, `order_deliveries` | Checkout, order lines, status audit, fulfillment. |
| Payments | `payment_methods`, `stripe_events` | Checkout payment methods and Stripe event log. |
| Content | `home_content`, `home_featured_brands`, `trust_points`, `faqs`, `site_content` | Storefront/admin-managed content. |
| Analytics | `analytics_events` | Tracking and dashboard data. |
| Locations | `provinces`, `cities` | Location options for customer/order forms. |
| Subscriptions | `subscription_plans`, `subscriptions` | Future subscription model. |

## ER Diagram

```mermaid
erDiagram
  auth_users {
    uuid id PK
  }

  admin_users {
    uuid user_id PK FK
    text role
    timestamptz created_at
  }

  categories {
    uuid id PK
    text name
    text slug UK
    text color
    text icon
    timestamptz created_at
  }

  regions {
    uuid id PK
    text name
    text code UK
    timestamptz created_at
  }

  brands {
    uuid id PK
    uuid category_id FK
    text name
    text slug UK
    text logo_path
    text hero_image_path
    text description_md
    text status
    timestamptz created_at
    timestamptz updated_at
  }

  products {
    uuid id PK
    uuid brand_id FK
    text name
    text description_md
    text product_type
    text status
    timestamptz created_at
    timestamptz updated_at
  }

  offers {
    uuid id PK
    uuid brand_id FK
    uuid product_id FK
    text region_code FK
    numeric denomination_value
    text denomination_currency
    numeric price
    numeric cost_price
    integer stock_quantity
    boolean is_unlimited
    boolean auto_fulfill
    text status
    timestamptz created_at
    timestamptz updated_at
  }

  customers {
    uuid id PK
    uuid auth_user_id FK UK
    text whatsapp_e164 UK
    text whatsapp_display
    text name
    text email
    text country
    text province
    text city
    date birthdate
    timestamptz first_order_at
    timestamptz last_order_at
    integer orders_count
    integer delivered_orders_count
    numeric delivered_total
    integer loyalty_points
    text status
    timestamptz created_at
    timestamptz updated_at
  }

  customer_preferences {
    uuid id PK
    uuid customer_id FK UK
    boolean email_notifications
    boolean whatsapp_notifications
    text language
    timestamptz created_at
    timestamptz updated_at
  }

  customer_payment_profiles {
    uuid id PK
    uuid customer_id FK UK
    text provider
    text provider_customer_id UK
    timestamptz created_at
  }

  payment_methods {
    uuid id PK
    text name
    text type
    text instructions_md
    jsonb details
    text status
    integer sort_order
    timestamptz created_at
    timestamptz updated_at
  }

  order_sequence {
    integer id PK
    timestamptz created_at
  }

  orders {
    uuid id PK
    text order_number UK
    uuid customer_id FK
    text customer_name
    text customer_email
    text customer_whatsapp
    uuid payment_method_id FK
    jsonb payment_method_snapshot
    text currency
    numeric total_amount
    text status
    timestamptz handoff_clicked_at
    text delivery_codes
    text admin_notes
    text city
    timestamptz created_at
    timestamptz updated_at
  }

  order_items {
    uuid id PK
    uuid order_id FK
    uuid offer_id FK
    integer qty
    numeric unit_price
    numeric total
  }

  order_status_history {
    uuid id PK
    uuid order_id FK
    uuid changed_by
    text from_status
    text to_status
    text note
    timestamptz created_at
  }

  order_deliveries {
    uuid id PK
    uuid order_id FK UK
    jsonb delivery_payload
    timestamptz delivered_at
    timestamptz created_at
    timestamptz updated_at
  }

  digital_codes {
    uuid id PK
    uuid offer_id FK
    text code_content
    text status
    uuid order_id FK
    timestamptz assigned_at
    timestamptz created_at
  }

  analytics_events {
    uuid id PK
    text session_id
    text event_name
    text path
    text referrer
    text country_code
    text category_slug
    text brand_slug
    uuid offer_id
    uuid order_id
    jsonb metadata
    timestamptz created_at
  }

  admin_audit_log {
    uuid id PK
    uuid admin_user_id
    text admin_email
    text action
    text resource_type
    text resource_id
    jsonb diff
    text ip_address
    text user_agent
    timestamptz created_at
  }

  audit_logs {
    uuid id PK
    text admin_email
    text action
    text entity
    text entity_id
    jsonb details
    timestamptz created_at
  }

  home_content {
    integer id PK
    text hero_title
    text hero_subtitle
    text hero_banner_image
    text featured_brands_title
    text trust_points_title
    text faq_title
    text whatsapp_number
    timestamptz updated_at
  }

  home_featured_brands {
    text brand_slug PK FK
    integer sort_order
    timestamptz created_at
  }

  trust_points {
    uuid id PK
    text title
    text subtitle
    integer sort_order
    timestamptz created_at
  }

  faqs {
    uuid id PK
    text question
    text answer
    integer sort_order
    timestamptz created_at
  }

  site_content {
    text key PK
    jsonb value
    timestamptz updated_at
  }

  provinces {
    uuid id PK
    text region_code UK
    text name UK
    integer sort_order
    timestamptz created_at
  }

  cities {
    uuid id PK
    uuid province_id FK
    text name UK
    integer sort_order
    timestamptz created_at
  }

  subscription_plans {
    uuid id PK
    uuid product_id FK
    text name
    text interval
    integer interval_count
    text currency
    numeric amount
    text status
    text stripe_price_id UK
    timestamptz created_at
    timestamptz updated_at
  }

  subscriptions {
    uuid id PK
    uuid customer_id FK
    uuid plan_id FK
    text status
    timestamptz current_period_start
    timestamptz current_period_end
    boolean cancel_at_period_end
    text stripe_subscription_id UK
    timestamptz created_at
    timestamptz updated_at
  }

  stripe_events {
    text id PK
    text type
    jsonb payload
    timestamptz received_at
  }

  auth_users ||--o{ admin_users : "user_id"
  auth_users ||--o{ customers : "auth_user_id"
  categories ||--o{ brands : "category_id"
  brands ||--o{ products : "brand_id"
  brands ||--o{ offers : "brand_id"
  products ||--o{ offers : "product_id"
  regions ||--o{ offers : "region_code -> code"
  customers ||--o{ customer_preferences : "customer_id"
  customers ||--o{ customer_payment_profiles : "customer_id"
  customers ||--o{ orders : "customer_id"
  payment_methods ||--o{ orders : "payment_method_id"
  orders ||--o{ order_items : "order_id"
  offers ||--o{ order_items : "offer_id"
  orders ||--o{ order_status_history : "order_id"
  orders ||--o{ order_deliveries : "order_id"
  offers ||--o{ digital_codes : "offer_id"
  orders ||--o{ digital_codes : "order_id"
  brands ||--o{ home_featured_brands : "brand_slug -> slug"
  provinces ||--o{ cities : "province_id"
  products ||--o{ subscription_plans : "product_id"
  subscription_plans ||--o{ subscriptions : "plan_id"
  customers ||--o{ subscriptions : "customer_id"
```

## Main Data Flows

### 1. Catalog To Checkout

`categories` group `brands`. `brands` own `products` and `offers`. An `offer` is the sellable unit: brand/product, region, denomination, price, cost, stock settings.

Important details:

- `offers.region_code` references `regions.code`, not `regions.id`.
- `offers.product_id` is nullable, so the product layer is optional.
- `digital_codes` stores stock for digital fulfillment and updates `offers.stock_quantity` through trigger logic.

### 2. Customer Order Flow

Checkout creates or updates a `customers` row through `upsert_customer_by_whatsapp`, then creates an `orders` row and `order_items` through `create_order`.

Important details:

- `orders` stores customer and payment snapshots so old orders survive customer/payment changes.
- `order_items` store `unit_price` and `total` at purchase time.
- `order_status_history` is the audit trail for order status transitions.
- `orders.total_amount` and customer stats are derived values and should be periodically reconciled.

### 3. Fulfillment

Fulfillment can be represented in two places:

- `orders.delivery_codes`: manual text delivery field.
- `order_deliveries.delivery_payload`: structured delivery record.

This overlap should be clarified before deleting either field/table.

### 4. Customer Auth

`customers.auth_user_id` links a customer profile to Supabase `auth.users`. `customer_preferences` stores customer-facing settings. `admin_users.user_id` also points to `auth.users` for admin access.

### 5. Content Management

Homepage/storefront content is split across:

- `home_content`: singleton row for hero/titles/contact.
- `home_featured_brands`: ordered brand slug list.
- `trust_points`: trust blocks.
- `faqs`: FAQ blocks.
- `site_content`: general JSON settings.

### 6. Analytics And Audit

`analytics_events` tracks behavior but its `offer_id` and `order_id` are logical references in the consolidated schema, not enforced FKs. `admin_audit_log` appears to be the current audit table; `audit_logs` appears legacy.

### 7. Future/Optional Areas

These tables exist but may be unused depending on current product scope:

- `products`
- `customer_payment_profiles`
- `order_deliveries`
- `subscription_plans`
- `subscriptions`
- `stripe_events`

Do not drop them based on names alone. Confirm row counts, application usage, and business roadmap first.

## Live Schema Audit SQL

Run this to inspect the real database, including columns not reflected in this document:

```sql
-- file: supabase/audit/schema_overview_audit.sql
```

Key reports:

| Report | Meaning |
| --- | --- |
| `01_schema_summary` | Counts of objects, columns, FKs, indexes, policies, triggers. |
| `02_table_inventory` | Every table/view with row counts, sizes, RLS, FK counts and purpose. |
| `03_column_inventory` | Every column with type, nullability, default, PK/FK/unique flags. |
| `04_relationships` | All real FKs in the live database. |
| `05_constraints` | Primary key, foreign key, unique and check constraints. |
| `06_indexes` | All indexes. |
| `07_rls_policies` | RLS policies by table. |
| `08_triggers_and_functions` | Database triggers and public functions/RPCs. |
| `09_mermaid_er_diagram` | Mermaid diagram generated from the live schema. |
| `10_table_purpose_map` | Human-readable table grouping and purpose. |
