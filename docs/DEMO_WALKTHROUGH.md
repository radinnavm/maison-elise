# Demo Walkthrough

A ~5–7 minute script for a technical interview or portfolio review. Each step notes what to show and
what to say. Where a feature needs credentials or a deployment that does not exist, an honest
alternative is given.

## Preparation

```bash
pnpm install
cp apps/api/.env.example apps/api/.env      # set DATABASE_URL + JWT_SECRET
pnpm db:migrate && pnpm db:seed             # apply migrations + seed demo catalogue
pnpm dev                                    # shared build, then web (5173), admin (5174), api (4000)
```

Stripe and email are optional locally: payments return `503` until `STRIPE_SECRET_KEY` is set, and
email is logged (not sent) without `EMAIL_PROVIDER_API_KEY`.

## 1. Introduce the project (30s)

> "Maison Élise is a full-stack fashion e-commerce portfolio project: a React storefront, a React admin
> dashboard, and a TypeScript Express API with Prisma and PostgreSQL, in one pnpm monorepo. It covers
> the full path from browsing to a paid order, plus the back-office tooling behind it."

## 2. Storefront (30s)

Open `http://localhost:5173`. Point out the responsive layout and the design tokens in
`apps/web/src/styles`. Mention that routes are code-split (`React.lazy`) so the homepage stays light.

## 3. Browse, filter, search (60s)

Go to **Shop**. Filter by category/size/colour and change the sort — say that filtering, sorting,
search and pagination are all **server-side** (`GET /products` with query params), and that faceted
URLs are `noindex` to avoid duplicate pages.

## 4. Product variants (45s)

Open a product. Select a colour and size; note that availability and stock come from the database
(`ProductVariant`), and that the price is the variant's price. Add to bag.

## 5. Cart (45s)

Open the bag. Change quantity. Refresh the page — as a guest the cart is persisted in `localStorage`.
Log in (or register) and show that the guest cart **merges** into the server cart.

## 6. Checkout and payment (60s)

Proceed to checkout, select/create a shipping address, and place the order. Explain that order
creation is a single database transaction: it validates the cart, decrements stock conditionally (so
the last unit cannot be oversold), snapshots the items and shipping address, and clears the cart.

For payment: with Stripe test keys configured, use the Payment Element and test card `4242 4242 4242
4242`. **Without keys**, explain that the endpoint returns `503` by design and that the order is
confirmed only by a signature-verified Stripe webhook — never by the client.

## 7. Order history (30s)

Open **Account → Orders** and then an order. Show the immutable item and shipping snapshots, and the
payment status.

## 8. Admin dashboard (60s)

Open `http://localhost:5174` and sign in with an admin account. Show the dashboard aggregates, then
**Orders** (open one, show the status state machine and the per-order email history), **Products**
(create/edit with variants), **Inventory** (adjust stock) and **Customers**. Emphasise that the API —
not the UI — enforces `ADMIN` authorization.

## 9. Architecture (45s)

Open `docs/ARCHITECTURE.md`. Trace: React/RTK Query → Express (routes → controllers → services →
repositories) → Prisma → PostgreSQL, with the shared contract package and the Stripe/email
integrations. Mention the Mermaid sequence diagrams for auth and checkout.

## 10. One or two engineering challenges (60s)

Pick from `docs/CASE_STUDY.md`:

- **Concurrent cancellation double-restoring stock** — fixed with a conditional status update so only
  one transition wins.
- **Testing Prisma 7 without a database** — persistence moved behind repositories because Node's
  `mock.method` cannot stub Prisma's proxy delegates.

## Honest limitations to state

- Not deployed; no live URL. Stripe is test-only and email delivery is unverified.
- SEO is client-rendered (no SSR), so non-JS crawlers do not see product metadata.
- The Playwright E2E suite is written but requires an isolated database/stack and was not run here.
