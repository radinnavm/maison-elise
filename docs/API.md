# API Reference

Base URL: `/api/v1` (defined by `API_PREFIX` in `packages/shared`).

The API is an Express application. Requests and responses are JSON. All request bodies and query
strings are validated with Zod; unknown/invalid input returns `400`.

## Authentication

Sessions use a **JWT delivered in an HttpOnly cookie** (`maison_elise_token` by default; `Secure` in
production, `SameSite` configurable, `Path=/`). Clients must send the cookie (`credentials: 'include'`
in the browser). A `Bearer <token>` header is also accepted for non-browser clients.

| Role | Access |
| --- | --- |
| Anonymous | Public catalogue, health, auth, Stripe webhook |
| `CUSTOMER` | Own cart, orders, addresses, payment intents |
| `ADMIN` | Everything above plus `/admin/*` |

Protected routes return `401 UNAUTHENTICATED` without a valid session and `403 FORBIDDEN` when the
role is insufficient. Ownership is enforced in the service/repository layer (a customer cannot access
another customer's resources, even by guessing an id).

State-changing requests authenticated by cookie are validated against the configured
`CLIENT_URL`/`ADMIN_URL` origins (CSRF defence-in-depth); see `docs/DEPLOYMENT.md`.

## Response conventions

Successful list responses:

```json
{
  "data": [ /* … */ ],
  "meta": { "page": 1, "limit": 12, "total": 12, "totalPages": 1 }
}
```

Single resources are returned as `{ "data": { … } }` or as the resource directly depending on the
endpoint (e.g. `/products/:slug` returns the product DTO).

### Error format

```json
{ "error": { "code": "PRODUCT_NOT_FOUND", "message": "Product not found.", "details": [] } }
```

| Status | Meaning |
| --- | --- |
| `400` | Validation error / malformed JSON |
| `401` | Not authenticated |
| `403` | Forbidden (role, ownership or CSRF origin) |
| `404` | Not found |
| `409` | Conflict (duplicate, invalid state transition, insufficient stock) |
| `413` | Request body too large |
| `429` | Rate limited |
| `500` | Unexpected error (generic message; internals are never leaked) |
| `503` | Feature not configured (e.g. payments without Stripe keys) |

## Pagination, filtering and sorting

`GET /products` accepts:

| Query | Description |
| --- | --- |
| `category` | Category slug |
| `size`, `color` | Variant facet filters |
| `minPrice`, `maxPrice` | Base price range |
| `search` | Case-insensitive match on name/description |
| `sort` | `featured` \| `newest` \| `price_asc` \| `price_desc` \| `name_asc` |
| `page`, `limit` | Pagination (server-side; `limit` is capped) |

Admin list endpoints accept `page`, `limit`, `search` and resource-specific filters.

## Endpoints

### Health

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | public | Liveness |
| GET | `/health/live` | public | Liveness (no database) |
| GET | `/health/ready` | public | Readiness (queries the database; `503` when down) |

### Auth

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | public | Create a customer account; sets the session cookie |
| POST | `/auth/login` | public | Authenticate; sets the session cookie |
| POST | `/auth/logout` | public | Clear the session cookie |
| GET | `/auth/me` | session | Current user |

Login/registration are rate limited.

### Products

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/products` | public | List active products (filter/sort/paginate) |
| GET | `/products/:slug` | public | Product detail (images, variants, sizes, colors) |
| POST | `/products` | ADMIN | Create a product |
| PATCH | `/products/:id` | ADMIN | Update a product (variants upserted by size/colour) |
| DELETE | `/products/:id` | ADMIN | Delete a product |

### Categories

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/categories` | public | List categories |
| GET | `/categories/:slug` | public | Category detail |
| POST | `/categories` | ADMIN | Create a category |
| PATCH | `/categories/:id` | ADMIN | Update a category |
| DELETE | `/categories/:id` | ADMIN | Delete a category |

### Cart

All cart routes require a session and operate on the caller's own cart.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/cart` | Get the cart |
| POST | `/cart/items` | Add a variant (`{ variantId, quantity }`) |
| PATCH | `/cart/items/:itemId` | Update quantity |
| DELETE | `/cart/items/:itemId` | Remove an item |
| DELETE | `/cart` | Clear the cart |
| POST | `/cart/merge` | Merge a guest cart into the server cart |

### Addresses

Owner-scoped.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/addresses` | List addresses |
| POST | `/addresses` | Create an address |
| PATCH | `/addresses/:id` | Update an address |
| PATCH | `/addresses/:id/default` | Set as default |
| DELETE | `/addresses/:id` | Delete an address |

### Orders

Owner-scoped.

| Method | Path | Description |
| --- | --- | --- |
| POST | `/orders` | Create an order from the cart (`{ addressId }`) |
| GET | `/orders` | List the caller's orders (paginated) |
| GET | `/orders/:id` | Order detail (with item and shipping snapshots) |
| POST | `/orders/:id/payment` | Create/return a Stripe PaymentIntent (rate limited) |

### Admin

Every `/admin/*` route requires `ADMIN`.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/admin/dashboard` | Aggregate metrics |
| GET | `/admin/orders` | Order list (search/status/payment filters) |
| GET | `/admin/orders/:id` | Order detail (incl. email delivery history) |
| PATCH | `/admin/orders/:id/status` | Transition order status |
| GET | `/admin/products` | Product list |
| GET | `/admin/products/:id` | Product detail |
| POST | `/admin/products` | Create product |
| PATCH | `/admin/products/:id` | Update product |
| GET | `/admin/inventory` | Variant stock list |
| PATCH | `/admin/inventory/:variantId` | Update variant stock |
| GET | `/admin/categories` | Category list |
| POST | `/admin/categories` | Create category |
| PATCH | `/admin/categories/:id` | Update category |
| GET | `/admin/customers` | Customer list |
| GET | `/admin/customers/:id` | Customer detail + recent orders |

Order status follows an explicit state machine (`PENDING → CONFIRMED → CANCELLED`, with
`PENDING → CANCELLED`); confirming requires `paymentStatus = PAID`.

### Webhooks

| Method | Path | Description |
| --- | --- | --- |
| POST | `/webhooks/stripe` | Stripe webhook receiver. The raw body is used for signature verification; events are claimed once (idempotent). Handles `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`. |
