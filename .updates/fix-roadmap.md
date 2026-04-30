# Zuma Fix Roadmap

This roadmap is designed for the current repo, not an idealized rewrite. Each phase lists the exact files to change first, then the files to create if extraction is worth doing.

Note:

- early phase file lists reference the pre-architecture route group `app/(storefront)/*`
- the current repo now uses `app/(public)/*`, `app/(customer-auth)/*`, and `app/(customer)/*`
- checkout UI files also moved from root-level `components/*` into `components/storefront/checkout/*`

## Phase 0: Stop Public Data Leaks And Unsafe Order Mutations

### Goal

Remove the pre-launch security blockers in the order success and handoff flow.

### Current files to change

- `app/(storefront)/order/[orderNumber]/success/page.tsx`
- `components/OrderSuccessClient.tsx`
- `app/api/orders/[orderId]/handoff/route.ts`
- `src/server/modules/orders/order.service.ts`
- `src/server/platform/db/supabase.ts`
- `lib/supabase/server.ts`
- `lib/services/orders.ts`
- `app/api/orders/route.ts`

### New files to create

- `src/server/modules/orders/order-public.service.ts`
- `src/server/modules/orders/order-public.schemas.ts`
- `src/server/modules/orders/order-access.policy.ts`

### Required changes

- Replace public service-role order lookups with either:
  - authenticated customer ownership checks, or
  - signed one-time success tokens tied to the created order.
- Move public handoff logic out of `markOrderHandoff` into a public-safe service with explicit authorization checks.
- Change `OrderSuccessClient` so it validates the WhatsApp target before mutating anything.
- Make `/api/orders/[orderId]/handoff` accept only a signed handoff token or a verified customer session.
- Keep `createPublicOrder` as the only canonical public order-write entrypoint.

### Done when

- An unknown visitor cannot open another customer's success page.
- A guessed order number cannot change an order to `on_hold`.
- The only public order mutation path is authorized and auditable.

## Phase 1: Remove Broken Navigation And Unify The Customer Entry Points

### Goal

Stop sending users into dead ends and make customer login feel like a login page, not a half-mounted account area.

### Current files to change

- `components/FeaturedBrandsClient.tsx`
- `components/Footer.tsx`
- `components/Header.tsx`
- `app/(storefront)/cliente/layout.tsx`
- `app/(storefront)/cliente/login/page.tsx`
- `app/(storefront)/cliente/dashboard/page.tsx`
- `app/(storefront)/cliente/pedidos/page.tsx`
- `lib/supabase/middleware.ts`
- `app/(storefront)/layout.tsx`

### New files to create

- `app/(storefront)/cliente/pedidos/[orderId]/page.tsx`
- `app/(storefront)/cliente/perfil/page.tsx`
- `app/(storefront)/cliente/pontos/page.tsx`
- `app/(storefront)/cliente/recuperar-senha/page.tsx`

### Required changes

- Change featured brands "view all" from `/brands` to the real browse route or create a real `/brands` page.
- Remove or implement footer links for `/about`, `/refunds`, `/privacy`, `/cookies`, `/faq`.
- Turn the header account icon into a real link to `/cliente/login` or `/cliente/dashboard`.
- Move customer login out of the customer dashboard shell, or add a layout exception for `/cliente/login`.
- Add the missing customer routes or remove the nav items until they exist.
- Add the missing customer order detail route because both dashboard and orders page link to it now.

### Done when

- No primary public CTA lands on `404`.
- `/cliente/login` renders as a clean auth page without the customer sidebar.
- Every visible customer navigation item resolves to a real route.

## Phase 2: Make Checkout And Post-Purchase One Coherent Flow

### Goal

Eliminate duplicated summaries, mixed data sources, and divergent success behaviors.

### Current files to change

- `app/(storefront)/checkout/page.tsx`
- `components/CheckoutClient.tsx`
- `components/CheckoutOrderSummary.tsx`
- `components/CheckoutHeader.tsx`
- `components/BrandOffersClient.tsx`
- `components/OrderSuccessClient.tsx`
- `app/(storefront)/order/[orderNumber]/success/page.tsx`
- `app/api/site-content/route.ts`
- `lib/config.ts`

### New files to create

- `components/storefront/checkout/CheckoutShell.tsx`
- `components/storefront/checkout/CheckoutSummary.tsx`
- `components/storefront/checkout/CheckoutSuccess.tsx`
- `src/server/modules/content/public-site-content.service.ts`

### Required changes

- Remove the duplicate summary block from `checkout/page.tsx` plus `CheckoutClient`.
- Keep one summary component and let client state drive quantity, totals, and payment readiness.
- Stop forcing mixed labels like `Gift Card 15 MZN` for offers whose denomination currency is not `MZN`.
- Use one WhatsApp number source for checkout and success pages.
- Remove the artificial 6-second success delay unless there is a measured conversion reason to keep it.
- Collapse inline success and `/order/[orderNumber]/success` into one canonical post-purchase flow.

### Done when

- Checkout shows one summary only.
- Totals, denomination labels, and currencies match the selected offer.
- Success, handoff, and WhatsApp behavior are identical regardless of entry path.

## Phase 3: Normalize Statuses, Customer Metrics, And Admin Reliability

### Goal

Make admin/customer flows agree on order states, labels, and metrics.

### Current files to change

- `lib/orderStatus.ts`
- `app/(storefront)/cliente/dashboard/page.tsx`
- `app/(storefront)/cliente/pedidos/page.tsx`
- `components/admin/OrderStatusSelect.tsx`
- `src/server/modules/orders/order-status.service.ts`
- `components/admin/OrdersTable.tsx`
- `components/admin/OrderDelivery.tsx`
- `lib/formatRelativeTime.ts`

### New files to create

- `src/server/modules/orders/order-status.ts`
- `src/server/modules/orders/order-status.schema.ts`
- `src/server/modules/orders/order-status.mapper.ts`

### Required changes

- Define one canonical status set for Zuma orders.
- Validate status updates with a real enum, not `z.string().min(1)`.
- Remove `canceled` versus `cancelled` drift at the UI edge.
- Use the same status mapping in customer dashboard, customer orders, admin orders, and analytics.
- Pass locale through `formatRelativeTime` instead of defaulting to `pt-BR`.
- Replace `alert`, `confirm`, and `mailto` fulfillment shortcuts with in-app feedback and tracked server actions.

### Done when

- Admin and customer UIs show the same status names and colors.
- No page needs ad hoc status normalization.
- Admin actions fail inline and predictably instead of via browser dialogs.

## Phase 4: Fix Settings Drift And Missing Admin Copy

### Goal

Make admin settings truthful, stable, and aligned with what the storefront actually supports.

### Current files to change

- `components/admin/GlobalSettingsPageUI.tsx`
- `components/admin/SiteAdmin.tsx`
- `components/admin/SiteSettingsPageUI.tsx`
- `app/api/admin/settings/route.ts`
- `app/api/admin/site/route.ts`
- `src/server/modules/content/site-settings.service.ts`
- `app/admin/users/page.tsx`
- `messages/pt.json`
- `messages/en.json`
- `components/LanguageSwitcher.tsx`
- `lib/i18n.tsx`

### New files to create

- `src/server/modules/content/site-settings.schema.ts`
- `src/server/modules/content/site-settings.mapper.ts`
- `src/server/modules/content/home-content.service.ts`

### Required changes

- Remove unsupported locale and currency options from admin settings until runtime actually supports them.
- Add the missing `admin.users.*` translation keys.
- Fix the admin password reset redirect by creating the route or changing the redirect target.
- Add error handling to the `SiteAdmin` initial `Promise.all` load so the page cannot hang forever.
- Decide whether `site_content` remains key-value or is replaced by typed singleton content tables; do not keep both vague and overlapping.

### Done when

- Admin settings do not offer fake capabilities.
- Admin users page builds cleanly with no missing i18n keys.
- Site settings and home settings have a single clear ownership model.

## Phase 5: Harden Query Building And Public/Admin Data Boundaries

### Goal

Reduce fragile query behavior and make data access rules obvious.

### Current files to change

- `app/admin/orders/page.tsx`
- `app/admin/customers/page.tsx`
- `app/(storefront)/b/[brandSlug]/page.tsx`
- `app/(storefront)/c/[categorySlug]/page.tsx`
- `app/(storefront)/checkout/page.tsx`
- `lib/api/rate-limit.ts`

### New files to create

- `src/server/http/query-params.ts`
- `src/server/modules/catalog/catalog-public.service.ts`
- `src/server/modules/customers/customer-query.service.ts`

### Required changes

- Whitelist sortable fields and directions in admin list pages.
- Escape or normalize free-text search before interpolating into Supabase filters.
- Stop using `supabaseAdmin` directly in public catalog pages.
- Explicitly filter public offers and brands by active/published status.
- Decide whether the in-memory rate limiter is acceptable for launch; if not, replace it with a shared store.

### Done when

- Admin list pages cannot break from malformed query params.
- Public pages only use public-safe reads.
- Publication status is enforced in one place, not remembered ad hoc.

## Suggested Delivery Sequence

1. Phase 0
2. Phase 1
3. Phase 2
4. Phase 3
5. Phase 4
6. Phase 5

Do not start the architecture move before Phases 0-2 are stable in production-like conditions.
