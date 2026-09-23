# Testing Maison Élise

This document describes the automated testing strategy. The goal is a maintainable safety net around
business-critical behaviour — not maximum coverage.

## Layers

| Layer                 | Framework                        | Location                          | Needs a database? |
| --------------------- | -------------------------------- | --------------------------------- | ----------------- |
| Backend unit/service  | Node test runner + `tsx`         | `apps/api/src/**/*.test.ts`       | No                |
| Frontend unit/UI      | Vitest + React Testing Library   | `apps/web/src/**/*.test.tsx?`     | No                |
| Admin unit/UI         | Vitest + React Testing Library   | `apps/admin/src/**/*.test.tsx?`   | No                |
| End-to-end            | Playwright (Chromium)            | `e2e/*.spec.ts`                   | Yes + running apps |

## Commands

```bash
pnpm test            # all unit/service/UI suites (builds shared first)
pnpm test:watch      # Vitest watch mode (storefront)
pnpm test:coverage   # Vitest coverage for web + admin
pnpm test:e2e        # Playwright (skipped unless E2E_BASE_URL is set)
pnpm test:e2e:ui     # Playwright UI mode
```

Per-workspace: `pnpm --filter @maison-elise/api test`, `pnpm --filter @maison-elise/web test`,
`pnpm --filter @maison-elise/admin test`.

## Backend tests (Node test runner)

Run with `node --import tsx --test "src/**/*.test.ts"`. They cover services, mappers, schemas,
middleware and route authorization for auth, cart, orders, payments and admin.

**Database strategy:** backend tests are **database-free by design**. Repositories and the Prisma
client are replaced with in-memory fakes/mocks (`node:test` `mock.method`) so the suite runs anywhere
(including CI) without touching Supabase. External services (Stripe) are exercised through the
`stripeGateway` abstraction, with webhook signatures verified using Stripe's
`webhooks.generateTestHeaderString` — no live Stripe calls.

Transactional email is mocked at the boundary: the provider (`emailService` / `EmailProviderAdapter`)
and the `EmailDelivery` repository are replaced with fakes, so the suite never calls Resend and never
writes an email-delivery row. Real provider delivery is **not required** for the test suite to pass;
when no API key is configured the app uses the development `LoggingEmailProvider`.

Transactional behaviour (order creation, stock decrement, cart clearing, cancellation/restock,
webhook idempotency) is covered at the service level with transactional fakes that model rollback.

## Frontend tests (Vitest + React Testing Library)

Configured per app (`apps/web/vitest.config.ts`, `apps/admin/vitest.config.ts`) with `jsdom`, a setup
file that imports `@testing-library/jest-dom/vitest`, and v8 coverage. Tests assert what the user
sees (roles, labels, text) and avoid implementation details. A `renderWithProviders` helper mounts
components with a fresh Redux store and a `MemoryRouter`.

## End-to-end tests (Playwright)

`playwright.config.ts` targets `E2E_BASE_URL` (default `http://localhost:5173`) and Chromium. Specs
cover the customer journey, authentication/authorization, cart persistence + guest merge, and the
admin back office. **They are skipped unless `E2E_BASE_URL` is set**, so they are a no-op in
environments without the required infrastructure.

### E2E environment requirements

E2E tests need a **dedicated test database** (never the development database), the API and both
frontends running, and Stripe test keys:

```
E2E_BASE_URL=http://localhost:5173
E2E_ADMIN_URL=http://localhost:5174
E2E_CUSTOMER_EMAIL=...
E2E_CUSTOMER_PASSWORD=...
E2E_ADMIN_EMAIL=...
E2E_ADMIN_PASSWORD=...
```

Stripe test-mode card `4242 4242 4242 4242` and the documented failing test methods are used for
payment scenarios. **Never use real payment credentials.** Tests must create and clean up their own
data; do not run them against production-like data.

## CI

`.github/workflows/ci.yml` runs on pull requests and pushes to `main` using Node 22 and the pinned
pnpm version: `format:check`, `lint`, `typecheck`, `test`, `build`. Because the backend suite is
**database-free**, CI runs **no database service** and must never point at the Supabase database.
Dummy `DATABASE_URL`/`JWT_SECRET` values are provided only so config validation succeeds at import
time.

## Production-hardening tests

Route-level tests cover request ids, CORS (allowed vs unknown origin, preflight), authentication
boundaries, malformed and oversized request bodies, non-leaking `500` responses, and health/readiness
behavior. Rate limiting is disabled for the test environment by default; a dedicated test enables it
with a low limit to assert the `429` path. Log formatting is intentionally not asserted.

## Coverage

`pnpm test:coverage` reports v8 coverage for the frontend apps (text + HTML in each app's
`coverage/`). No hard threshold is enforced yet — prioritise business logic (services, slices,
payment/cart/order flows) over static UI when interpreting the report.

## What is intentionally not tested

- Redux Toolkit / RTK Query internals.
- Exact CSS/markup structure.
- Trivial getters and static presentational components.
- Stripe/Cloudinary SDK behaviour (mocked at the boundary).
- Email provider SDK behaviour (Resend) and real email delivery — mocked at the boundary.
