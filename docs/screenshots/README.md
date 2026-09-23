# Screenshots

These screenshots were captured from the **running production build** of the storefront, using the
seeded demo catalogue and a locally running API. They contain no real customer data, credentials or
payment details.

## Captured

| File | Screen | Notes |
| --- | --- | --- |
| `01-homepage.jpg` | Homepage (desktop 1440×900) | Hero, new arrivals, editorial section |
| `02-shop.jpg` | Shop / product listing | Server-side catalogue grid |
| `03-product.jpg` | Product detail | Gallery, variants, price |
| `04-cart.jpg` | Cart | Demo guest item seeded in `localStorage` (no server write) |
| `05-login.jpg` | Sign in | Checkout is auth-gated, so the sign-in screen is shown instead |
| `06-homepage-mobile.jpg` | Homepage (mobile 390×844) | Responsive layout |

## Not captured (requires credentials or deployment)

The following screens require an authenticated customer or admin account and were intentionally not
captured here (no credentials were used against the database):

- Checkout and shipping-address selection
- Order confirmation
- Account / order history and order detail
- Admin dashboard
- Admin orders, products, inventory, categories, customers

## How to capture the remaining screens locally

1. Start the stack (see the root README) with a seeded database and a known admin account.
2. Sign in to the storefront (`http://localhost:5173`) and admin (`http://localhost:5174`).
3. Use the browser's screenshot tool, or Playwright's `page.screenshot()`, at 1440×900.
4. Blur or avoid any real personal data before publishing.

To regenerate the public screenshots, run the API against the seeded demo database, build the
storefront with an absolute `VITE_API_URL`, start `vite preview`, and capture with Playwright. Do not
commit screenshots that contain real email addresses, addresses, tokens or keys.
