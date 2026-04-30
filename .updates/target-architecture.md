# Zuma Target Architecture

This is the clean target shape for Zuma after stabilization. It is designed to fit the current Next.js App Router codebase and current Supabase usage, without requiring a full rewrite.

## Current status

Already applied in the repo:

- public routes now live under `app/(public)/*`
- customer auth and customer account routes are split into `app/(customer-auth)/*` and `app/(customer)/*`
- customer chrome now lives in `components/customer/*`
- checkout and success UI now live in `components/storefront/checkout/*`

Still pending:

- API audience grouping under route groups or explicit service boundaries
- customer-scoped order services instead of browser-side RPC composition
- removal of duplicate legacy admin component families
- final public-data boundary cleanup for catalog and checkout reads

## 1. Architectural Principles

### Route groups represent user journeys

- Public storefront routes should live under a public route group.
- Customer-auth routes should be separate from customer-account routes.
- Admin routes should only depend on admin-scoped services.

### Business actions get one write path

- Public order creation: one service.
- Admin order status update: one service.
- Customer order handoff: one service.

No duplicate write logic in components.

### Data clients have hard boundaries

- Public pages can use the public client.
- Customer pages can use the session-scoped server client.
- Admin pages and server jobs can use the service-role client.

Public pages must never read PII through the service-role client.

### Shared domain rules live in server modules, not UI files

- Status mapping
- Order access policy
- Checkout validation
- Site settings normalization

### UI components stay presentational when possible

- Components render.
- Route files compose.
- Server modules enforce policy and perform reads/writes.

## 2. Proposed Route Shape

Keep URL paths the same where possible, but use route groups to separate concerns.

```text
app/
  (public)/
    layout.tsx
    page.tsx
    browse/page.tsx
    b/[brandSlug]/page.tsx
    c/[categorySlug]/page.tsx
    checkout/page.tsx
    order/[successToken]/page.tsx

  (customer-auth)/
    cliente/login/page.tsx
    cliente/recuperar-senha/page.tsx

  (customer)/
    cliente/layout.tsx
    cliente/dashboard/page.tsx
    cliente/pedidos/page.tsx
    cliente/pedidos/[orderId]/page.tsx
    cliente/perfil/page.tsx
    cliente/pontos/page.tsx

  admin/
    layout.tsx
    page.tsx
    orders/...
    customers/...
    brands/...
    categories/...
    offers/...
    payment-methods/...
    analytics/...
    settings/...
    site/...

  api/
    public/
    customer/
    admin/
```

## 3. Proposed UI Layer

Split components by experience instead of mixing public/customer/admin in one flat layer.

```text
components/
  admin/
  customer/
  storefront/
  shared/
  ui/
```

### Recommended moves

- Move checkout-specific pieces from:
  - `components/CheckoutClient.tsx`
  - `components/CheckoutOrderSummary.tsx`
  - `components/CheckoutHeader.tsx`
  - `components/OrderSuccessClient.tsx`
- Into:
  - `components/storefront/checkout/*`

- Move customer account chrome from:
  - `app/(storefront)/cliente/layout.tsx`
- Into:
  - `components/customer/CustomerShell.tsx`
  - `components/customer/CustomerNav.tsx`

- Keep admin feature components inside:
  - `components/admin/*`
    But remove duplicate legacy pairs like `BrandsAdmin` versus `BrandsManager`.

## 4. Proposed Server Module Shape

Keep `src/server/modules` as the main business layer, but make each module more explicit.

```text
src/server/modules/
  analytics/
  catalog/
  content/
  customers/
  orders/
  payments/
```

Inside each domain, use this shape where needed:

```text
orders/
  order.schemas.ts
  order.repo.ts
  order-public.service.ts
  order-customer.service.ts
  order-admin.service.ts
  order-status.service.ts
  order-access.policy.ts
```

### Responsibilities

- `*.schemas.ts`
  Zod contracts and domain enums.
- `*.repo.ts`
  Raw Supabase access for that domain.
- `*-public.service.ts`
  Public-safe reads/writes only.
- `*-customer.service.ts`
  Session-bound customer operations.
- `*-admin.service.ts`
  Admin-only operations.
- `*.policy.ts`
  Ownership and authorization checks.

## 5. Public, Customer, And Admin Data Rules

### Public storefront

Allowed:

- active brands
- active categories
- active offers
- public site content

Not allowed:

- customer email
- customer WhatsApp
- raw order lookup by order number without a signed token

### Customer area

Allowed:

- authenticated customer's own orders
- loyalty data
- profile data

Not allowed:

- service-role reads
- fetching by arbitrary order number in the browser

### Admin

Allowed:

- service-role operations
- full customer/order data
- catalog and content mutations

Required:

- audit trail for destructive actions
- typed inputs for status and settings updates

## 6. Settings And Content Model

The current split between `site_content` and `home_content` is creating drift. The target should separate operational settings from marketing content.

### Recommended target

#### Operational settings

Use one typed source for:

- support email
- support WhatsApp
- default locale
- default currency
- business identity metadata

Suggested module:

- `src/server/modules/content/site-settings.service.ts`
- `src/server/modules/content/site-settings.schema.ts`

#### Homepage content

Keep homepage-specific copy and media together:

- hero title
- hero subtitle
- banner image
- featured brands title
- trust title
- FAQ title

Suggested module:

- `src/server/modules/content/home-content.service.ts`

#### Legal and informational pages

Add a dedicated content model for:

- about
- refunds
- privacy
- cookies
- faq

This can be backed by a `content_pages` table or MDX files, but it must be explicit.

## 7. Canonical Order Model

Zuma needs one status vocabulary across all layers.

### Recommended statuses

- `new`
- `pending_payment`
- `on_hold`
- `delivered`
- `cancelled`

If the database cannot change immediately, add a mapper first, then migrate the stored values.

### Where the canonical enum should live

- `src/server/modules/orders/order-status.schema.ts`

### Consumers

- `src/server/modules/orders/order-status.service.ts`
- `lib/orderStatus.ts` or its replacement
- customer dashboard/orders pages
- admin status select
- analytics/dashboard counters

## 8. API Boundary Strategy

The current `app/api` folder mixes audience types. Make that explicit.

### Target grouping

```text
app/api/
  public/
    site-content/
    brands/
    categories/
    offers/
    orders/

  customer/
    orders/
    profile/
    loyalty/

  admin/
    orders/
    customers/
    brands/
    categories/
    offers/
    payment-methods/
    analytics/
    settings/
    site/
```

Thin route handlers should:

1. authenticate if needed
2. call one service
3. return one normalized response shape

## 9. Recommended Migration Path

### Step 1

Stabilize security and broken flows without moving routes.

### Step 2

Extract duplicated logic into server modules and shared UI components.

### Step 3

Introduce route groups for `(public)`, `(customer-auth)`, and `(customer)` while preserving URLs.

### Step 4

Consolidate content/settings ownership and normalize order statuses.

### Step 5

Delete dead or duplicate admin components after the new ownership boundaries are in place.

## 10. Final Target Ownership Map

### Storefront

- Routes: `app/(public)/*`
- Components: `components/storefront/*`
- Services: `catalog`, `content`, `orders/order-public.service.ts`

### Customer account

- Routes: `app/(customer)/*`
- Components: `components/customer/*`
- Services: `customers/*`, `orders/order-customer.service.ts`

### Admin

- Routes: `app/admin/*`
- Components: `components/admin/*`
- Services: `orders/order-admin.service.ts`, `catalog/*`, `payments/*`, `content/*`, `analytics/*`

### Shared

- Components: `components/shared/*`, `components/ui/*`
- Server primitives: `src/server/http/*`, `src/server/platform/*`
- Client helpers: `lib/supabase/*`, `lib/i18n.tsx`, `lib/validation/*`

## 11. What Not To Do

- Do not rewrite every route at once.
- Do not keep multiple success flows for the same order.
- Do not let public pages depend on service-role access.
- Do not let settings UIs expose unsupported runtime states.
- Do not keep legacy and new admin component families active in parallel.
