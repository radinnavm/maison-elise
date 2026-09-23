# Technical Decisions

Significant implementation choices in Maison Élise, with the problem each solves, the approach taken,
why it fits, and the tradeoffs. Where an alternative is listed, it is noted as an option that was not
adopted, not as a formally documented evaluation.

---

## 1. React + TypeScript with Vite

- **Problem:** build a maintainable, type-safe UI for two applications with fast feedback.
- **Approach:** React 19 with TypeScript in strict mode, bundled by Vite; a single base `tsconfig`.
- **Why:** TypeScript catches contract mistakes at compile time; Vite gives fast dev server startup and
  simple static production builds.
- **Tradeoffs:** no server-side rendering out of the box (relevant to SEO — see below); the team must
  manage client-side data fetching explicitly.
- **Not used:** Next.js/Remix (would add SSR, which is out of scope for the current milestone).

## 2. Redux Toolkit + RTK Query

- **Problem:** separate client state (auth status, guest cart, wishlist, UI) from server state, without
  hand-written fetch/caching code everywhere.
- **Approach:** Redux Toolkit slices for client state; RTK Query (`baseApi`, `credentials: 'include'`)
  for all API access, with tags for invalidation and `keepUnusedDataFor: 300` on catalogue queries.
- **Why:** RTK Query provides caching, request de-duplication, loading/error states and cache
  invalidation with little boilerplate, while keeping mutable data correct through tags.
- **Tradeoffs:** a global store adds indirection; the auth token is deliberately **not** kept in the
  store (only the session cookie is used).
- **Not used:** TanStack Query + Context/Zustand (would be equally valid; RTK Query was chosen to reuse
  one store and tooling).

## 3. Express API with a layered structure

- **Problem:** expose a REST API with clear separation between HTTP concerns and business logic.
- **Approach:** `routes → controllers → services → repositories`, with Zod schemas for input and a
  central error middleware. Controllers translate HTTP; services hold business rules; repositories own
  Prisma access.
- **Why:** the layering keeps routes declarative and makes business logic unit-testable without HTTP or
  a database.
- **Tradeoffs:** more files per feature; requires discipline to avoid leaking Prisma types upward.

## 4. Prisma + PostgreSQL (Supabase)

- **Problem:** model products, variants, carts, orders, payments and email deliveries with integrity.
- **Approach:** Prisma schema with explicit relations, unique constraints and cascade/restrict rules;
  `Decimal(10,2)` for money; forward-only SQL migrations applied with `prisma migrate deploy`.
- **Why:** typed queries, generated client, and migrations that are safe to apply in CI/CD; PostgreSQL
  provides the transactional guarantees the checkout flow relies on.
- **Tradeoffs:** `Decimal` requires explicit `Number(...)` conversion at the DTO boundary; Prisma 7's
  proxy-based client is awkward to mock (addressed by the repository seam).

## 5. JWT in an HttpOnly cookie

- **Problem:** authenticate browser clients without exposing tokens to JavaScript.
- **Approach:** a signed JWT (`sub` + `role`) delivered in an HttpOnly cookie (`Secure` in production,
  `SameSite` configurable, `Path=/`); a `Bearer` header is also accepted for non-browser clients.
- **Why:** HttpOnly cookies are not readable by JavaScript, mitigating token theft via XSS; the
  stateless token needs no session store.
- **Tradeoffs:** stateless tokens cannot be revoked before expiry (no denylist/rotation yet); cookie
  auth requires CSRF defence (added as Origin/Referer validation).

## 6. Transactional order creation

- **Problem:** a checkout must not leave partial state (stock decremented without an order, or an order
  without items) and must not oversell.
- **Approach:** one Prisma transaction validates the cart, conditionally decrements stock
  (`stockQuantity >= quantity`), creates the order and immutable snapshots, and clears the cart.
- **Why:** the conditional decrement makes the last-unit race safe; the transaction guarantees
  all-or-nothing persistence.
- **Tradeoffs:** longer-held transactions; the pattern relies on the database's row-level locking.

## 7. Stripe webhook handling

- **Problem:** payment status must be trustworthy and resilient to retries/duplicates.
- **Approach:** the webhook route uses the raw request body for signature verification; each event is
  claimed once via a unique `StripeWebhookEvent` row before any transition; PaymentIntents are created
  with an idempotency key and the order is resolved by the stored PaymentIntent id.
- **Why:** only Stripe (verified) can mark an order paid; duplicates and unknown intents are safe
  no-ops.
- **Tradeoffs:** a late success after an admin cancellation is a known edge case (documented) that
  would need refund handling.

## 8. Media handling (no Cloudinary)

- **Problem:** serve product imagery.
- **Approach:** static SVG images served by the API from `apps/api/public/products`; the admin manages
  image URLs as text.
- **Why:** keeps the project dependency-light and avoids storing provider credentials; the storefront
  already applies responsive sizing/lazy-loading.
- **Tradeoffs:** no on-the-fly transformations or uploads; Cloudinary is **not integrated** despite
  being mentioned in the original scope.

## 9. Email provider abstraction

- **Problem:** send transactional email without coupling business logic to a provider or breaking
  transactions when email fails.
- **Approach:** an `EmailProviderAdapter` interface with a Resend implementation and a logging fallback;
  a `NotificationService` that records each delivery (`EmailDelivery`, unique `dedupeKey`) and never
  throws into the business flow.
- **Why:** the provider is swappable, emails are idempotent, and a failure cannot roll back an order.
- **Tradeoffs:** delivery is at-least-once (a crash after send but before marking may resend); a
  recovery command handles records stuck `PENDING`.

## 10. Testing architecture

- **Problem:** test business rules, HTTP behavior and UI without a live database or third-party calls.
- **Approach:** the API uses Node's built-in test runner with repositories/middleware mocked (a small
  repository seam avoids mocking Prisma's proxy directly); the frontends use Vitest + React Testing
  Library; Playwright specs cover E2E flows behind an env flag.
- **Why:** fast, deterministic tests with no external dependencies, so CI needs no database.
- **Tradeoffs:** mocked repository tests do not exercise real SQL; E2E remains the place for
  integration coverage and is not yet runnable in CI.
