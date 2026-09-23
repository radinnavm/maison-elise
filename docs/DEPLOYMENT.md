# Deploying Maison Élise

This document covers production configuration, hosting architecture, domains/DNS, startup, database
migrations, Stripe/Cloudinary/email setup, health checks, rollback, CI/CD and Docker usage.

> **Status:** the repository is deployment-ready, but no production environment has been provisioned
> in this milestone. Everything that requires a provider account, credential, domain or DNS access is
> documented as a **manual step** below — no credentials were invented and nothing was deployed.

## Recommended hosting (simple, portfolio-appropriate)

| Component  | Recommended                          | Why                                                        |
| ---------- | ------------------------------------ | ---------------------------------------------------------- |
| Storefront | Vercel or Netlify (static/SPA)       | Native Vite support, HTTPS, custom domains, git deploys    |
| Admin      | Vercel or Netlify (static/SPA)       | Same tooling as the storefront                             |
| API        | Render / Railway / Fly.io (Node 22)  | Managed Node runtime, env vars, health checks, deploy hooks |
| Database   | Existing Supabase PostgreSQL         | Already provisioned and migrated                           |
| Media      | Static SVGs served by the API today  | Cloudinary is **not integrated** (see below)               |

A single provider for both SPAs is fine; keep them as separate projects/sites so the admin origin can
differ from the storefront origin.

## Domain architecture

Suggested production layout (replace with the real domain once purchased):

| Host                    | Points to        | Notes                                        |
| ----------------------- | ---------------- | -------------------------------------------- |
| `www.<domain>`          | Storefront       | Primary storefront origin (`CLIENT_URL`)     |
| `admin.<domain>`        | Admin            | Admin origin (`ADMIN_URL`)                   |
| `api.<domain>`          | API              | API origin (`API_PUBLIC_URL`)                |
| `<domain>` (apex)       | Storefront       | Redirect to `www`                            |

Required DNS records (exact values come from the hosting dashboards — do not invent them):

| Type    | Name    | Value                                  |
| ------- | ------- | -------------------------------------- |
| `CNAME` | `www`   | storefront provider target             |
| `CNAME` | `admin` | admin provider target                  |
| `CNAME` | `api`   | API provider target                    |
| `A`/`ALIAS` | `@` | storefront provider apex target        |

HTTPS is provisioned automatically by all of the recommended providers once the domain is verified.
Set the API's `CLIENT_URL=https://www.<domain>` and `ADMIN_URL=https://admin.<domain>` so CORS and
credentialed cookies work. Keep the JWT cookie `HttpOnly` + `Secure`; only use `SameSite=None` if the
API is on a **different registrable domain** than the storefront (same-site subdomains can use `Lax`).

## Environment architecture

| Environment | `NODE_ENV`    | Configuration source                         |
| ----------- | ------------- | -------------------------------------------- |
| Development | `development` | `apps/api/.env`, local defaults allowed      |
| Test        | `test`        | Test process env; database-free, mocked      |
| Production  | `production`  | Injected secrets/environment only            |

`apps/api/src/config/env.ts` validates configuration at startup. In production the API **exits with
an error** if any of the following is true:

- `JWT_SECRET` is missing, shorter than 32 characters, or a known weak/default value
- `CLIENT_URL` or `APP_URL` is missing or points at localhost
- `DATABASE_URL` points at localhost
- `ADMIN_URL`, if set, points at localhost

`STRIPE_SECRET_KEY` and `EMAIL_PROVIDER_API_KEY` are optional: their features degrade gracefully
(payments return `503 PAYMENTS_NOT_CONFIGURED`; email falls back to the logging provider) and the API
logs a startup warning.

## Production environment variables (API)

Required:

| Variable       | Notes                                                        |
| -------------- | ------------------------------------------------------------ |
| `DATABASE_URL` | External PostgreSQL connection string (non-localhost)        |
| `JWT_SECRET`   | 32+ random characters, unique per environment                |
| `CLIENT_URL`   | Storefront origin(s) allowed by CORS (comma-separated)       |
| `APP_URL`      | Public storefront URL used in email links                    |

Common optional: `ADMIN_URL`, `API_PUBLIC_URL`, `PORT`, `JWT_EXPIRES_IN`, `COOKIE_NAME`,
`COOKIE_MAX_AGE_DAYS`, `COOKIE_SAME_SITE`, `TRUST_PROXY`, `LOG_LEVEL`, `JSON_BODY_LIMIT`,
`RATE_LIMIT_*`, `CSRF_PROTECTION_ENABLED`, `EMAIL_PENDING_RECOVERY_MS`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`. See
[`../apps/api/.env.example`](../apps/api/.env.example) for the full list.

`TRUST_PROXY` is `false` by default. Behind a load balancer, set it to the correct hop count
(`TRUST_PROXY=1`) or subnet/name list (`TRUST_PROXY=loopback`) so client IPs and rate limiting work
correctly. A bare `true` is normalised to a single trusted hop.

**CSRF.** Cookie-authenticated state-changing requests (`POST`/`PUT`/`PATCH`/`DELETE`) are validated
against the configured `CLIENT_URL`/`ADMIN_URL` origins (`Origin`, falling back to `Referer`). This is
defence-in-depth on top of `SameSite=Lax` and CORS. Bearer-token requests, safe methods, requests
without a session cookie, and the signature-verified Stripe webhook are exempt. Disable only with
`CSRF_PROTECTION_ENABLED=false` (not recommended in production).

**Email recovery.** If the API is interrupted between recording an `EmailDelivery` and sending it, the
record stays `PENDING`. Recover stale records (older than `EMAIL_PENDING_RECOVERY_MS`, default 15 min)
with `pnpm --filter @maison-elise/api email:recover`. Delivery is at-least-once: a send that succeeded
but was not marked before a crash may be retried.

Frontends only receive public configuration: `VITE_API_URL` and `VITE_STRIPE_PUBLISHABLE_KEY`.
Secrets must never be placed in `VITE_*` variables.

## Build & start (without Docker)

```bash
pnpm install --frozen-lockfile
pnpm --filter @maison-elise/shared build
pnpm --filter @maison-elise/api build
NODE_ENV=production node apps/api/dist/server.js
```

The production process runs compiled JavaScript only.

## Database migrations

Apply committed migrations as an explicit deployment step:

```bash
pnpm db:migrate   # → prisma migrate deploy
```

Rules:

- Use `prisma migrate deploy` (non-destructive) — never `migrate reset`, `db push`, or seeding.
- Migrations run **outside** API startup and must complete before the new API version serves traffic.
- The database is managed/external; do not containerize PostgreSQL/Supabase.

## Health checks

| Endpoint                    | Use       | Behavior                                          |
| --------------------------- | --------- | ------------------------------------------------- |
| `GET /api/v1/health/live`   | Liveness  | `200` when the process is up (no DB dependency)   |
| `GET /api/v1/health/ready`  | Readiness | `200` when the database answers, else `503`       |

Configure liveness probes against `/health/live` and readiness probes against `/health/ready`.

## Graceful shutdown

The API handles `SIGTERM`/`SIGINT`: it stops accepting connections, drains in-flight requests, closes
idle keep-alive sockets, disconnects Prisma and exits. A 10-second timeout force-exits if draining
stalls. `uncaughtException`/`unhandledRejection` are logged and trigger a non-zero exit so the
platform can restart the process.

## Logging & request IDs

Structured JSON logs in production, pretty logs in development. Each request has a correlation id
(reused from a valid `x-request-id` header, otherwise generated) returned in the `x-request-id`
response header and included in logs. Request bodies, tokens, cookies and secrets are never logged.

## CI

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`:

1. `pnpm format:check`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test`
5. `pnpm build`

**CI database strategy:** the backend test suite is database-free (repositories/Prisma are mocked),
so CI runs no database service and never connects to Supabase. Dummy `DATABASE_URL`/`JWT_SECRET`
values are set only for config validation at import time. No production credentials are used in CI;
third-party integrations are mocked.

## Docker

Multi-stage production images are provided:

| Image              | Dockerfile              | Runtime                       | Port |
| ------------------ | ----------------------- | ----------------------------- | ---- |
| `maison-elise-api` | `apps/api/Dockerfile`   | `node:22-alpine`, non-root    | 4000 |
| `maison-elise-web` | `apps/web/Dockerfile`   | `nginx-unprivileged`, non-root| 8080 |
| `maison-elise-admin`| `apps/admin/Dockerfile`| `nginx-unprivileged`, non-root| 8080 |

Build from the repository root:

```bash
docker build -f apps/api/Dockerfile -t maison-elise-api .
docker build -f apps/web/Dockerfile \
  --build-arg VITE_API_URL=https://api.example.com/api/v1 \
  -t maison-elise-web .
docker build -f apps/admin/Dockerfile \
  --build-arg VITE_API_URL=https://api.example.com/api/v1 \
  -t maison-elise-admin .
```

Or run the whole stack with Compose (requires a root `.env` with production-grade values — the API
refuses to start with localhost URLs or a weak JWT secret):

```bash
docker compose up --build
```

Notes:

- Images bake in **no secrets**; the API reads everything from the environment at runtime.
- The frontend `VITE_API_URL` must be an absolute URL including the API prefix when the API is on a
  different origin.
- The database is external and is not part of the Compose stack.
- Run migrations separately (see above) before starting a new API image.

## Deployment prerequisites

1. Managed PostgreSQL instance provisioned and reachable.
2. All production secrets set (strong `JWT_SECRET`, Stripe, email provider).
3. `CLIENT_URL` / `ADMIN_URL` / `APP_URL` set to real HTTPS URLs.
4. `pnpm db:migrate` executed successfully.
5. Stripe webhook endpoint configured at `/api/v1/webhooks/stripe` with its signing secret.
6. Liveness/readiness probes pointed at the health endpoints.
7. `TRUST_PROXY` set correctly if behind a load balancer.

## Deployment sequence (manual)

1. Create the provider projects (two static sites + one Node service) and connect the repository.
2. Set the environment variables (names only — see the tables above) in each provider dashboard.
3. Add the custom domains and the DNS records, then wait for HTTPS to be issued.
4. Run `prisma migrate deploy` against the production database.
5. Configure the Stripe webhook endpoint and copy its signing secret into the API env.
6. Verify the email provider domain (SPF/DKIM) and set the sender/reply-to values.
7. Deploy the API, then the storefront and admin.
8. Run the smoke tests in "Production smoke tests".

### API (Render / Railway / Fly.io)

- **Build:** `pnpm install --frozen-lockfile && pnpm --filter @maison-elise/shared build && pnpm --filter @maison-elise/api build`
- **Start:** `node apps/api/dist/server.js` (compiled JavaScript only)
- **Health check:** `/api/v1/health/live` (readiness: `/api/v1/health/ready`)
- **Release/pre-deploy:** `pnpm db:migrate` (`prisma migrate deploy`)
- **Node:** 22; **port:** read from `PORT`.

### Storefront & admin (Vercel / Netlify)

- **Root directory:** `apps/web` and `apps/admin` (monorepo-aware install required).
- **Build:** `pnpm --filter @maison-elise/shared build && pnpm --filter @maison-elise/<app> build`
- **Output:** `dist`
- **Env:** `VITE_API_URL=https://api.<domain>/api/v1`; storefront also `VITE_STRIPE_PUBLISHABLE_KEY`.

## Production smoke tests

Run against the deployed API (use a dedicated test/admin account; never mutate real customer data):

- Public: `/health/live`, `/health/ready`, `/categories`, `/products`, `/products/:slug`.
- Auth: `register` (disposable email), `login`, `/auth/me`, `logout`.
- Cart: `GET /cart`, add/update/remove an item.
- Orders: create an order with a saved address, retrieve it.
- Admin: admin login + a read-only protected endpoint (e.g. `/admin/dashboard`).
- Errors: unknown route → `404`; invalid body → `400`; no session → `401`; customer on admin → `403`.
  Confirm no stack traces / SQL / paths / secrets are returned.

## Stripe (test mode)

Keep **test mode** until the deployment milestone explicitly switches to live.

1. Stripe Dashboard → Developers → API keys → copy the **test** publishable + secret keys.
2. Set `STRIPE_SECRET_KEY` (API) and `VITE_STRIPE_PUBLISHABLE_KEY` (storefront).
3. Developers → Webhooks → add endpoint `https://api.<domain>/api/v1/webhooks/stripe`.
4. Subscribe to `payment_intent.succeeded`, `payment_intent.payment_failed`,
   `payment_intent.canceled`; copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
5. Verify a test purchase with `4242 4242 4242 4242` and confirm the order becomes `CONFIRMED`
   from the **backend/database** (the frontend is never the source of truth).

## Cloudinary

Cloudinary is **not integrated** in the current codebase — product images are static SVGs served from
`apps/api/public/products` at `/static/products/...`. There are no Cloudinary credentials to set and
no upload/reorder/delete flow to verify. If Cloudinary is added later it must follow the same pattern:
`CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` backend-only, plus at most a
public cloud name for the frontends. The API secret must never reach the browser.

## Email provider

The API uses **Resend** (`EMAIL_PROVIDER_API_KEY`), with a logging fallback when the key is absent.

1. Create a Resend account and verify the sending domain; add the SPF/DKIM DNS records Resend shows.
2. Create an API key and set `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM` (verified sender) and
   `EMAIL_REPLY_TO`.
3. Verify order confirmation / payment success / payment failure emails are recorded in the admin
   order "Emails" section. Actual delivery requires the verified domain.

## SEO, indexing & performance

**Per-route metadata.** The storefront applies title, meta description, canonical URL, Open Graph,
Twitter card and JSON-LD client-side via the `Seo` component. Public catalogue routes (home, shop,
category, product) are `index, follow`; private routes (account, cart, checkout, auth, order,
wishlist, search, 404) are `noindex, nofollow`. Product pages emit Schema.org `Product` structured
data built only from server-authoritative fields (no invented ratings, reviews, brand or shipping).
The homepage emits `WebSite` data.

Because this is a client-rendered SPA, metadata is applied on the client; the static `index.html`
defaults to `noindex` as a pre-JS safety net. Prerendering/SSR is a recommended future improvement.

**Indexing environment variables** (storefront, public):

| Variable              | Purpose                                                        |
| --------------------- | -------------------------------------------------------------- |
| `VITE_SITE_URL`       | Absolute origin used for canonical/OG URLs (e.g. `https://www.<domain>`) |
| `VITE_ALLOW_INDEXING` | `false` forces `noindex` everywhere (use for staging/preview)  |

**robots.txt** (`apps/web/public/robots.txt`) allows the public catalogue and disallows every private
route. The admin `robots.txt` disallows everything. Add the `Sitemap:` line once the domain is known.

**sitemap.xml** — regenerate before each production deploy with the real domain and API:

```bash
SITE_URL=https://www.<domain> SITEMAP_API_URL=https://api.<domain>/api/v1 pnpm sitemap
```

The generator (`apps/web/scripts/generate-sitemap.mjs`) lists only `/`, `/shop`, category and product
URLs; it never includes private routes and is non-fatal if the API is unreachable. A baseline sitemap
is committed; the generated one overwrites it.

**Faceted URLs.** Shop URLs with filters, search, a non-default sort or pagination are `noindex` and
canonicalise to the clean category (or `/shop`) URL, so filter combinations never become indexable
duplicates. Invalid product/category routes render an application-level not-found experience.

**Performance decisions.** Route-level code splitting keeps the homepage/shell in the initial bundle
and loads shop, product, cart, checkout, account and auth pages on demand (same for the admin pages).
Product/category RTK Query data is cached for 5 minutes to avoid refetching on navigation. Images use
explicit dimensions, `loading="lazy"` (below the fold), `decoding="async"`, and eager/high priority
only for the hero and the first product row; product images are static SVGs served by the API (there
is no Cloudinary integration to transform). Google Fonts are loaded via a preconnected stylesheet
link rather than a CSS `@import`.


## Rollback strategy

- **Frontends:** redeploy the previous successful build from the provider dashboard (Vercel/Netlify
  keep immutable deployments). No database impact.
- **API:** redeploy the previous release/image. Keep the previous image tag available.
- **Database:** migrations are **forward-only and not automatically reversible**. `prisma migrate
  deploy` never rolls back. For a destructive migration, restore from a Supabase backup/point-in-time
  recovery into a new database and repoint `DATABASE_URL`; plan this before running destructive DDL.
- **Environment:** keep the previous variable values; roll back config changes together with the
  release they belong to.
- **Stripe webhooks:** the endpoint is stable; no rollback needed. If a secret is rotated, update
  `STRIPE_WEBHOOK_SECRET` in the API and redeploy.

## Production data safety

- No seed script runs at API startup; `prisma/seed.ts` is a manual, idempotent development tool.
- No reset/`db push` command is part of any production path.
- No development user or demo password is created automatically. Create the first admin through the
  normal registration flow and promote it deliberately (a controlled one-off), never via hardcoded
  credentials.
- Migrations were verified read-only before deployment (schema up to date; existing data intact).

## CI/CD flow

```
Pull request → CI (format:check, lint, typecheck, test, build)
Merge to main → Deploy workflow (after CI succeeds) → provider deploy hooks
```

`.github/workflows/deploy.yml` runs on `workflow_run` of the `CI` workflow on `main` (and via manual
`workflow_dispatch`). It triggers provider deploy hooks from repository/environment secrets
(`API_DEPLOY_HOOK`, `WEB_DEPLOY_HOOK`, `ADMIN_DEPLOY_HOOK`); each step is a no-op until its secret is
set. Migrations are applied by the platform release step or manually before the new API serves
traffic. Production deployments never bypass CI.

