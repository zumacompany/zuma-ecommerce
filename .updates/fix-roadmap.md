# Zuma Fix Roadmap

This roadmap is designed for the current repo, not an idealized rewrite. Each phase lists the exact files to change first, then the files to create if extraction is worth doing.

Note:

- early phase file lists reference the pre-architecture route group `app/(storefront)/*`
- the current repo now uses `app/(public)/*`, `app/(customer-auth)/*`, and `app/(customer)/*`
- checkout UI files also moved from root-level `components/*` into `components/storefront/checkout/*`

## Current Critical Blockers

A flow audit on 2026-04-30 found three blockers that prevent the three primary user flows (admin, guest storefront, registered storefront) from running end-to-end. These are repeated inside the relevant phases below; this section exists so the priority is visible at the top of the doc.

1. **Guest funnel has no working bridge from home to checkout.** `/browse`, `/b/[brandSlug]`, and `/c/[categorySlug]` exist as empty directories under `app/(public)/` with no `page.tsx`. Every "view all", brand-card, and category-card link on the homepage 404s. Checkout itself works, but only if a visitor is sent there with a valid `?offerId=`. Tracked in Phase 1 (link cleanup) and **Phase 7 (catalog pipeline restoration)**.
2. **Two of four customer sidebar items 404.** `app/(customer)/cliente/perfil/` and `app/(customer)/cliente/pontos/` are empty directories. `CustomerNav` links to both. Tracked in Phase 1.
3. **Footer legal/info links 404.** `/about`, `/refunds`, `/privacy`, `/cookies`, `/faq` directories exist under `app/(public)/` but contain no `page.tsx`. Tracked in Phase 1.

Lower-severity loose ends from the same audit:

- Checkout does not pre-fill profile data for logged-in customers (Phase 2).
- Order success does not prompt the guest to create an account, even though `link_guest_orders_to_account` exists and would attach the order on later signup (Phase 2).
- Customer dashboard composes data with three browser-side `supabase.rpc(...)` calls, which the target architecture forbids (Phase 6 — extract `order-customer.service.ts`).
- Admin password-reset redirect target may not be configured in Supabase (Phase 4).

## Phase 0: Stop Public Data Leaks And Unsafe Order Mutations — DONE (2026-05-01)

### Goal

Remove the pre-launch security blockers in the order success and handoff flow.

### Status

All "done when" criteria are satisfied. Public order success is gated by an HMAC-signed access token (`order-access.policy.ts`); the legacy `[orderNumber]/success` route is deleted; `markOrderHandoff` was removed in favour of `markPublicOrderHandoff` reached only via `/api/orders/[accessToken]/handoff`; `createPublicOrder` is the single public write entrypoint and runs behind an IP rate limit.

### What is in the repo today

- `src/server/modules/orders/order-public.service.ts` — `getPublicOrderSuccessData`, `markPublicOrderHandoff`, `createPublicOrderAccess`. Token verified before any DB read or mutation; mutation is idempotent (no-op once `on_hold` or terminal).
- `src/server/modules/orders/order-public.schemas.ts` — token payload zod schema, 30-day TTL, version field.
- `src/server/modules/orders/order-access.policy.ts` — HMAC-SHA256 sign / verify with `timingSafeEqual`, base64url segments.
- `app/(public)/order/[accessToken]/success/page.tsx` — only public success route; calls `getPublicOrderSuccessData(accessToken)` and renders 404 on `UnauthorizedError` / `NotFoundError`.
- `app/api/orders/[accessToken]/handoff/route.ts` — accepts only the signed token; the legacy `[orderId]/handoff` route is gone.
- `app/api/orders/route.ts` — only `createPublicOrder`; admin order creation lives at `app/api/admin/orders/route.ts` behind `requireAdmin`.
- `components/storefront/checkout/OrderSuccessActions.tsx` — validates the WhatsApp target (>= 8 digits) **before** opening the popup or POSTing to handoff.

### 2026-05-01 closing edits

- Tightened `OrderSuccessActions` so a malformed `whatsappNumber` (empty, too short) fails before the popup or handoff POST. Previously only the empty-string case was caught.
- Deleted the empty legacy `app/(public)/order/[orderNumber]/success/` route group (dead code; superseded by `[accessToken]/success`).
- Fixed `createSupabaseServerSessionClient` to `await cookies()` (Next 16 made it async). Without this, every customer-session authz check would have crashed at runtime — load-bearing for any future Phase that gates on a logged-in customer rather than a token.

### Out-of-scope deferrals

- `lib/supabase/server.ts`'s `supabaseAdmin` proxy still has one caller in `lib/home-data.ts` (public catalog read on the homepage). That is a Phase 5 boundary fix, not Phase 0.
- `order-admin.service.ts` functions rely on the `requireAdmin` check at the route layer rather than re-running it inside the service. Defense-in-depth could push the check down, but every caller today is a route already gated; not a Phase 0 leak.

### Done when (verified)

- An unknown visitor cannot open another customer's success page. ✅ — only `/order/[accessToken]/success` exists; access token is HMAC-signed.
- A guessed order number cannot change an order to `on_hold`. ✅ — handoff route is keyed by access token; `markPublicOrderHandoff` resolves the order id from the verified token.
- The only public order mutation path is authorized and auditable. ✅ — `createPublicOrder` (rate-limited) and `markPublicOrderHandoff` (token-gated, writes `order_status_history` + analytics).

## Phase 1: Remove Broken Navigation And Unify The Customer Entry Points — DONE (2026-05-01)

### Status

The customer sidebar reaches a real page on every item. The footer no longer links to non-existent legal pages. The homepage no longer routes brand or category clicks into 404s. The remaining empty directories (`/browse`, `/b/[brandSlug]`, `/c/[categorySlug]`) are explicitly Phase 7's responsibility.

### 2026-05-01 closing edits

- `components/Footer.tsx` — removed the entire "help" links block (`/about`, `/refunds`, `/privacy`, `/cookies`, `/faq`). When Phase 4 ships the legal pages, restore the block; the unused `next/link` import was also dropped.
- `components/customer/CustomerShell.tsx` — added a `SHIPPED_CUSTOMER_ROUTES` Set adjacent to the nav array; nav items are filtered by it before rendering. All four routes are shipped today; the guard is defensive against future regressions.
- `components/FeaturedBrandsClient.tsx` — brand cards no longer link to `/b/[brandSlug]` (Phase 7 will restore); the "view all → `/browse`" link is removed; cards remain visually present so the homepage doesn't go barren. Phase 7 should restore the `<Link>` wrapper and "view all".
- `components/CategoryRowsClient.tsx` — same treatment for category headers (`/c/[slug]`) and nested brand cards (`/b/[slug]`). Phase 7 restores both.
- `components/storefront/checkout/CheckoutSuccess.tsx`, `app/(customer)/cliente/dashboard/page.tsx`, `app/(customer)/cliente/pedidos/page.tsx`, `app/(customer)/cliente/pedidos/[orderId]/page.tsx` — empty-state CTAs that pointed at `/browse` now point at `/`. Revisit when Phase 7 ships.
- Deleted empty directories `app/(public)/about`, `/refunds`, `/privacy`, `/cookies`, `/faq`, `/notes`. Phase 4 (or whichever phase ships legal copy) recreates whichever ones it actually wants.
- Created `app/(customer)/cliente/perfil/page.tsx` — reads via `get_customer_by_auth_user`, allows edit of name, whatsapp_e164, country, province, city through the `customers_update_own_profile` RLS policy (`auth.uid() = auth_user_id`). No new RPC needed.
- Created `app/(customer)/cliente/pontos/page.tsx` — reads loyalty_points from the same RPC, shows a balance card and a stub for transaction history. The "real ledger" referenced in the original Phase 1 brief does not exist yet; the stub is the agreed temporary state.
- Added new i18n keys under `customer.*` in `messages/pt.json` and `messages/en.json`: `profileSubtitle`, `profilePersonalInfo`, `profileSaveButton`, `profileSaved`, `profileNotFound`, `pointsBalance`, `pointsSubtitle`, `pointsHowToEarnTitle`, `pointsHowToEarnBody`, `pointsHistoryEmpty`. Field labels for the profile form reuse existing `checkout.*` keys (`fullName`, `country`, `province`, `city`); "WhatsApp" is hardcoded since it is identical in both locales.

### Out-of-scope deferrals

- `components/FeaturedProductsClient.tsx` and `components/HomeSectionsClient.tsx` are untouched — `grep` confirms neither has any importer in the repo today, so their broken `/browse` and `/b/[slug]` links cannot reach a user. Phase 7 either wires them up or deletes them.
- `app/(public)/browse/`, `/b/[brandSlug]/`, `/c/[categorySlug]/` remain on disk as empty directories because Phase 7 owns populating them.
- Profile editor does not let the user change `email` or `birthdate` — the original Phase 1 brief listed only name/whatsapp/province/city. Bring those into a future phase if needed.
- Pontos page has no real transaction history; the historical ledger is not built yet. Stub message is shown.

### Done when (verified)

- `find app/(public) app/(customer) -type d` yields no empty directories outside Phase 7's scope. ✅
- Every link in `Header.tsx`, `Footer.tsx`, `CustomerShell.tsx`, `FeaturedBrandsClient.tsx`, `CategoryRowsClient.tsx` resolves to a real route or has been removed. ✅
- Manual click-through of the customer sidebar reaches a real page on every item. ✅ (dashboard, pedidos, perfil, pontos all render).
- `/cliente/login` continues to render without dashboard chrome. ✅ (untouched).
- Unauthenticated `/cliente/*` traffic still redirects to `/cliente/login` via `lib/supabase/middleware.ts:111-129`. ✅ (verified, no edits needed).

### Goal (reference, original)

Stop sending users into dead ends. The 2026-04-30 audit confirmed that `(public)` and `(customer)/cliente/*` contain empty directories that match the targets of live nav links — every empty folder produces a 404 at runtime.

Already done:

- `app/(customer)/cliente/recuperar-senha/page.tsx` exists.
- `app/(customer)/cliente/pedidos/[orderId]/page.tsx` exists.
- `Header.tsx` account icon already routes to `/admin`, `/cliente/dashboard`, or `/cliente/login` based on session.
- `/cliente/login` renders inside `(customer-auth)` and uses `CustomerAuthShell` instead of the dashboard chrome.

### Current files to change

- `components/FeaturedBrandsClient.tsx` — `"view all"` href is `/browse` (line 21); brand card href is `/b/${slug}` (line 32).
- `components/FeaturedProductsClient.tsx` — `"view all"` href is `/browse` (line 54); product card href is `/b/${slug}` (line 61).
- `components/CategoryRowsClient.tsx` — category href `/c/${slug}` (line 53), brand href `/b/${slug}` (line 65).
- `components/Footer.tsx` — links `/about`, `/refunds`, `/privacy`, `/cookies`, `/faq` (lines 59–63).
- `components/customer/CustomerShell.tsx` — sidebar items `/cliente/pontos` and `/cliente/perfil` (lines 22–23).

### Empty directories to either populate or delete

These exist in the tree today and are why the links 404. Each one needs a decision: ship a `page.tsx` or remove the directory.

- `app/(public)/about/`
- `app/(public)/refunds/`
- `app/(public)/privacy/`
- `app/(public)/cookies/`
- `app/(public)/faq/`
- `app/(public)/notes/`
- `app/(public)/browse/` — covered by Phase 7.
- `app/(public)/b/[brandSlug]/` — covered by Phase 7.
- `app/(public)/c/[categorySlug]/` — covered by Phase 7.
- `app/(public)/order/[orderNumber]/success/` — superseded by `[accessToken]/success`; delete.
- `app/(customer)/cliente/perfil/`
- `app/(customer)/cliente/pontos/`

### New files to create

- `app/(customer)/cliente/perfil/page.tsx` — read auth user + customer record, allow edit of name/whatsapp/province/city.
- `app/(customer)/cliente/pontos/page.tsx` — show loyalty balance and history; can be a stub that reads `customers.loyalty_points` until a real ledger exists.
- One of: a single `app/(public)/[legalSlug]/page.tsx` MDX-backed route OR five tiny static pages — pick whichever matches the Phase 4 settings/content decision.

### Required changes

- Implement or delete each empty directory listed above. Default action when in doubt: delete the directory and remove the link from the source component until the page exists.
- Footer (`Footer.tsx`): if not implementing legal pages this sprint, comment out or hide the five links and surface them again only when the routes ship.
- `CustomerShell.tsx`: do not render `pontos` and `perfil` nav items until those `page.tsx` files exist. A guard like `items.filter((i) => SHIPPED_CUSTOMER_ROUTES.includes(i.href))` is enough — keep the array of shipped routes adjacent to the route definitions.
- Featured/Category links to `/browse`, `/b/...`, `/c/...` are addressed in Phase 7; until Phase 7 lands, these cards either need to go straight to `/checkout?offerId=...` or be hidden.
- Confirm `lib/supabase/middleware.ts:111-129` still redirects unauthenticated `/cliente/*` traffic to `/cliente/login` after the new pages land.

### Done when

- A `find` in `app/(public)` and `app/(customer)` returns no directory without a `page.tsx`, OR every such directory is intentional (e.g. dynamic-only segment with a child).
- Every link in `Header.tsx`, `Footer.tsx`, `CustomerShell.tsx`, `FeaturedBrandsClient.tsx`, `FeaturedProductsClient.tsx`, and `CategoryRowsClient.tsx` resolves to a real route or is removed.
- A manual click-through of the customer sidebar reaches a real page on every item.
- `/cliente/login` continues to render without dashboard chrome (regression check, since this currently works).

## Phase 2: Make Checkout And Post-Purchase One Coherent Flow — DONE (2026-05-01)

### Status

The two genuinely user-facing gaps in this phase — checkout pre-fill for returning customers, and the post-purchase register CTA for guests — are both shipped. Several other roadmap items in this phase were already true in the repo before today.

### Already-true items (verified, no edit needed)

- **No duplicate summary on the checkout page.** `app/(public)/checkout/page.tsx` renders `<CheckoutShell><CheckoutClient/></CheckoutShell>` and nothing else; `CheckoutClient` itself renders `<CheckoutSummary>` exactly once. The "duplicate summary block from `checkout/page.tsx`" the roadmap referenced no longer exists.
- **No 6-second artificial success delay.** `CheckoutClient.submit` calls `window.location.assign(successPath)` immediately after the order POST resolves. Grep for `setTimeout` / `await new Promise.*setTimeout` / `6000` in the checkout flow returns no hits.
- **One canonical post-purchase route.** Phase 0 deleted the legacy `/order/[orderNumber]/success/`. Only `/order/[accessToken]/success/` exists today, and it always renders `CheckoutSuccess`.
- **WhatsApp number resolves through one server-side service.** `getPublicWhatsappNumber()` and `getPublicSiteContent()` both delegate to `src/server/modules/content/public-site-content.service.ts`, which prefers `site_content.whatsapp_number` and falls back to `home_content.whatsapp_number`. Both the success page and the footer read through this path.
- **No "Gift Card 15 MZN" mislabel pattern in the codebase.** `CheckoutClient` builds the denomination label from the offer's own `denomination_currency` + `denomination_value`. The price label is formatted separately in the order's payment currency. Grep for `Gift Card` returns only an unrelated marketing meta description and an admin email subject.

### 2026-05-01 closing edits

- `components/storefront/checkout/CheckoutClient.tsx` — wired `useAuth` and a one-shot prefill effect that calls `get_customer_by_auth_user` once auth resolves. When the customer record loads, name, email, whatsapp (with `+258` prefix stripped to match the form), province, city, and birthdate are populated only into fields the user hasn't already touched. `user.email` is used as a fallback when the customer record exists but has no email. `prefilled` flag prevents re-running.
- `components/storefront/checkout/CheckoutSuccess.tsx` — added a `showRegisterCta = !authLoading && !user` guard, a `buildRegisterPrefill()` that base64-encodes `{email, whatsapp, name}` from the order, and a styled CTA card linking to `/cliente/login?mode=register&prefill=<base64>`. Logged-in customers see the same success page minus the CTA.
- `app/(customer-auth)/cliente/login/page.tsx` — initial `useEffect` now reads `mode=register` (sets the tab) and `prefill=<base64>` from the URL, decodes the JSON payload, strips the `+258` prefix from any incoming WhatsApp value, and seeds the form state. Unfilled values are left untouched, so a user who lands on `?mode=register&prefill=...` and then types something does not get their input clobbered.
- `components/BrandOffersClient.tsx` — the three hardcoded `currency: "MZN"` literals now use `APP_CONFIG.DEFAULT_CURRENCY`. The page that renders this component does not exist yet (Phase 7 will populate `app/(public)/b/[brandSlug]/`), so this is preventive — but the roadmap explicitly listed the file.
- Added i18n keys to `messages/pt.json` and `messages/en.json`: `customer.saveOrderTitle`, `customer.saveOrderSubtitle`. The CTA button itself reuses the existing `customer.createAccount` key.

### Out-of-scope deferrals

- `components/storefront/checkout/CheckoutOrderSummary.tsx` and `components/FeaturedProductsClient.tsx` both have hardcoded `MZN` literals, but `grep` confirms neither has any importer in the repo today. Phase 6 (legacy / Manager-pair cleanup) deletes or unifies those components — fixing the literals would just freeze dead code in place.
- The `link_guest_orders_to_account` RPC is only called in `handleRegister`. The new `?prefill=` flow lands the guest on the register tab with their order's email/whatsapp pre-filled, so the existing RPC call links the guest order to the new account exactly as the roadmap intended. No service-layer changes were needed.

### Done when (verified)

- Checkout shows one summary only. ✅ (was already true; verified by `grep CheckoutSummary` in checkout files).
- Totals, denomination labels, and currencies match the selected offer. ✅ (denomination uses offer's own currency; payment-currency formatting now reads `APP_CONFIG.DEFAULT_CURRENCY` everywhere on the storefront).
- Success, handoff, and WhatsApp behavior are identical regardless of entry path. ✅ (single canonical success page since Phase 0).
- A logged-in customer placing a second order does not retype name, email, WhatsApp, province, city, or birthdate. ✅ (one-shot prefill from `get_customer_by_auth_user` once `authLoading` resolves).
- The guest success page shows a register CTA, and following it lands on the register tab with the order's contact data prefilled. ✅ (register-mode tab + decoded prefill payload + WhatsApp prefix-stripped to match the form).

### Goal (reference, original)

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
- **Pre-fill checkout for logged-in customers.** `components/storefront/checkout/CheckoutClient.tsx` does not currently import `useAuth` or any session context, so a returning customer retypes name, email, WhatsApp, province, city, and birthdate on every order. Wire `useAuth` (or the same RPC the dashboard uses, `get_customer_by_auth_user`) into `CheckoutClient`'s initial state, and skip prompting for fields the customer record already provides. Keep all fields editable.
- **Add a post-purchase register prompt for guests.** The system already supports linking guest orders to a new account via `link_guest_orders_to_account` (called from `app/(customer-auth)/cliente/login/page.tsx:79`), but `CheckoutSuccess` never tells the guest this is possible. Add a "Save your order to a new account" CTA on `components/storefront/checkout/CheckoutSuccess.tsx` that links to `/cliente/login?mode=register&prefill=...` with the order's email/whatsapp prefilled.
- Update `cliente/login/page.tsx` to honor `mode` and `prefill` query params so the CTA above lands directly on the register tab with fields already filled.

### Done when

- Checkout shows one summary only.
- Totals, denomination labels, and currencies match the selected offer.
- Success, handoff, and WhatsApp behavior are identical regardless of entry path.
- A logged-in customer placing a second order does not retype name, email, WhatsApp, province, or city.
- The guest success page shows a register CTA, and following it lands on the register tab with the order's contact data prefilled.

## Phase 3: Normalize Statuses, Customer Metrics, And Admin Reliability — DONE (2026-05-01)

### Status

The order-status pipeline was already centralized before this pass: a single `ORDER_STATUSES` enum, a real `z.enum(...)` schema with alias coercion, and shared mapper helpers consumed by both admin and customer UIs. Phase 3's outstanding work was the small set of admin "shortcut" patterns — a `mailto:` handoff and a stray `alert()` — plus drift safety on two hardcoded `'delivered'` query literals.

### Already-true items (verified, no edit needed)

- **Single canonical status set.** `src/server/modules/orders/order-status.ts` exports `ORDER_STATUSES = ['new','pending','on_hold','processing','shipped','delivered','canceled']`, plus typed `ORDER_OPEN_STATUSES`, `ORDER_TERMINAL_STATUSES`, `ORDER_QUEUE_STATUSES`.
- **Real enum validation.** `OrderStatusInputSchema = z.string().trim().min(1).transform(coerceOrderStatusInput).pipe(z.enum(ORDER_STATUSES))`. The `.min(1)` is the first stage of the pipeline, not the validator — every status update flows through the alias-coercing transform and then the enum.
- **`canceled`/`cancelled` drift handled centrally.** `ORDER_STATUS_ALIASES = { cancelled: 'canceled' }` in `order-status.ts`; `coerceOrderStatusInput` applies it before the enum check. No UI page does ad-hoc normalization.
- **Same status mapping in every consumer.** Admin uses `OrderStatusSelect` which imports from `order-status.ts`/`order-status.mapper.ts`. Customer dashboard, orders list, and order detail all import `normalizeOrderStatus` and `getStatusColor`/`getStatusLabel` (the latter from the legacy `lib/orderStatus.ts` shim, which delegates to the modular helpers).
- **`formatRelativeTime` already takes a locale.** `lib/formatRelativeTime.ts` has signature `formatRelativeTime(value, locale?)`; default is `undefined` (browser default), not `pt-BR`. `resolveRelativeTimeLocale` maps `'pt' → 'pt-MZ'` (Mozambique), and customer pages already pass it through. Grep confirms `pt-BR` is only in the HTML `<html lang>` attribute.
- **`OrdersTable` and `OrderDelivery` do not use `alert()`/`confirm()`.** Both use managed feedback state. `OrdersTable` uses `ConfirmationModal` for destructive actions.

### 2026-05-01 closing edits

- `components/admin/OrderDelivery.tsx` — replaced the `mailto:` handoff in `handleSendEmail` with a clipboard write of `To/Subject/Body`. The existing `persistChanges` call still records the timestamped action note, so the audit trail is unchanged. Feedback message now tells the admin "Email content copied — paste into your mail client and send to {email}." Added `emailCopyFailed` copy for browsers without clipboard access (the action still saves; only the copy step fails).
- `components/admin/OrderActions.tsx` — replaced the `alert('Error deleting order')` fallback with inline `error` state. Errors render as a small red label adjacent to the action buttons; the modal stays usable. Server-side error messages now propagate (was previously discarded). The destructive `ConfirmationModal` was already in place.
- `app/admin/page.tsx` and `app/(customer)/cliente/dashboard/page.tsx` — typed `DELIVERED_STATUS: OrderStatus = 'delivered'` constant, swapped in for the bare `'delivered'` literal in both `.eq('status', ...)` queries. If a future enum change drops `'delivered'`, both queries fail TypeScript instead of silently returning empty result sets.

### Out-of-scope deferrals

- **Browser dialogs in admin Manager/Admin pairs** — `BrandsManager`/`BrandsAdmin`, `CategoriesManager`/`CategoriesAdmin`, `OffersManager`/`OffersAdmin`, `PaymentMethodsManager`/`PaymentMethodsAdmin`, `DigitalCodesManager`, and `SiteAdmin` all still call `alert()`/`confirm()`. These are catalog/CMS surfaces, not order fulfillment, and Phase 6 is queued to collapse each duplicate pair into one canonical component. Patching dialogs in both halves of each pair would freeze dead code in place; defer to Phase 6.
- **WhatsApp `wa.me/...` window.open in `OrderDelivery`** — kept as-is. This is the actual delivery channel for codes, not an admin "shortcut" to replace.
- **DB-level enum constraint on `orders.status`** — the canonical enum lives only in the application layer today. The audit's recommendation to add a Postgres `enum` type and migrate existing rows is bigger than Phase 3 scope and would require a coordinated migration; leave as a Phase 6 candidate alongside the enum-drift reconciliation noted there.

### Done when (verified)

- Admin and customer UIs show the same status names and colors. ✅ — both consume `getOrderStatusBadgeClass` and `getOrderStatusLabel` from the same mapper.
- No page needs ad hoc status normalization. ✅ — every page that reads RPC status calls `normalizeOrderStatus` once at the boundary; nothing compares `'cancelled'` or any non-canonical literal.
- Admin actions fail inline and predictably instead of via browser dialogs. ✅ — order-fulfillment paths (delivery email, order delete) now surface errors and progress in the UI; the broader admin manager surfaces still have legacy dialogs that Phase 6 owns.

### Goal (reference, original)

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

## Phase 4: Fix Settings Drift And Missing Admin Copy — DONE (2026-05-01)

### Status

Most of Phase 4 was already true in the repo: the currency dropdown is already disabled with only `MZN`, the language list already matches `i18n.SUPPORTED_LOCALES = ['pt','en']`, the admin reset-password page already exists with a matching `redirectTo`, and the `admin.users.*` / `admin.settings.*` / `admin.site.*` translation namespaces are populated in both `pt.json` and `en.json`. The actual gaps were the unguarded `Promise.all` in the admin site snapshot loader and the missing forgot-password trigger on `/admin/login`.

### Already-true items (verified, no edit needed)

- **Currency dropdown is gated to MZN.** `components/admin/GlobalSettingsPageUI.tsx` renders the currency `SelectField` with `disabled` and a single `MZN` option, plus a `currencyLockedHint` copy line. `SITE_CURRENCIES = ['MZN']` in `src/server/modules/content/site-settings.schema.ts` enforces this server-side.
- **Language dropdown matches runtime.** Same UI shows only `pt`/`en`. `lib/i18n.tsx` has `SUPPORTED_LOCALES = ['pt','en']`. `components/LanguageSwitcher.tsx` imports the same constant.
- **`admin.users.*` keys present.** `messages/pt.json` and `messages/en.json` both have the full `admin.users` namespace (`title`, `subtitle`, `createNew`, `email`, `password`, `passwordHint`, `create`, `createdAt`, `lastSignIn`, `never`, `noUsers`, `successCreate`). `app/admin/users/page.tsx` only references keys in this list.
- **Reset-password page exists and the redirect target matches.** `app/admin/reset-password/page.tsx` listens for the Supabase `PASSWORD_RECOVERY` event and calls `supabase.auth.updateUser({ password })`. The trigger from `GlobalSettingsPageUI` already passes `redirectTo: ${origin}/admin/reset-password`.
- **`site_content` and `home_content` are not overlapping.** `site_content` is a generic key-value table for tunable settings (currency, language, contact email/whatsapp, admin profile name/title). `home_content` is a typed singleton (`id=1`) for page content (hero title/subtitle/banner, section titles, whatsapp_number). They serve different purposes; the schema is intentional.
- **`SiteAdmin` client uses `Promise.allSettled` already.** The hang concern was actually in the server-side `getAdminSiteSnapshot` (see edits below).
- **`site-settings.schema.ts`, `site-settings.mapper.ts`, `home-content.service.ts` exist** as the roadmap asked.

### 2026-05-01 closing edits

- `src/server/modules/content/home-content.service.ts` — replaced `Promise.all([...6 queries])` in `getAdminSiteSnapshot` with `Promise.allSettled`. Each row is unwrapped through a new `unwrapQuery` helper that returns `null` on rejection or Postgrest error, pushes a labelled message into a `failures` array, and lets the rest of the snapshot succeed. The function now returns `{ data, partial, failures }` so the route can surface partial-load state without hanging or 500-ing the entire admin settings page if a single table errors. `console.error` logs the failure list for ops visibility. The shape of `data` is unchanged, so `app/api/admin/site/route.ts` (the only caller) and `SiteAdmin` keep working.
- `app/admin/login/page.tsx` — added an inline "Forgot password?" toggle on the login form. Clicking it reveals an email input + send button; submitting calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: ${origin}/admin/reset-password })` (matching the trigger in `GlobalSettingsPageUI`) and shows a neutral "If an admin account matches this email, a reset link has been sent" success message regardless of whether the email exists, so the form does not double as an account-enumeration oracle. Inline error feedback for the supabase client error path.

### Out-of-scope deferrals

- **i18n strings on `/admin/login`** — the new "Forgot password?" copy is hardcoded English. The whole page is currently mostly hardcoded English; switching to `t(...)` is broader Phase 4-cleanup-style work that touches the rest of the form. Defer to a follow-up if/when the admin UI gets a localization pass.
- **Locale tag mapping `'pt' → 'pt-MZ'`** — currently scattered as `locale === 'pt' ? 'pt-MZ' : 'en-US'` in several admin components. The Phase 3 audit flagged this; centralizing it is a small but cross-cutting change. Not on Phase 4's done-when criteria.
- **Account-enumeration hardening on the customer-side login** (`/cliente/login`) — the customer flow already routes forgot-password through a separate `/cliente/recuperar-senha` page (verified in Phase 1). Out of scope here.

### Done when (verified)

- Admin settings do not offer fake capabilities. ✅ — currency is hard-locked to `MZN`; language is `pt`/`en` only.
- Admin users page builds cleanly with no missing i18n keys. ✅ — every `t('admin.users.*')` call in `app/admin/users/page.tsx` resolves to a present key in both locales.
- Site settings and home settings have a single clear ownership model. ✅ — documented above; `site_content` is the generic settings KV, `home_content` is the typed page-content singleton.

### Goal (reference, original)

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
- Fix the admin password reset redirect: `app/admin/reset-password/page.tsx` already exists, so the remaining work is to confirm the Supabase project's "Reset password redirect URL" points at `${SITE_URL}/admin/reset-password`. Check Supabase dashboard → Authentication → URL Configuration. Also verify the trigger from `/admin/login` (the "forgot password" link) calls `supabase.auth.resetPasswordForEmail` with a matching `redirectTo`.
- Add error handling to the `SiteAdmin` initial `Promise.all` load so the page cannot hang forever.
- Decide whether `site_content` remains key-value or is replaced by typed singleton content tables; do not keep both vague and overlapping.

### Done when

- Admin settings do not offer fake capabilities.
- Admin users page builds cleanly with no missing i18n keys.
- Site settings and home settings have a single clear ownership model.

## Phase 5: Harden Query Building And Public/Admin Data Boundaries — DONE (2026-05-02)

### Status

Admin list pages no longer accept arbitrary sort columns or unbounded page values; the free-text search input is escaped before it hits Postgrest's `.or(...)` syntax. The public checkout page reads through a new `catalog-public.service.ts` that bakes the publication filter into the query layer instead of leaving it to caller discipline. Featured-brands and homepage data both filter by `status='active'` at the DB instead of in JS.

### 2026-05-02 closing edits

- New `src/server/http/query-params.ts` exporting `parseSort`, `parseDirection`, `parsePage`, `parseEnumParam`, `escapeIlike`, and a convenience `parseListParams<F>(searchParams, { allowedSort, defaultSort, defaultDir, maxPage })`. `escapeIlike` strips the Postgrest `.or()` delimiters (`(` `)` `,` `.`) and escapes ILIKE wildcards (`%` `_` `\`), so any `q` value is safe to interpolate.
- New `src/server/modules/catalog/catalog-public.service.ts` exporting `getActivePublicOfferById`, `listActivePublicPaymentMethods`, `listActivePublicBrands`, `listActivePublicBrandsBySlug`, and `listPublicCategories`. Each function applies `.eq('status', 'active')` (where the table has a status column) at the query layer so callers cannot forget. Phase 7's brand/category/browse pages will consume this service instead of going to `supabaseAdmin` directly.
- `app/admin/orders/page.tsx` — sort and direction now go through `parseListParams` with an explicit `ORDERS_SORT_FIELDS` whitelist (`created_at`, `order_number`, `customer_name`, `customer_email`, `status`, `total_amount`); page is bounded; `q` is `escapeIlike`-cleaned before being interpolated into the `.or(...)` filter. A malformed `?sort=...` or `?dir=...` falls back to the default instead of failing the query.
- `app/admin/customers/page.tsx` — same treatment; `CUSTOMERS_SORT_FIELDS` whitelists allowed sort columns; `?status=` is validated through `parseEnumParam(['active', 'inactive'])` instead of letting the URL string flow into `.eq('status', ...)`.
- `app/(public)/checkout/page.tsx` — replaced the two `supabaseAdmin` calls with `getActivePublicOfferById(offerId)` and `listActivePublicPaymentMethods()`. The offer query now filters by `status='active'`, so a publicly-shareable URL with an inactive/draft offer ID returns the same "Esta oferta já não está disponível" message as a missing offer, instead of leaking the inactive record. Both reads run in parallel via `Promise.all`; a per-call `try/catch` around them surfaces a single error message rather than two divergent error states.
- `app/api/featured-brands/route.ts` — added `.eq('status', 'active')` to the brand-by-slug join. Featured slugs that point at a since-deactivated brand now silently drop instead of rendering an inactive logo on the homepage.
- `lib/home-data.ts` — moved the active filter into the brands query (`.eq('status', 'active')`) and reduced the `activeBrands` step to a shape mapper. The featured-brands lookup that reads from the same `brands` array now correctly drops inactive featured brands without a separate JS pass.

### Out-of-scope deferrals

- **Rate limiter (`lib/api/rate-limit.ts`)** — the in-memory implementation is per-instance and won't enforce limits across multiple Vercel/serverless instances. Acceptable for the launch traffic profile (low concurrency, single region) but should be replaced with a Redis/KV-backed limiter (e.g. Upstash) before scaling. Documenting here rather than swapping now because the right replacement depends on the chosen deployment target, not the code.
- **`customer-query.service.ts`** — listed as "to create" in the original roadmap, but the only real surface that needs it is `app/admin/customers/page.tsx`, and that page now reads through `parseListParams` + a typed enum whitelist. Splitting one query into a service module would be ceremony without a payoff. If a second customer-search consumer appears, extract then.
- **`src/server/modules/customers/customer.service.ts`** unescaped `.or(...)` — the Phase 5 audit flagged a third raw-`q` site here. The function's caller (admin route) is already gated by `requireAdmin`, so this is admin-input-into-admin-query and not an injection surface for guests; still, it should reuse `escapeIlike` for consistency. Defer to a small follow-up since the file is on the Phase 6 cleanup list anyway.
- **`app/admin/offers/page.tsx`** raw `?status=...` — same admin/admin context as above; flagged but not load-bearing for the public boundary the roadmap focuses on.

### Done when (verified)

- Admin list pages cannot break from malformed query params. ✅ — `?sort=evil`, `?dir=anything`, `?page=-99` and `?status=foo` all fall back to defaults; `?q=foo,bar)%` is escaped before reaching Postgrest.
- Public pages only use public-safe reads. ✅ — `app/(public)/checkout/page.tsx` no longer imports `supabaseAdmin`; it reads through `catalog-public.service.ts`. The remaining `supabaseAdmin` users in `app/admin/*` are admin-side server components which is the intended audience.
- Publication status is enforced in one place, not remembered ad hoc. ✅ — `getActivePublicOfferById` / `listActivePublicPaymentMethods` / `listActivePublicBrands*` all bake `.eq('status', 'active')` into the query. The homepage and featured-brands API now also filter at the DB layer.

### Goal (reference, original)

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

## Phase 6: Close The Architecture Gaps — PARTIALLY DONE (2026-05-04)

### Status

The component layout is now consistent: `components/shared/` exists, the four shared utilities (`ErrorBoundary`, `LanguageSwitcher`, `Providers`, `ThemeToggle`) live there, and the eight storefront-only root components moved into `components/storefront/`. Each duplicate Manager/Admin admin-component pair is reduced to one canonical file, and five confirmed-dead components at the `components/` root were deleted. Three larger items (API audience grouping, the orders module's missing `order-customer.service.ts` / `order.repo.ts`, and the order-status enum reconciliation) are documented deferrals — none has a current consumer that would benefit, and each carries enough churn or migration scope that landing them now would freeze structure for no payoff.

### 2026-05-04 closing edits

- Deleted three legacy Admin/Manager pair losers, verified zero importers across `app/` `components/` `lib/` `src/`: `components/admin/BrandsAdmin.tsx`, `components/admin/CategoriesAdmin.tsx`, `components/admin/OffersAdmin.tsx`. `PaymentMethodsAdmin.tsx` is the canonical one in that pair (kept), and the corresponding `Manager` file is the dead one — naming is inconsistent with the other three pairs but matches the actual import in `PaymentMethodsPageUI.tsx`. Renaming would produce a cosmetic diff with no behavior change; flagged as a tiny follow-up but not a Phase 6 blocker.
- Deleted five confirmed-dead root components: `components/BrandOffersClient.tsx`, `components/CategoriesClient.tsx`, `components/CategoryViewAnalytics.tsx`, `components/FeaturedProductsClient.tsx`, `components/HomeSectionsClient.tsx`. Each had zero importers across the active source tree.
- Created `components/shared/` and moved four cross-experience components into it, rewiring every importer:
  - `ErrorBoundary.tsx` (used by root `app/layout.tsx`)
  - `LanguageSwitcher.tsx` (used by admin reset-password, customer shells, and the storefront header)
  - `Providers.tsx` (used by root `app/layout.tsx`)
  - `ThemeToggle.tsx` (same callers as `LanguageSwitcher` plus a unit test)
- Moved the nine storefront-only root components into `components/storefront/` and rewired importers:
  - `Header.tsx`, `Footer.tsx`, `BackButton.tsx`, `HeroClient.tsx`, `FaqClient.tsx`, `FeaturedBrandsClient.tsx`, `CategoryRowsClient.tsx`, `TrustPointsClient.tsx`, `PageAnalytics.tsx`. The `app/(public)/page.tsx` homepage and `components/storefront/StorefrontFrame.tsx` are the only callers post-move.
  - Fixed the relative-import depth shift inside the moved files (`../lib/i18n` → `../../lib/i18n`, etc.) — `tsc --noEmit` validated.

### Out-of-scope deferrals (with rationale)

- **`app/api/` audience grouping into `public/`, `customer/`, `admin/`** — the audit identified ten public top-level handlers that would migrate. Doing this safely means moving directories *and* updating every client `fetch('/api/...')` call site, which crosses many components. The handlers all already enforce the right auth (or no auth) at the route level via `withRoute` + `requireAdmin`, so there's no security gap left open by deferring. Defer until either a customer-only API surface emerges (which would force the issue) or the team is ready for the mechanical churn. No blocker.
- **`order-customer.service.ts`** — there is no current server-side consumer that needs it. Customer-side reads in the dashboard/orders pages call `supabase.rpc('get_customer_orders', ...)` from the browser through RLS, not through a server service. Creating an empty service file is ceremony. Build it the moment a customer-side server endpoint lands that needs ownership-checked reads or writes.
- **`order.repo.ts`** — extracting raw Supabase access from the four call sites in `order-public.service.ts` and `order-admin.service.ts` is mechanical refactoring with no observable benefit while the modules remain small. Revisit if a third call site appears or if the order tables get a non-trivial schema change.
- **`customer.policy.ts`** — same logic: the only ownership check the codebase uses today (`auth.uid() = auth_user_id`) lives in DB-level RLS policies on the `customers` table (Phase 1 audit confirmed). Nothing in the application layer currently reuses or composes that check, so a policy module would be empty.
- **`catalog-admin.service.ts` facade** — Phase 5 added `catalog-public.service.ts` because public reads needed a single place that bakes in the `status='active'` filter. The admin equivalents (`brand.service.ts`, `category.service.ts`, `offer.service.ts`, `region.service.ts`, etc.) already live in `src/server/modules/catalog/` and each route handler imports from the right one. Wrapping them in a facade adds a layer with no current consumer.
- **Order-status enum drift (`processing` / `shipped` / `pending` vs. `pending_payment`, `canceled` vs. `cancelled`)** — Phase 6 audit confirmed the enum ships seven values today; `processing` and `shipped` are defined but no `update` statement ever sets them. Reconciling means either pruning the enum + migrating any existing rows, or amending the target doc to match production. Either path requires a coordinated DB migration and is out of scope for a code-only Phase 6 pass. Carry forward as a separate decision item.
- **Three empty directories under `app/(public)/`** (`browse/`, `b/[brandSlug]/`, `c/[categorySlug]/`) — Phase 7 owns populating them. Phase 6's "no empty directories" target waits on Phase 7.

### Done when (verified)

- Each `Admin`/`Manager` admin-component pair is reduced to one file. ✅ — three legacy losers deleted; `PaymentMethodsAdmin` remains canonical for that pair.
- `components/shared/` exists. ✅
- Legacy flat layer in `components/` root is empty. ✅ — every remaining root entry under `components/` is a directory (`admin/`, `customer/`, `shared/`, `storefront/`, `ui/`, `__tests__/`); no flat `*.tsx` files remain.
- API audience grouping. ❌ Deferred (see above).
- Orders module has `order-customer.service.ts`, `order.repo.ts`, `order.service.ts` is gone. ❌ Deferred (see above).
- Order status enum matches the target vocabulary. ❌ Deferred (decision needed).
- `app/(public)/` contains no empty directories. ❌ Owned by Phase 7.

### Goal (reference, original)

Bring the repo into alignment with `target-architecture.md`. The "Already applied" claims in that doc are accurate; the items below are what is still divergent based on a current audit of `app/`, `components/`, and `src/server/modules/`.

### Empty `(public)` route folders

Folders exist under `app/(public)/` but contain no `page.tsx`, so the routes do not render:

- `app/(public)/about/`
- `app/(public)/browse/`
- `app/(public)/b/[brandSlug]/`
- `app/(public)/c/[categorySlug]/`
- `app/(public)/cookies/`
- `app/(public)/faq/`
- `app/(public)/notes/`
- `app/(public)/privacy/`
- `app/(public)/refunds/`
- `app/(public)/order/[orderNumber]/success/`

The only public pages currently rendering are `page.tsx`, `checkout/page.tsx`, and `order/[accessToken]/success/page.tsx`.

Required: either move the missing pages into these folders or remove the empty directories so the route group reflects what actually ships.

### Missing customer pages

`app/(customer)/cliente/perfil/` and `app/(customer)/cliente/pontos/` exist as empty directories. Phase 1 already lists them under "New files to create" — they remain unbuilt and the customer nav still links to them.

### API audience grouping not started

Target `§8` requires:

```text
app/api/
  public/
  customer/
  admin/
```

Current state: only `app/api/admin/` exists. The rest live at the top level mixing audiences:

- `app/api/orders/`
- `app/api/brands/`
- `app/api/categories/`
- `app/api/offers/`
- `app/api/site-content/`
- `app/api/analytics/`
- `app/api/featured-brands/`
- `app/api/featured-products/`
- `app/api/locations/`

Required: introduce `app/api/public/` and `app/api/customer/`, then move handlers into the correct audience folder. Each handler should authenticate (when needed), call one service, and return one normalized response shape.

### Duplicate admin component pairs still active

Target `§3` and `§11` call out removing legacy/new pairs. All four are still present together:

- `components/admin/BrandsAdmin.tsx` + `components/admin/BrandsManager.tsx`
- `components/admin/CategoriesAdmin.tsx` + `components/admin/CategoriesManager.tsx`
- `components/admin/OffersAdmin.tsx` + `components/admin/OffersManager.tsx`
- `components/admin/PaymentMethodsAdmin.tsx` + `components/admin/PaymentMethodsManager.tsx`

Required: pick the canonical one in each pair, migrate any remaining call sites, delete the loser.

### Orders module incomplete

Target `§4` lays out the per-domain shape (`*.schemas.ts`, `*.repo.ts`, `*-public.service.ts`, `*-customer.service.ts`, `*-admin.service.ts`, `*.policy.ts`).

Present in `src/server/modules/orders/`:

- `order-public.service.ts`, `order-public.schemas.ts`
- `order-admin.service.ts`
- `order-status.service.ts`, `order-status.ts`, `order-status.schema.ts`, `order-status.mapper.ts`
- `order-access.policy.ts`
- `order.service.ts` (legacy generic service)

Missing:

- `order-customer.service.ts` — the customer-side write path the target requires for the customer order handoff. Already flagged in `target-architecture.md` line 17 as pending.
- `order.repo.ts` — raw Supabase access is currently inline inside services.
- A non-public `order.schemas.ts` for shared domain contracts.

Required: extract a `order-customer.service.ts` for session-bound customer reads/writes, pull raw Supabase access into `order.repo.ts`, then delete `order.service.ts` once it has no callers.

### Order status enum drift

Target `§7` defines: `new`, `pending_payment`, `on_hold`, `delivered`, `cancelled`.

Actual `src/server/modules/orders/order-status.ts` defines: `new`, `pending`, `on_hold`, `processing`, `shipped`, `delivered`, `canceled`.

Differences:

- `pending` vs target `pending_payment`
- `canceled` vs target `cancelled`
- Extra `processing` and `shipped` not in the target vocabulary

Phase 3 already established the canonical schema files. The remaining work is to either update the target doc to match the production reality (if `processing`/`shipped` are real states the business uses) or migrate stored values + rename the enum members to match the target.

### `components/shared/` does not exist

Target `§3` shape:

```text
components/
  admin/
  customer/
  storefront/
  shared/
  ui/
```

Current: `admin/`, `customer/`, `storefront/`, `ui/` — plus a flat layer of legacy components at the `components/` root (`Header.tsx`, `Footer.tsx`, `HeroClient.tsx`, `FaqClient.tsx`, `FeaturedBrandsClient.tsx`, `CategoriesClient.tsx`, etc.) that the target shape would push under `storefront/` or `shared/`.

Required: create `components/shared/` and migrate the cross-experience components into it; move storefront-only ones (`Header`, `Footer`, `Hero*`, `Faq*`, `FeaturedBrands*`, `Categories*`, `Trust*`) into `components/storefront/`.

### Catalog and customers modules lack the per-domain shape

`src/server/modules/catalog/` contains only flat services (`brand.service.ts`, `category.service.ts`, `offer.service.ts`, `region.service.ts`, `digital-codes.service.ts`, `bulk-actions.service.ts`) — no `*.schemas.ts`, `*.repo.ts`, or `*.policy.ts`.

`src/server/modules/customers/` only has `customer.service.ts`.

Required where the audience boundary actually matters: split into `catalog-public.service.ts` (already planned in Phase 5) vs `catalog-admin.service.ts`, and add `customer.policy.ts` for ownership checks once `order-customer.service.ts` lands.

### Done when

- `app/(public)/` contains no empty directories.
- `app/api/` is grouped into `public/`, `customer/`, `admin/` with no top-level audience-mixed handlers.
- Each `Admin`/`Manager` admin-component pair is reduced to one file.
- The orders module has a `order-customer.service.ts`, a `order.repo.ts`, and `order.service.ts` is gone.
- The order status enum matches whichever vocabulary the target doc settles on.
- `components/shared/` exists and the legacy flat layer in `components/` root is empty.

## Phase 7: Restore The Public Catalog Pipeline — DONE (2026-05-04)

### Status

The guest funnel runs end-to-end. `/browse`, `/b/[brandSlug]`, and `/c/[categorySlug]` all render. The homepage's "view all" link, every featured brand card, and every category card now reach a real page. From the brand page, clicking any active offer lands the guest on `/checkout?offerId=...`. Every read goes through `catalog-public.service.ts`, which bakes the `status='active'` filter into the query layer (Phase 5 work), so no public page touches `supabaseAdmin` directly.

### 2026-05-04 closing edits

- `src/server/modules/catalog/catalog-public.service.ts` — extended with `getActivePublicBrandBySlug(slug)`, `listActivePublicOffersByBrandId(brandId)`, `getPublicCategoryBySlug(slug)`, and `listActivePublicBrandsByCategoryId(categoryId)`. Each applies the `status='active'` filter where the relevant table has the column. Phase 7's three new pages consume these exclusively.
- `app/(public)/browse/page.tsx` — server component listing every active brand grouped by category (uncategorized brands fall into a final "Outras marcas" section). Empty-state copy when no active brands exist. Links to `/b/[slug]` per brand and `/c/[slug]` per category.
- `app/(public)/b/[brandSlug]/page.tsx` — brand detail with offer grid. Calls `getActivePublicBrandBySlug` then `notFound()` from `next/navigation` if the brand doesn't exist or isn't active. Each offer card links to `/checkout?offerId=...` so the guest can complete the purchase. Empty-state when the brand has no active offers. Currency formatting uses `APP_CONFIG.DEFAULT_LOCALE` / `APP_CONFIG.DEFAULT_CURRENCY` (no hardcoded `MZN`).
- `app/(public)/c/[categorySlug]/page.tsx` — category detail listing the active brands in that category. `notFound()` when the slug is invalid. Each card links to `/b/[slug]`.
- `components/storefront/FeaturedBrandsClient.tsx` — restored the "view all → /browse" link in the section header and the per-card `<Link href={`/b/${b.slug}`}>` wrapper. Phase 1 had stripped both as a temporary measure; the restore comment is gone.
- `components/storefront/CategoryRowsClient.tsx` — restored the per-category "ver todos → /c/[slug]" header link and the per-brand `<Link href={`/b/${slug}`}>` wrappers. Reintroduced the `useI18n` import and `ArrowRight` icon that Phase 1 had stripped along with the links.
- Repointed customer-side "Start shopping" CTAs from the temporary `/` fallback (Phase 1) back to `/browse`: `app/(customer)/cliente/dashboard/page.tsx`, `app/(customer)/cliente/pedidos/page.tsx`, `app/(customer)/cliente/pedidos/[orderId]/page.tsx`, and `components/storefront/checkout/CheckoutSuccess.tsx`. The order-detail page's "browse" CTA also moves from `/` to `/browse`.

### Out-of-scope deferrals

- **Brand-page region selector** — the original (deleted) `BrandOffersClient` had a region picker. The new `b/[brandSlug]/page.tsx` lists all active offers for a brand without filtering by region. If the catalog grows enough that a single brand has offers across many regions, add a `region_code` filter to `listActivePublicOffersByBrandId` and a region tab UI. Today every offer also exposes its `region_code` on the card label.
- **Pagination on `/browse`** — pages render every active brand. Acceptable for the current catalog size; revisit if the count grows past ~100.
- **`FeaturedProductsClient`** — Phase 6 deleted this dead component. Phase 7 does not resurrect it; the homepage now shows brands and categories only. If a featured-products row is desired, build it fresh on top of `catalog-public.service.ts`.

### Done when (verified)

- A guest can land on `/`, click any "view all", brand card, or category card, and reach a working page that lists offers. ✅ — `/browse` lists every active brand grouped by category; brand cards link to `/b/[slug]`; category headers link to `/c/[slug]`.
- A guest can click an offer on a brand or category page and land on `/checkout?offerId=...` without 404s in between. ✅ — verified via the `b/[brandSlug]` page rendering `<Link href={`/checkout?offerId=...`}>` on every active offer.
- No public catalog page reads through `supabaseAdmin`; all reads go through `catalog-public.service.ts`. ✅ — `tsc --noEmit` clean; the three new pages import only from the service.
- `find app/(public) -type d -empty` returns nothing. ✅ — no empty directories remain under the public route group.

### Goal (reference, original)

Make the guest funnel end-to-end navigable. Today the homepage links to `/browse`, `/b/[brandSlug]`, and `/c/[categorySlug]`, but those directories under `app/(public)/` are empty — there is no `page.tsx` for any of them. The result is that a visitor who clicks any "view all", brand card, or category tile lands on a 404. Checkout works in isolation but cannot be reached without a hand-crafted `?offerId=` query string.

This is the single largest blocker to the guest flow running end-to-end. It deserves its own phase rather than being absorbed into Phase 1 link cleanup.

### Empty directories that need pages

- `app/(public)/browse/`
- `app/(public)/b/[brandSlug]/`
- `app/(public)/c/[categorySlug]/`

Possibly also:

- `app/(public)/order/[orderNumber]/success/` — superseded by `[accessToken]/success/`. Delete instead of populating.

### Current files to change

- `components/FeaturedBrandsClient.tsx` — depends on `/browse` and `/b/[slug]` working.
- `components/FeaturedProductsClient.tsx` — same.
- `components/CategoryRowsClient.tsx` — depends on `/c/[slug]` and `/b/[slug]`.
- `components/BrandOffersClient.tsx` — likely the offers grid that lives on a brand page; verify it is still imported anywhere after Phase 7 lands.
- `app/(public)/checkout/page.tsx` — its `supabaseAdmin.from("offers")...` read should move into the public catalog service Phase 5 introduces.

### New files to create

- `app/(public)/browse/page.tsx` — list of active brands and/or featured offers; pure server component.
- `app/(public)/b/[brandSlug]/page.tsx` — brand detail with offers grid; uses `BrandOffersClient`.
- `app/(public)/c/[categorySlug]/page.tsx` — category detail with brand list (or offer list, depending on how the merchandising works).
- `src/server/modules/catalog/catalog-public.service.ts` — the read functions these three pages call. Phase 5 already calls this service out as needed; Phase 7 is the page-side that consumes it.

### Required changes

- All three new pages must read through `catalog-public.service.ts` (not `supabaseAdmin` directly), to satisfy the target architecture's public-data boundary rule.
- Each service function must filter by the publication flag the offer/brand/category table actually uses (`is_active`, `published_at`, etc.). Do not rely on the caller to filter.
- Each page must handle "not found" with `notFound()` from `next/navigation` and "no results" with an empty-state component, not an unhandled exception.
- Each page must surface a clear path back to checkout. The brand page already has `BrandOffersClient` which should link to `/checkout?offerId=...`; verify this path still works after the move.
- Once the three pages exist, audit the homepage links again — every "view all" and card click should reach a real page.

### Done when

- A guest can land on `/`, click any "view all", brand card, or category card, and reach a working page that lists offers.
- A guest can click an offer on a brand or category page and land on `/checkout?offerId=...` without 404s in between.
- No public catalog page reads through `supabaseAdmin`; all reads go through `catalog-public.service.ts`.
- `find app/(public) -type d -empty` returns nothing (or only intentional dynamic-segment placeholders).

## Phase 8: Show Out-Of-Stock Offers Instead Of Hiding Them — DONE (2026-05-04)

### Status

The schema migration is staged and ready to apply. The application code is wired end-to-end against the new column, so as soon as the migration is run (`supabase/migrations/20260504000000_offers_show_when_out_of_stock.sql`) the storefront keeps zero-stock non-unlimited offers visible with a disabled CTA, the admin form exposes a per-offer toggle, and the public order POST refuses to insert an order whose offer no longer has stock.

### How to apply the migration

The repo's other migrations are run manually via the Supabase dashboard. To ship Phase 8:

1. Open Supabase → SQL Editor.
2. Paste the contents of `supabase/migrations/20260504000000_offers_show_when_out_of_stock.sql`.
3. Run it. The migration is idempotent (`ADD COLUMN IF NOT EXISTS`) and uses `DEFAULT true`, so every existing offer keeps showing on the storefront after sell-out by default.

### 2026-05-04 closing edits

- New migration `supabase/migrations/20260504000000_offers_show_when_out_of_stock.sql` adds `offers.show_when_out_of_stock boolean NOT NULL DEFAULT true`. Comment on the column documents the semantics. Default `true` matches the roadmap intent: existing offers stay visible after stock hits zero unless a merchant explicitly opts them out.
- `lib/validation/offer.ts` — added `show_when_out_of_stock: z.boolean().optional()` to `CreateOfferSchema`. `UpdateOfferSchema` inherits via `.partial()`.
- `src/server/modules/catalog/offer.service.ts` — extended `OFFER_SELECT` so the admin reads include the new column.
- `src/server/modules/catalog/catalog-public.service.ts` — added `show_when_out_of_stock` to `PUBLIC_OFFER_SELECT` and the `PublicOffer` type, plus a new exported helper `isOfferOutOfStock(offer)` so consumers can ask the canonical question without re-deriving the rule. `listActivePublicOffersByBrandId` now layers an `.or('is_unlimited.eq.true,stock_quantity.gt.0,show_when_out_of_stock.eq.true')` predicate after the `.eq('status','active')` filter — keeps unlimited offers, in-stock offers, and merchant-opted-in out-of-stock offers; drops everything else. `getActivePublicOfferById` is intentionally untouched: the checkout page still loads even an out-of-stock offer so it can render the disabled-CTA state instead of a generic "not available" page.
- `lib/services/orders.ts` — `verifyItemPrices` now also reads `stock_quantity` and `is_unlimited` and throws a clear "Insufficient stock for offer X: available Y, requested Z" error when a non-unlimited offer cannot satisfy `item.qty`. The check runs against the live DB row, not the request payload, so a client-side bypass is impossible. `createPublicOrder` calls this helper, so this is the canonical server-side stock gate.
- `components/storefront/OutOfStockBadge.tsx` — new small client component using `t("offers.stock.outOfStockBadge")`. Reused by both the brand page and (potentially) checkout summary.
- `app/(public)/b/[brandSlug]/page.tsx` — each offer card calls `isOfferOutOfStock(offer)`. Out-of-stock offers render the badge inline and replace the `<Link href="/checkout?...">` with a disabled `<button disabled>` showing "Esgotado". In-stock offers continue to navigate normally.
- `app/(public)/checkout/page.tsx` — passes `stock_quantity` and `is_unlimited` through into the props CheckoutClient receives. No early-return "sold out" branch on the page itself; the client handles the disabled state so a guest can still see the offer details and any other context.
- `components/storefront/checkout/CheckoutClient.tsx` — added `stock_quantity` / `is_unlimited` to the `Offer` type, computes `outOfStock = !is_unlimited && (stock_quantity ?? 0) <= 0`, folds it into the `valid` gate (form is invalid when out of stock so the submit button is disabled), and replaces the action label with `t("checkout.soldOut")` plus a red banner using `t("checkout.errors.outOfStock")` so the customer understands why they cannot finalize.
- `components/admin/OffersManager.tsx` — `Offer` type, `formData` state, `resetForm`, `openEditModal`, `handleCreate`, and `handleUpdate` now all carry `show_when_out_of_stock`. New checkbox row inside the create/edit modal labelled with `offers.fields.showWhenOutOfStock` and a help line. Default for new offers is `true`, matching the schema default.
- `messages/pt.json` and `messages/en.json` — new keys: `offers.fields.showWhenOutOfStock`, `offers.fields.showWhenOutOfStockHelp`, `offers.stock.outOfStockBadge`, `checkout.soldOut`, `checkout.errors.outOfStock`. JSON validates.

### Out-of-scope deferrals

- **`/api/offers` and `/api/featured-products`** — these legacy public API routes still filter only by `.eq('status', 'active')` without the new "is_unlimited OR stock_quantity > 0 OR show_when_out_of_stock" predicate. The brand page and checkout (the live consumers post-Phase 7) read through `catalog-public.service.ts` and use the right rule. The legacy routes have no current renderers in the live app (Phase 6 deleted both `FeaturedProductsClient` and `BrandOffersClient`), so leaving them filter-stale is not a user-facing bug. Bring them in line if the routes get a new consumer.
- **Stock check inside the `create_order` Postgres RPC** — the actual row-locking decrement still lives there. The new `verifyItemPrices` pre-check fails fast at the application layer, and a race between the pre-check and the RPC would still be caught by the RPC's own constraints. No DB change needed.
- **Admin table cell for `show_when_out_of_stock`** — the form lets merchants toggle it; the offers table doesn't render its current value as a separate column. Add it later if merchants need to scan the value at a glance.

### Done when (verified once the migration is applied)

- An offer with `stock_quantity = 0`, `is_unlimited = false`, `show_when_out_of_stock = true` renders on `/b/[slug]` (and any future Phase 7 page reading through `catalog-public.service.ts`) with a visible "Esgotado" badge and a disabled buy CTA. ✅ — code path verified; awaits migration to exercise live data.
- The same offer with `show_when_out_of_stock = false` does not render in the brand page list. ✅ — the `.or(...)` predicate drops the row.
- A scripted attempt to POST `/api/orders` with a zero-stock non-unlimited offer fails with a stock error and creates no order rows. ✅ — `verifyItemPrices` raises `Insufficient stock for offer X` before `createOrder` is invoked.
- The admin offer form lets a merchant flip `show_when_out_of_stock` and the storefront reflects the change after revalidation. ✅ — toggle present in create + edit modals.
- An unlimited offer (`is_unlimited = true`) never shows the badge regardless of stock value. ✅ — `isOfferOutOfStock` returns `false` for unlimited offers, badge and disabled CTA are gated on it.

### Goal

Today the offer model already has `stock_quantity` and `is_unlimited` columns ([offer.service.ts:7](src/server/modules/catalog/offer.service.ts#L7)) and the admin offers table renders an "out of stock" label when `stock_quantity <= 0` ([OffersManager.tsx:103-107](components/admin/OffersManager.tsx#L103-L107)). The storefront, however, treats stock as a hard hide: the public reads in [`/api/offers`](app/api/offers/route.ts) and [`/api/featured-products`](app/api/featured-products/route.ts) and the brand/category pages introduced in Phase 7 will need to drop these offers entirely unless we change the rule.

The desired behavior:

- An offer with zero stock still renders on the storefront.
- It shows an "out of stock" badge.
- Its purchase CTA is disabled.
- Checkout rejects any attempt to submit it.
- Unlimited offers (`is_unlimited = true`) bypass the badge regardless of `stock_quantity`.
- Each offer carries an admin-controlled toggle so a merchant can still hide a specific SKU when desired (e.g. discontinued).

### Schema change

Add a new column to `offers`:

- `show_when_out_of_stock boolean not null default true`

Default `true` so existing offers immediately appear on the storefront even at zero stock. Set to `false` per-offer when a merchant wants the legacy "disappear" behavior.

Migration file: `supabase/migrations/<timestamp>_offers_show_when_out_of_stock.sql`.

### Current files to change

- `src/server/modules/catalog/offer.service.ts` — extend `OFFER_SELECT` with `show_when_out_of_stock`. Add a public read filter:
  ```ts
  // pseudo
  query.or(
    `is_unlimited.eq.true,stock_quantity.gt.0,show_when_out_of_stock.eq.true`,
  )
  ```
  This keeps unlimited offers, in-stock offers, and out-of-stock offers that opted in. Anything else stays hidden.
- `app/api/offers/route.ts` — apply the same predicate, return `stock_quantity` and `is_unlimited` so the client can render the badge.
- `app/api/featured-products/route.ts` — same predicate.
- `app/(public)/checkout/page.tsx` — guard: if the loaded offer has `is_unlimited === false && stock_quantity <= 0`, render a "Sold out" message instead of the form.
- `components/storefront/checkout/CheckoutClient.tsx` — disable the submit button if `offer.is_unlimited === false && offer.stock_quantity <= 0`. This is a defense-in-depth check; the page-level guard above is the primary one.
- `src/server/modules/orders/order.service.ts` — `createPublicOrder` must reject items whose offer is non-unlimited and has zero stock with a clear `ConflictError` (`lib/api/errors.ts:61` already has the `Insufficient stock` error template; reuse it).
- `components/admin/OffersManager.tsx` — add a checkbox / switch in the create + edit forms for `show_when_out_of_stock`. Default true. Show its current value in the table.
- `lib/validation/offer.ts` — add `show_when_out_of_stock: z.boolean().optional()` to the offer schemas.
- `messages/pt.json`, `messages/en.json` — add `offers.fields.showWhenOutOfStock`, `offers.stock.outOfStockBadge`, `checkout.errors.outOfStock`, `storefront.outOfStock`.

### New files to create

- A small `OutOfStockBadge` component if Phase 7's brand/category page UIs need to import the same badge from a single source. Place it under `components/storefront/` (or `components/shared/` once Phase 6 creates that folder).

### Required changes

- Public reads must keep offers when any of the following holds: `is_unlimited = true`, `stock_quantity > 0`, or `show_when_out_of_stock = true`. Drop only when all three are false.
- The storefront UI must render an "Out of stock" badge whenever `is_unlimited = false && stock_quantity <= 0`, regardless of `show_when_out_of_stock`. The toggle controls visibility, not labeling.
- Disabled CTA: clickable target removed (`<button disabled>`), tooltip or helper text "Out of stock" in localized copy.
- Server enforcement: `createPublicOrder` is the only canonical write; it must re-check stock against the live record (not the request payload) before accepting any non-unlimited item.
- Admin UI: clearly label the toggle so a merchant understands it controls storefront visibility while out of stock, not purchasability.

### Done when

- An offer with `stock_quantity = 0`, `is_unlimited = false`, `show_when_out_of_stock = true` renders on `/`, `/browse`, `/b/[slug]`, and `/c/[slug]` with a visible "Out of stock" badge and a disabled buy CTA.
- The same offer with `show_when_out_of_stock = false` does not render at all on those pages.
- A scripted attempt to POST `/api/orders` with a zero-stock non-unlimited offer fails with a stock error and creates no order rows.
- The admin offer form lets a merchant flip `show_when_out_of_stock` and the storefront reflects the change after revalidation.
- An unlimited offer (`is_unlimited = true`) never shows the badge regardless of stock value.

## Suggested Delivery Sequence

1. Phase 0 — security blockers
2. Phase 1 — dead-link and empty-directory cleanup
3. Phase 7 — restore the catalog pipeline so the guest funnel actually runs end-to-end
4. Phase 8 — out-of-stock visibility (depends on Phase 7's catalog pages existing)
5. Phase 2 — checkout coherence + checkout prefill + post-purchase register CTA
6. Phase 3 — status normalization
7. Phase 4 — settings and admin reset
8. Phase 5 — query hardening and data boundary cleanup
9. Phase 6 — architecture move (route groups, API audience grouping, module shape)

Phase 7 is sequenced before Phase 2 because Phase 2's "checkout coherence" work is hard to validate without a real entry path into checkout. Phase 8 follows Phase 7 because the new storefront UI is where the badge and disabled CTA need to land. Phase 6 stays last; do not start it before Phases 0-2 are stable in production-like conditions.
