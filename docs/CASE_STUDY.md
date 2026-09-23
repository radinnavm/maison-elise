# Engineering Case Study — Maison Élise

## 1. Project overview

Maison Élise is a full-stack fashion e-commerce application built as a portfolio project. It contains
a customer storefront, an administration dashboard and a TypeScript REST API in a single pnpm
monorepo, backed by PostgreSQL via Prisma. The project demonstrates the architecture, data modelling,
payment integration, testing and production-hardening practices of a realistic e-commerce system.

It is **not** an operating business: there are no real customers, sales or third-party deployments.

## 2. Objective

The objective was to build a coherent, end-to-end commerce application rather than a set of isolated
features — exercising authentication, catalogue, cart, checkout, payments, fulfilment-facing admin
tooling, transactional email, automated tests and deployment configuration within one codebase.

## 3. Scope

**Customer experience**

- Responsive storefront: homepage, shop with server-side filtering/sorting/pagination/search,
  category pages, product detail with variants (size/colour), guest and authenticated cart, checkout
  with saved shipping addresses, Stripe (test mode) payment, order confirmation, account order
  history and order detail.
- Guest cart persists in `localStorage` and merges into the server cart on login/registration.

**Administration experience**

- Dashboard aggregates; order management with an explicit status state machine; product and variant
  creation/editing; inventory adjustment; category management; customer list/detail; per-order email
  delivery history.

**Platform**

- JWT (HttpOnly cookie) authentication with customer/admin roles, rate limiting, CSRF origin
  validation, structured logging with request correlation, health/readiness endpoints, graceful
  shutdown, and a production-safe configuration validator.

## 4. Technical architecture

A pnpm monorepo:

- `apps/web` — React 19 + Vite + React Router + Redux Toolkit/RTK Query storefront.
- `apps/admin` — the same stack for the back office.
- `apps/api` — Express 5 + Prisma 7 REST API, layered as routes → controllers → services →
  repositories.
- `packages/shared` — the API contract (DTOs, enums, constants) consumed by all three apps.
- PostgreSQL (Supabase) accessed through Prisma, with forward-only SQL migrations.

External services: Stripe (payments, test mode) and Resend (transactional email, with a logging
fallback). Cloudinary is **not** integrated — product images are static SVGs served by the API. See
[`ARCHITECTURE.md`](ARCHITECTURE.md) for diagrams.

## 5. Important engineering decisions

- **Monorepo with a shared contract.** A single `packages/shared` package defines the request/response
  types used by both frontends and the API, so contract changes surface as compile errors.
- **TypeScript everywhere, strict mode**, with a single base `tsconfig` and project-specific configs.
- **RTK Query for server state, Redux Toolkit for client state.** Catalogue queries cache; cart,
  orders and auth use invalidation so mutable data stays correct.
- **Backend-authoritative pricing and totals.** Order line prices come from `ProductVariant.price`
  inside the database transaction; the client never sends prices.
- **Transactional order creation.** Validating the cart, decrementing stock, creating the order and
  its immutable item/shipping snapshots, and clearing the cart happen in one Prisma transaction.
- **Immutable order snapshots.** `OrderItem` and `OrderShippingAddress` copy product and address data,
  so later catalogue or address changes never alter historical orders.
- **Stripe webhook verification and idempotency.** The webhook uses the raw body for signature
  verification and claims each event once via a unique constraint before applying a transition.
- **Role-based authorization enforced by the API.** `authenticate` + `authorize('ADMIN')` guard the
  admin routes; the frontends are convenience only.
- **Email delivery tracking.** Each send is keyed by a unique `dedupeKey`, recorded in
  `EmailDelivery`, and can be recovered if a process is interrupted (see below).

## 6. Challenges and solutions

- **Preventing overselling under concurrency.** Stock is decremented with a conditional update
  (`stockQuantity >= quantity`), so two concurrent checkouts for the last unit cannot both succeed;
  the loser gets `INSUFFICIENT_STOCK` and the transaction rolls back.
- **Double stock restoration on cancellation.** A naive cancel read the status, then updated it, so
  two concurrent cancellations could both restore stock. The fix performs a conditional
  `updateMany({ where: { id, status: expectedStatus } })` and only restores stock when exactly one row
  changed; the losing request throws `INVALID_STATE_TRANSITION`.
- **Payment state consistency.** Only a signature-verified Stripe webhook can mark an order paid;
  duplicate deliveries are ignored via the claimed-event table and an idempotency key on PaymentIntent
  creation.
- **Email idempotency and recovery.** A unique `dedupeKey` prevents duplicate sends; a maintenance
  command re-sends records stuck in `PENDING` after an interrupted process without creating new
  records (documented as at-least-once delivery).
- **Testing Prisma 7 without a database.** Node's `mock.method` cannot stub Prisma 7's proxy-based
  delegates, so persistence was moved behind small repository objects that tests can mock — keeping
  the backend suite database-free and deterministic.
- **Environment separation.** A single validated config module fails fast in production on weak
  secrets or localhost URLs, and the test environment uses no database or third-party credentials.

## 7. Testing and quality

- **API:** 167 tests (Node's built-in test runner via `tsx`) covering services, routes, middleware,
  schemas and utilities — including authorization, order/checkout integrity, Stripe idempotency,
  payment ownership, CSRF and email recovery. No database required (repositories are mocked).
- **Frontend/admin:** 73 + 15 tests (Vitest + React Testing Library) covering UI components, Redux
  slices, SEO metadata and validation.
- **End-to-end:** Playwright specs exist for the customer journey, cart, auth and admin, gated behind
  `E2E_BASE_URL`; they were **not executed** here because no isolated test database/browser stack was
  provisioned.
- **Static quality gates:** ESLint (flat config), Prettier, `tsc --noEmit`, and production builds —
  all passing. CI runs these on every pull request and push to `main`.

## 8. Limitations

- **Not deployed.** No production URLs exist; deployment steps and required credentials are documented
  but not performed.
- **Stripe is in test mode** and unverified without credentials; live mode is intentionally out of
  scope.
- **Email delivery is unverified** end-to-end (no provider key); the logging fallback is used.
- **Cloudinary is not integrated**; images are static assets.
- **SEO is client-rendered.** Product metadata is applied after hydration, so non-JS crawlers and most
  social scrapers do not receive product-specific tags without prerendering/SSR.
- **Full E2E and Lighthouse runs were not performed** (infrastructure unavailable).
- **No JWT revocation** (stateless tokens valid until expiry), and registration reveals account
  existence via `EMAIL_IN_USE`.

## 9. Future improvements

- Prerender or server-render public routes for crawler-visible SEO.
- A CI service container (or dedicated test project) to run the Playwright suite.
- Password reset, refunds, coupons and real shipping-rate calculation.
- Short-lived access tokens with refresh/rotation, or a token denylist.
- Image pipeline (e.g. a CDN/transformation service) if Cloudinary or similar is adopted.
- Observability (metrics/tracing) beyond structured logs.

See [`TECHNICAL_DECISIONS.md`](TECHNICAL_DECISIONS.md) for the reasoning behind the major choices.
