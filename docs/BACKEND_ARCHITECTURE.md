# Backend Architecture

## Principles

- Keep the app as a modular monolith.
- Treat `app/api` as transport only.
- Put business rules in `src/server/modules`.
- Put cross-cutting infrastructure in `src/server/platform`.
- Use the service-role Supabase client only for explicitly privileged workflows.

## Current Structure

```text
src/server/
  http/
    errors.ts
    response.ts
    route.ts
  modules/
    admins/
    orders/
  platform/
    auth/
    config/
    db/
```

## Conventions

- Public routes should call module services and return existing API shapes.
- Admin routes should call `requireAdmin(request)` before invoking privileged actions.
- Environment misconfiguration should fail fast instead of returning noop clients.
- New backend tests should live beside the server modules they cover.

## Next Refactors

- Migrate remaining admin routes to `withRoute` and shared auth guards.
- Move catalog, customers, analytics, and settings logic into `src/server/modules`.
- Replace ad hoc Supabase SQL access with repository-style modules where query reuse emerges.
