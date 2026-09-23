# Deployment Checklist

**Current status: not deployed.** No production URLs exist. This checklist lists the remaining manual
actions to deploy. For the full guide (hosting choices, DNS records, Stripe/email setup, rollback), see
[`DEPLOYMENT.md`](DEPLOYMENT.md).

Stripe must remain in **test mode** for this portfolio deployment. Do not enable live payments.

## 1. Accounts and infrastructure (manual)

- [ ] Hosting for the two static SPAs (e.g. Vercel or Netlify) — one project each.
- [ ] Hosting for the API (e.g. Render, Railway or Fly.io) — Node 22 runtime.
- [ ] A PostgreSQL database. The project already uses **Supabase**; reuse it or provision a separate
      database for production. Do not point production at the development database if you intend to
      keep them isolated.
- [ ] Optional: a domain (custom domain is optional for a portfolio project).

## 2. API environment variables (set in the host dashboard)

Required: `DATABASE_URL`, `JWT_SECRET` (32+ random chars), `CLIENT_URL`, `APP_URL`.
Common optional: `ADMIN_URL`, `API_PUBLIC_URL`, `PORT`, `COOKIE_*`, `TRUST_PROXY`, `LOG_LEVEL`,
`JSON_BODY_LIMIT`, `RATE_LIMIT_*`, `CSRF_PROTECTION_ENABLED`, `EMAIL_PENDING_RECOVERY_MS`,
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`.
See [`../apps/api/.env.example`](../apps/api/.env.example). Never commit real values.

- [ ] `NODE_ENV=production`
- [ ] Strong, unique `JWT_SECRET` (the API refuses to start otherwise)
- [ ] Non-localhost `DATABASE_URL`, `CLIENT_URL`, `APP_URL`
- [ ] `TRUST_PROXY` set for the platform's proxy (e.g. `1`)

## 3. Frontend environment variables

- [ ] `apps/web`: `VITE_API_URL=https://<api-host>/api/v1`, `VITE_STRIPE_PUBLISHABLE_KEY=<test pk>`,
      `VITE_SITE_URL=https://<storefront-host>`, `VITE_ALLOW_INDEXING` (`true` for the public site,
      `false` for any staging/preview deployment).
- [ ] `apps/admin`: `VITE_API_URL=https://<api-host>/api/v1`.
- [ ] Never place secrets in `VITE_*` variables.

## 4. Database migration

- [ ] Run `pnpm db:migrate` (`prisma migrate deploy`) as an explicit step **before** the new API serves
      traffic. Never use `migrate reset`, `db push` or seeding against production.
- [ ] Confirm `prisma migrate status` reports the schema is up to date.

## 5. Stripe (test mode)

- [ ] Add a webhook endpoint `https://<api-host>/api/v1/webhooks/stripe`.
- [ ] Subscribe to `payment_intent.succeeded`, `payment_intent.payment_failed`,
      `payment_intent.canceled`; copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
- [ ] Verify a test purchase with `4242 4242 4242 4242` and confirm the order becomes `CONFIRMED` from
      the database (never trust the frontend).

## 6. Email (optional)

- [ ] Create a Resend API key and verify the sending domain (SPF/DKIM DNS records).
- [ ] Set `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`.
- [ ] Without a key, the API logs emails instead of sending — acceptable for a portfolio demo.

## 7. Deployment and verification

- [ ] Deploy the API, then the storefront and admin.
- [ ] `GET /api/v1/health/live` → `200`; `GET /api/v1/health/ready` → `200`.
- [ ] Point liveness probes at `/health/live` and readiness at `/health/ready`.
- [ ] Log in, browse, add to cart, check out with a test card, confirm the order.
- [ ] Confirm an unrelated origin cannot make credentialed API requests.
- [ ] Regenerate the sitemap with the real domain: `SITE_URL=… SITEMAP_API_URL=… pnpm sitemap`.

## 8. Repository publication

- [ ] Initialize Git if not already (`git init`) and make an initial commit (see the root README).
- [ ] Confirm `.gitignore` excludes `node_modules`, `dist`, `coverage`, `test-results`, `.env*`
      (except `*.env.example`).
- [ ] Confirm no secrets are staged before the first commit.
- [ ] Do **not** push to a remote or publish until you have reviewed the staged files.
