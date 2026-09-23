# Portfolio Copy

Reusable copy for job applications, CVs and portfolio sites. All statements reflect functionality that
exists in the repository. No business metrics, client work or team history are claimed.

## A. One-line description (~25 words)

> Full-stack fashion e-commerce portfolio project: a React storefront, a React admin dashboard and a
> TypeScript/Express API with Prisma, PostgreSQL and Stripe.

## B. Short portfolio description (~100 words)

> Maison Élise is a full-stack e-commerce application built as a portfolio project. It pairs a
> responsive React storefront with an administration dashboard and a TypeScript REST API in a pnpm
> monorepo. Customers browse a server-filtered catalogue, manage a persistent cart, check out with
> saved addresses and pay via Stripe (test mode); orders are created transactionally with immutable
> snapshots and confirmed by signed webhooks. The API enforces role-based authorization, records
> transactional email with idempotent delivery, and ships with 255 automated tests, CI and production
> hardening (rate limiting, CSRF origin validation, structured logging, health checks).

## C. Detailed case study summary (~260 words)

> Maison Élise is a full-stack fashion e-commerce portfolio project designed to demonstrate realistic
> commerce engineering end to end. The monorepo contains three applications and a shared TypeScript
> contract package: a React 19 + Vite storefront, a React admin dashboard, and an Express 5 API backed
> by Prisma and PostgreSQL (Supabase).
>
> The storefront supports server-side catalogue filtering, sorting, search and pagination, product
> variants, a guest cart that merges into a server cart on login, saved shipping addresses, Stripe
> (test mode) checkout, and order history. The admin dashboard covers orders with an explicit status
> state machine, products and variants, inventory, categories and customers, with per-order email
> delivery history. Authorization is enforced by the API, not the UI.
>
> Engineering highlights include backend-authoritative pricing, transactional order creation with
> conditional stock decrement to prevent overselling, immutable order snapshots, and Stripe webhook
> verification with event-level idempotency. Transactional email is abstracted behind a provider
> interface, recorded with unique dedupe keys, and recoverable if a process is interrupted.
>
> The API is production-hardened with a fail-fast configuration validator, Helmet, a CORS allow-list,
> CSRF Origin/Referer validation, per-category rate limiting, structured logging with request
> correlation, health/readiness endpoints and graceful shutdown. Quality is enforced by 255 automated
> tests (167 API, 88 UI), ESLint, Prettier, strict TypeScript and CI, with Playwright specs for E2E.
> The project is not deployed; deployment steps and required credentials are documented.

## D. CV project entry

**Maison Élise — Full-Stack E-commerce Platform** *(personal portfolio project)*
*React, TypeScript, Vite, Redux Toolkit/RTK Query, Node.js, Express, Prisma, PostgreSQL, Stripe, Vitest, Playwright, Docker, GitHub Actions*

- Built a pnpm monorepo with a React storefront, an admin dashboard and an Express/Prisma REST API
  sharing one typed contract package.
- Implemented transactional checkout: backend-authoritative pricing, conditional stock decrement to
  prevent overselling, immutable order snapshots and cart clearing in a single database transaction.
- Integrated Stripe with raw-body webhook signature verification, event idempotency and
  server-calculated PaymentIntent amounts; payments confirmed only via webhook.
- Hardened the API with fail-fast config validation, Helmet, CORS allow-list, CSRF origin validation,
  rate limiting, structured logging, health checks and graceful shutdown.
- Wrote 255 automated tests (167 API service/route tests, 88 UI tests) plus Playwright E2E specs, all
  wired into a GitHub Actions CI pipeline.

## E. Interview introduction (60 seconds)

> "I built Maison Élise as a portfolio project to practise the parts of e-commerce that are easy to get
> wrong. It's a monorepo with a React storefront, an admin dashboard, and a TypeScript Express API
> using Prisma and PostgreSQL. The interesting work is in the checkout path: prices come from the
> database, stock is decremented with a conditional update so the last unit can't be oversold, and the
> whole order — items, shipping snapshot, cart clearing — is one transaction. Payments go through
> Stripe; only a signature-verified webhook can mark an order paid, and duplicate events are ignored.
> On the platform side I added rate limiting, CSRF origin validation, structured logging and health
> checks, and there are 255 automated tests plus a CI pipeline. It isn't deployed yet, and I'm upfront
> that email delivery and Stripe live mode aren't verified — those need credentials."

## F. Technical interview talking points

- **Architecture:** monorepo, shared contract package, layered API (`routes → controllers → services →
  repositories`), repositories as the persistence seam.
- **Authentication:** JWT in an HttpOnly cookie (`Secure`, `SameSite`), no token in `localStorage`,
  bcrypt password hashing, role-based `authenticate`/`authorize`, auth rate limiting.
- **Data modelling:** products/variants with `Decimal(10,2)` money, unique constraints and
  cascade/restrict rules; orders with immutable item and shipping snapshots.
- **Order transactions:** conditional stock decrement, all-or-nothing order creation, concurrency-safe
  status transitions (conditional `updateMany`).
- **Payment integration:** server-calculated amounts, idempotency keys, raw-body webhook signature
  verification, event claim table for idempotency, payment status driven only by webhooks.
- **Testing:** database-free API tests via a repository seam (Node test runner), Vitest + RTL for UI,
  Playwright E2E specs; CI runs format/lint/typecheck/test/build with no database.
- **Security:** Helmet, CORS allow-list, CSRF Origin/Referer validation, rate limiting, request body
  limits, non-leaking error envelope, startup config validation.
- **Deployment limitations:** not deployed; Docker/CI defined but unverified; Stripe test-only; email
  unverified; SEO is client-rendered without SSR.
