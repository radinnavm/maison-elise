# Maison Élise API

Node.js + Express + TypeScript REST API backed by PostgreSQL (via Prisma).

Request flow:

```
route → controller → service → repository → PostgreSQL
```

- **Routes** only map HTTP verbs/paths to controllers.
- **Controllers** stay thin: validate input, call a service, shape the response.
- **Services** hold business logic.
- **Repositories** own database access through Prisma.
- **Mappers** convert database models into API DTOs (never leaking `passwordHash` or raw internals).

## Requirements

- Node.js >= 20
- pnpm >= 9
- PostgreSQL 14+ running locally (this milestone does not use Docker)

## Setup

```bash
# from the repository root
pnpm install
cp apps/api/.env.example apps/api/.env
```

Create the database (once):

```bash
createdb maison_elise
# or: psql -U postgres -c "CREATE DATABASE maison_elise;"
```

Then, from `apps/api` (or via the root scripts):

```bash
pnpm prisma:generate     # generate the Prisma client
pnpm prisma:deploy       # apply migrations
pnpm prisma:seed         # seed categories, products, users
pnpm dev                 # start the API on http://localhost:4000
```

Root convenience scripts: `pnpm db:setup` (migrate + generate + seed), `pnpm db:migrate`, `pnpm db:seed`.

## Environment variables

| Variable              | Required | Description                                                        |
| --------------------- | -------- | ------------------------------------------------------------------ |
| `NODE_ENV`            | no       | `development` \| `production` \| `test` (default `development`)    |
| `PORT`                | no       | HTTP port (default `4000`)                                          |
| `DATABASE_URL`        | yes      | PostgreSQL connection string                                        |
| `JWT_SECRET`          | yes      | Secret used to sign session JWTs                                    |
| `JWT_EXPIRES_IN`      | no       | JWT lifetime (default `7d`)                                         |
| `COOKIE_NAME`         | no       | Auth cookie name (default `maison_elise_token`)                     |
| `COOKIE_MAX_AGE_DAYS` | no       | Auth cookie lifetime in days (default `7`)                          |
| `COOKIE_SAME_SITE`    | no       | `lax` \| `strict` \| `none` (default `lax`; `none` requires HTTPS)  |
| `CLIENT_URL`          | prod     | Storefront origin(s) allowed by CORS, comma-separated (default `http://localhost:5173`) |
| `ADMIN_URL`           | no       | Optional separate admin origin also allowed by CORS                 |
| `API_PUBLIC_URL`      | no       | Public API origin used to build absolute image URLs (default `http://localhost:4000`) |
| `TRUST_PROXY`         | no       | Express `trust proxy`: `false`, a hop count, or a subnet/name list  |
| `LOG_LEVEL`           | no       | `debug` \| `info` \| `warn` \| `error` (default `debug` dev, `info` prod) |
| `JSON_BODY_LIMIT`     | no       | JSON request body limit (default `1mb`)                             |
| `RATE_LIMIT_ENABLED`  | no       | Enable rate limiting (default: on, off under `NODE_ENV=test`)       |
| `AUTH_RATE_LIMIT_MAX` / `..._WINDOW_MS` | no | Credential endpoint limit (default 10 / 15 min)            |
| `PAYMENT_RATE_LIMIT_MAX` / `..._WINDOW_MS` | no | Payment creation limit (default 30 / min)               |
| `WEBHOOK_RATE_LIMIT_MAX` / `..._WINDOW_MS` | no | Stripe webhook limit (default 120 / min)                |
| `ADMIN_RATE_LIMIT_MAX` / `..._WINDOW_MS` | no | Admin API limit (default 300 / min)                       |
| `EMAIL_PROVIDER_API_KEY` | no    | Resend API key. When empty, the development logging provider is used instead |
| `EMAIL_FROM`          | no       | `From` address for transactional email (default `Maison Élise <no-reply@maisonelise.com>`) |
| `EMAIL_REPLY_TO`      | no       | Optional `Reply-To` address for transactional email                |
| `APP_URL`             | no       | Public storefront URL used to build links inside emails (default `http://localhost:5173`) |
| `ADMIN_EMAIL`         | no       | Seed admin email (default `admin@maisonelise.com`)                  |
| `ADMIN_PASSWORD`      | no       | Seed admin password. If omitted, the seed generates and prints one  |
| `CUSTOMER_EMAIL`      | no       | Seed customer email (default `customer@maisonelise.com`)            |
| `CUSTOMER_PASSWORD`   | no       | Seed customer password. If omitted, the seed generates and prints one |

Configuration is validated on startup; the process exits with a clear error if a
required variable is missing. Never commit a real `.env` file.

## Database

Prisma schema: `prisma/schema.prisma`. Migrations: `prisma/migrations/`.

Entities: `User`, `Category`, `Product`, `ProductImage`, `ProductVariant`.

- `User.email` is unique; passwords are stored as bcrypt hashes only.
- `Category.slug`, `Product.slug` and `ProductVariant.sku` are unique.
- Deleting a `Product` cascades to its images and variants (`onDelete: Cascade`).
- Deleting a `Category` that still has products is rejected (`onDelete: Restrict`).

Product images are served statically from `public/products` at `/static/products/...`.

### Seed

`prisma/seed.ts` is idempotent (upserts): 7 categories, 12 products with images and
variants, one admin and one customer. Passwords are only hashed, never stored in
plain text. If `ADMIN_PASSWORD` / `CUSTOMER_PASSWORD` are not set, the seed generates
random passwords and prints them once.

## API

Base URL: `http://localhost:4000/api/v1` (`API_PREFIX`).

### Health

| Method | Path                | Auth   | Description                    |
| ------ | ------------------- | ------ | ------------------------------ |
| GET    | `/health`           | public | Liveness check                 |
| GET    | `/health/live`      | public | Liveness check (no DB)         |
| GET    | `/health/ready`     | public | Readiness check (queries the DB; `503` when down) |

### Auth

| Method | Path             | Auth   | Description                          |
| ------ | ---------------- | ------ | ------------------------------------ |
| POST   | `/auth/register` | public | Create a customer account            |
| POST   | `/auth/login`    | public | Authenticate and set the session cookie |
| POST   | `/auth/logout`   | public | Clear the session cookie             |
| GET    | `/auth/me`       | cookie | Return the current user              |

`POST /auth/register` accepts `{ email, password, name }` or `{ email, password, firstName, lastName }`.
`POST /auth/login` accepts `{ email, password }`. All auth responses expose only safe user data
(`id`, `firstName`, `lastName`, `name`, `email`, `role`, `createdAt`) — never the password or hash.

### Products

| Method | Path                  | Auth  | Description                          |
| ------ | --------------------- | ----- | ------------------------------------ |
| GET    | `/products`           | public | List products (filter/sort/paginate) |
| GET    | `/products/:slug`     | public | Get a single active product          |
| POST   | `/products`           | ADMIN | Create a product                     |
| PATCH  | `/products/:id`       | ADMIN | Update a product                     |
| DELETE | `/products/:id`       | ADMIN | Delete a product (cascades)          |

Query parameters for `GET /products`:

`category` (slug), `size`, `color`, `minPrice`, `maxPrice`, `search`, `sort`, `page`, `limit`.

`sort` accepts `featured`, `newest`, `price_asc`, `price_desc`, `name_asc` (mapped to
an explicit column whitelist). `limit` is capped at 48.

List response:

```json
{
  "data": [ /* ProductDto */ ],
  "meta": { "page": 1, "limit": 12, "total": 12, "totalPages": 1 }
}
```

### Categories

| Method | Path                 | Auth  | Description               |
| ------ | -------------------- | ----- | ------------------------- |
| GET    | `/categories`        | public | List categories          |
| GET    | `/categories/:slug`  | public | Get a single category    |
| POST   | `/categories`        | ADMIN | Create a category        |
| PATCH  | `/categories/:id`    | ADMIN | Update a category        |
| DELETE | `/categories/:id`    | ADMIN | Delete a category        |

### Cart

All cart endpoints require an authenticated session (HttpOnly cookie).

| Method | Path                  | Description                                        |
| ------ | --------------------- | -------------------------------------------------- |
| GET    | `/cart`               | Get the current user's cart                        |
| POST   | `/cart/items`         | Add a variant (`{ variantId, quantity }`)          |
| PATCH  | `/cart/items/:itemId` | Update quantity (`{ quantity }`)                   |
| DELETE | `/cart/items/:itemId` | Remove an item                                     |
| DELETE | `/cart`               | Clear the cart                                     |
| POST   | `/cart/merge`         | Merge a guest cart (`{ items: [{ variantId, quantity }] }`) |

Prices, names, images and totals are always resolved from the database; the client cannot set
prices. Error codes include `VARIANT_NOT_FOUND`, `PRODUCT_UNAVAILABLE`, `INSUFFICIENT_STOCK`,
`CART_ITEM_NOT_FOUND`, and `INVALID_QUANTITY`.

### Orders

All order endpoints require an authenticated session. Orders are immutable historical snapshots —
there are no client-facing edit endpoints.

| Method | Path          | Description                                       |
| ------ | ------------- | ------------------------------------------------- |
| POST   | `/orders`     | Create an order from the current cart             |
| GET    | `/orders`     | List the authenticated user's orders (paginated)  |
| GET    | `/orders/:id` | Get one of the authenticated user's orders        |

Order creation is transactional: it re-validates product status and stock, reads authoritative
variant prices, snapshots product name/size/colour/price into `OrderItem`, decrements stock with a
conditional update, creates the order, and clears the cart — all in one transaction. If anything
fails, nothing is persisted and the cart is left untouched. The client cannot influence prices.

Order status: `PENDING` (created, payment not yet taken), `CONFIRMED` (payment confirmed — reserved
for the Stripe milestone), `CANCELLED`. A newly created order is always `PENDING` and is **not** paid.
Error codes include `CART_EMPTY`, `PRODUCT_UNAVAILABLE`, `INSUFFICIENT_STOCK`, `ORDER_NOT_FOUND`.

Each order exposes a human-readable reference `orderNumber` (e.g. `ME-2026-0001`), derived from a
database sequence (unique, stable, no fragile counter). The UUID `id` remains the API identifier.

### Payments (Stripe)

Stripe is the source of truth for payment events. Card data never touches the API or the browser
app — it is collected by Stripe Elements and confirmed directly with Stripe.

| Method | Path                      | Auth  | Description                                        |
| ------ | ------------------------- | ----- | -------------------------------------------------- |
| POST   | `/orders/:id/payment`     | owner | Create or retrieve the PaymentIntent for an order  |
| POST   | `/webhooks/stripe`        | —     | Stripe webhook receiver (signature verified)       |

Environment: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (backend only). The frontend uses
`VITE_STRIPE_PUBLISHABLE_KEY`. If Stripe is not configured, payment endpoints return
`503 PAYMENTS_NOT_CONFIGURED` and the rest of the API keeps working.

**Order vs payment status** are kept separate:

| Order status | Meaning                                  |
| ------------ | ---------------------------------------- |
| `PENDING`    | created, not yet confirmed               |
| `CONFIRMED`  | payment succeeded (set by webhook)       |
| `CANCELLED`  | order cancelled                          |

| Payment status | Meaning                                   |
| -------------- | ----------------------------------------- |
| `UNPAID`       | no payment attempt yet                    |
| `PROCESSING`   | PaymentIntent created/awaiting completion |
| `PAID`         | `payment_intent.succeeded` received       |
| `FAILED`       | `payment_intent.payment_failed` received  |
| `CANCELLED`    | `payment_intent.canceled` received        |

**PaymentIntent creation** is idempotent: the amount and currency are read from the persisted order
(never the client), the intent is created with a deterministic idempotency key
(`order:{orderId}:payment-intent`), and an existing intent is reused. If the existing intent was
cancelled, a replacement is created with a key chained to the previous intent id.

**Webhook handling** uses `express.raw()` (mounted before the JSON body parser) so
`stripe.webhooks.constructEvent` can verify the signature. Each event is claimed exactly once via the
unique `StripeWebhookEvent.stripeEventId` (`createMany({ skipDuplicates: true })`), and the order
transition + event claim happen in one transaction — so an event is never marked processed without
its order update. The order is resolved strictly by the `stripePaymentIntentId` stored on the order.

Business rules: `payment_intent.succeeded` → payment `PAID`, order `CONFIRMED`;
`payment_intent.payment_failed` → payment `FAILED`, order stays `PENDING`;
`payment_intent.canceled` → payment `CANCELLED`, order stays `PENDING` (payment can be retried).

**Local webhook development** (optional, not required to run the app):

```bash
stripe login
stripe listen --forward-to localhost:4000/api/v1/webhooks/stripe
# copy the printed whsec_... into STRIPE_WEBHOOK_SECRET
stripe trigger payment_intent.succeeded
```

Stock is decremented when the order is created (unchanged from the order milestone); abandoned
`PENDING` orders keep their reserved stock until a future expiration/cleanup milestone.

### Addresses & shipping

Authenticated customers manage their own saved addresses. Every address query is scoped to the
authenticated user — one user can never read or modify another user's address.

| Method | Path                     | Description                       |
| ------ | ------------------------ | --------------------------------- |
| GET    | `/addresses`             | List the user's saved addresses   |
| POST   | `/addresses`             | Create an address                 |
| PATCH  | `/addresses/:id`         | Update an address                 |
| DELETE | `/addresses/:id`         | Delete an address                 |
| PATCH  | `/addresses/:id/default` | Mark an address as the default    |

Only one address per user can be `isDefault` (enforced transactionally by clearing the previous
default). Validation covers names, phone, address lines, city, postal code and a 2-letter country
code; `addressLine2` is optional.

**Order shipping snapshot:** `POST /orders` now requires `{ "addressId": "..." }`. The order is
created with an **immutable `OrderShippingAddress` snapshot** copied from the selected address, so
later editing or deleting the saved address never changes historical orders. The order also stores
an explicit `shippingAmount` (currently `0` — Maison Élise offers free shipping; the field exists so
a real shipping service can replace the calculation later). `OrderDto` exposes `shippingAmount` and
`shippingAddress`. Stripe always charges `order.total` (= `subtotal + shippingAmount`) server-side.

### Transactional email

Important business events send transactional email to the customer. Email is always a **secondary,
fire-and-forget side effect**: it never blocks and never breaks the business flow that triggered it.

**Provider abstraction.** `src/email/provider.ts` defines an `EmailProviderAdapter` interface with a
`send()` method. The production adapter is `ResendEmailProvider` (Resend SDK); when no API key is
configured it falls back to `LoggingEmailProvider`, which logs the message instead of sending it.
`src/services/email.service.ts` is the thin application-facing seam — business code depends on it,
never on the provider SDK, so the provider can be swapped without touching services.

**Configuration.** `EMAIL_PROVIDER_API_KEY` (empty → logging provider), `EMAIL_FROM`,
`EMAIL_REPLY_TO` (optional) and `APP_URL` (used for links inside emails). See `.env.example`.

**Email types** (`src/email/templates.ts`, each rendered as HTML + plain text):

| Type                  | Trigger                                                       |
| --------------------- | ------------------------------------------------------------- |
| `ORDER_CONFIRMATION`  | Order created (`orderService.createOrder`)                    |
| `PAYMENT_SUCCESS`     | Stripe `payment_intent.succeeded` webhook                     |
| `PAYMENT_FAILED`      | Stripe `payment_intent.payment_failed` webhook                |
| `ORDER_STATUS_CHANGED`| Admin confirms or cancels an order (`orderService.updateStatus`) |
| `WELCOME`             | Customer registration (`authService.register`)                |

**NotificationService** (`src/services/notification.service.ts`) orchestrates delivery: it loads the
order/user, renders the template, sends via `emailService`, and records the outcome. Every public
method swallows its own errors (logging them) so callers can safely use `void … .catch()`.

**EmailDelivery persistence & idempotency.** Each send first creates an `EmailDelivery` row with a
unique `dedupeKey` (e.g. `ORDER_CONFIRMATION:{orderId}`, `PAYMENT_SUCCESS:{orderId}`,
`ORDER_STATUS_CHANGED:{orderId}:{status}`, `WELCOME:{userId}`). A duplicate `dedupeKey` (`P2002`) is
treated as an idempotent no-op, so retries and repeated webhooks never send twice. A successful send
marks the row `SENT` (with `provider`/`providerMessageId`); a provider failure marks it `FAILED`.
Persistence goes through `src/repositories/emailDelivery.repository.ts`.

**Webhook integration.** Stripe notifications run **after** the webhook transaction commits, so an
order is never emailed unless its payment transition was persisted. The admin order detail endpoint
returns these records, and the admin UI shows an “Emails” section per order.

> **Interrupted deliveries:** if the process stops after creating the `PENDING` record but before the
> send completes, the row stays `PENDING`. Run
> `pnpm --filter @maison-elise/api email:recover` to re-send stale `PENDING` records (older than
> `EMAIL_PENDING_RECOVERY_MS`, default 15 min) without creating new dedupe rows. Delivery is
> **at-least-once**: a send that succeeded but was not marked before a crash may be retried.

### Admin API

Every route under `/api/v1/admin` requires an authenticated **ADMIN** session
(`authenticate` + `authorize('ADMIN')`). Authorization is enforced server-side; the admin UI is
never the authority.

| Method | Path                                  | Description                        |
| ------ | ------------------------------------- | ---------------------------------- |
| GET    | `/admin/dashboard`                    | Aggregated business statistics     |
| GET    | `/admin/orders`                       | Order list (search/status/payment, paginated) |
| GET    | `/admin/orders/:id`                   | Order detail with customer         |
| PATCH  | `/admin/orders/:id/status`            | Change order status                |
| GET    | `/admin/products`                     | Product list (search/category/status/sort) |
| GET    | `/admin/products/:id`                 | Product detail                     |
| POST   | `/admin/products`                     | Create product                     |
| PATCH  | `/admin/products/:id`                 | Update product                     |
| GET    | `/admin/inventory`                    | Variant stock list (search/stock filter) |
| PATCH  | `/admin/inventory/:variantId`         | Update variant stock               |
| GET    | `/admin/categories`                   | List categories                    |
| POST   | `/admin/categories`                   | Create category                    |
| PATCH  | `/admin/categories/:id`               | Update category                    |
| GET    | `/admin/customers`                    | Customer list (search, paginated)  |
| GET    | `/admin/customers/:id`                | Customer detail + recent orders    |

Dashboard aggregates are computed with Prisma `count`/`aggregate` (no full-table loads).

**Order transitions** are an explicit state machine: `PENDING → CONFIRMED`, `PENDING → CANCELLED`,
`CONFIRMED → CANCELLED`; anything else is rejected (`INVALID_STATE_TRANSITION`). Confirming requires
`paymentStatus = PAID` (`PAYMENT_NOT_PAID` otherwise) so the payment lifecycle is never contradicted.
Cancelling restores reserved stock once, inside the same transaction as the status change.

**Inventory** is variant-level; stock updates are validated (`>= 0`). **Product updates preserve
existing variant IDs** by upserting on `(size, colour)`, so historical `OrderItem` snapshots stay
valid. **Destructive actions**: the admin API does not hard-delete products or categories — products
are archived via `status`, and categories are edited (deletion is blocked by the `Restrict` FK while
products reference them).

### Error format

```json
{ "error": { "code": "PRODUCT_NOT_FOUND", "message": "Product not found." } }
```

Status codes: `400` validation/malformed JSON, `401` unauthenticated, `403` forbidden, `404` not
found, `409` conflict (duplicate email/slug/SKU, restricted delete), `413` body too large,
`429` rate limited, `500` internal. Stack traces, Prisma internals, SQL and file paths are never
returned; unknown errors map to a generic `500`. Common Prisma errors (`P2002`, `P2003`, `P2025`)
are mapped to meaningful responses.

## Authentication

JWT-based sessions delivered in an **HttpOnly cookie** (`SameSite=Lax`, `Secure` in
production). The token contains only the user id (`sub`) and `role`. Browsers send the
cookie automatically; the frontend never stores the token in `localStorage`.

- `authenticate` verifies the cookie (or a `Bearer` token) and attaches `req.auth`.
- `authorize('ADMIN')` guards admin-only mutations.

In production, if the frontend is served from a different site, set
`SameSite=None; Secure` and use HTTPS.

## Security

- **Headers** — Helmet (`crossOriginResourcePolicy: cross-origin` for product images,
  `referrerPolicy: no-referrer`); HSTS only in production. CSP is intentionally not set by the API
  (JSON/images only); the frontend hosts own their CSP.
- **CORS** — explicit allow-list from `CLIENT_URL` (plus optional `ADMIN_URL`), credentials enabled,
  never a wildcard; unknown origins get no CORS headers.
- **Rate limiting** — `express-rate-limit` on credential endpoints, payment creation, Stripe
  webhooks and the admin API. Configure behind a proxy with `TRUST_PROXY`.
- **Request limits** — JSON (`JSON_BODY_LIMIT`, default `1mb`) and urlencoded (`100kb`). The Stripe
  webhook keeps its raw-body route for signature verification.
- **Cookies** — HttpOnly JWT cookie (`Secure` in production, configurable `SameSite`, `Path=/`).
- **CSRF** — cookie-authenticated state-changing requests are validated against the configured
  `CLIENT_URL`/`ADMIN_URL` origins (`Origin`, falling back to `Referer`); Bearer requests, safe
  methods, requests without a session cookie and the signature-verified Stripe webhook are exempt.
  Disable only with `CSRF_PROTECTION_ENABLED=false`.
- **Error handling** — consistent envelope, no internals leaked (see above).
- Zod validation on every input, bcrypt password hashing, JWT verification and role authorization.

## Logging & request IDs

Structured JSON logs in production (pretty in development) via `src/utils/logger.ts`, including
timestamp, level, method, route, status and duration. Every request gets a correlation id (reused
from a valid `x-request-id` header, otherwise generated) returned in the `x-request-id` response
header. Passwords, tokens, cookies and provider secrets are never logged, and request bodies are not
logged by default.

## Production

- Configuration is validated at startup; unsafe production config (weak `JWT_SECRET`, localhost
  `DATABASE_URL`/`CLIENT_URL`/`APP_URL`) aborts the process. See `.env.example`.
- Build and run compiled output: `pnpm build` then `node dist/server.js` (never `tsx` in production).
- Migrations: `pnpm db:migrate` (`prisma migrate deploy`) as an explicit deployment step — never
  `migrate reset`, `db push` or seeding against production.
- Graceful shutdown on `SIGTERM`/`SIGINT` with a 10s force-exit timeout; `uncaughtException` /
  `unhandledRejection` are logged and exit non-zero so the platform can restart the process.
- See [`../../docs/DEPLOYMENT.md`](../../docs/DEPLOYMENT.md) for the full deployment guide.

## Tests

```bash
pnpm test
```

Uses Node's built-in test runner via `tsx`. Covers password hashing/comparison,
registration/login validation, product filtering/query building, pagination and
authorization. Tests do not require a database.

## Scripts

| Script                          | Description                          |
| ------------------------------- | ------------------------------------ |
| `pnpm dev`                      | Start the API with watch mode        |
| `pnpm build`                    | Compile TypeScript to `dist/`        |
| `pnpm start`                    | Run the compiled server              |
| `pnpm lint`                     | Lint the API                         |
| `pnpm typecheck`                | Type-check source, prisma and config |
| `pnpm test`                     | Run backend tests                    |
| `pnpm prisma:generate`          | Generate the Prisma client           |
| `pnpm prisma:migrate`           | Create/apply a dev migration         |
| `pnpm prisma:deploy`            | Apply committed migrations           |
| `pnpm prisma:seed`              | Seed the database                    |
| `pnpm db:setup`                 | Migrate + generate + seed            |
