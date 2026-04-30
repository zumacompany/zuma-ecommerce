# Zuma Updates

This folder turns the audit into an execution plan for the current codebase.

## Files

- `fix-roadmap.md`
  Concrete fix phases, exact current files to change, proposed new files, and a recommended implementation order.
- `target-architecture.md`
  Proposed clean architecture for Zuma across storefront, customer account, admin, APIs, and shared server modules.

## Recommended Order

1. Ship Phase 0 and Phase 1 from `fix-roadmap.md` before any visual cleanup.
2. Use `target-architecture.md` as the target shape while applying Phases 2-4.
3. Avoid a big-bang rewrite. Stabilize first, then move modules behind the same routes.

## Non-Negotiables

- Public pages must not read customer or order data with the service-role client.
- Public actions must not mutate orders without ownership or a signed token.
- Checkout must have one source of truth for summary, totals, and success state.
- Order status values must be canonical across admin, customer, analytics, and RPCs.
- Global settings must only expose options the storefront actually supports.
