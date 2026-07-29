# Route Deep-Dive: `/cart` · `/vendor/cart`

**Page:** `Cart.jsx` | **Layout:** Standalone (no VendorLayout)

## Purpose
Shopping cart review with quantity controls, delivery address, price summary, and checkout entry. Multi-flow theming (Mithilak, Quick Shop, Fresh Grocery, default).

## Components
Sticky header, empty state, delivery address card, cart item list, pricing summary (₹39 shipping or free over ₹500), fixed bottom bar, address modal (name/phone/address → `localStorage.cartAddress`), `parsePrice`/`formatPrice`, i18n.

## Business Flow
1. Load `localStorage.userCart` on mount.
2. Sync auth from `isAuthenticated` on mount, popstate, focus.
3. Authenticated + no address → auto-assign hardcoded default address.
4. Empty cart → flow-aware "Shop Now" link.
5. Quantity/remove → localStorage + `cartUpdated`.
6. **Checkout gating:** not auth → `/login`; no address → modal; ready → `/checkout`.

## Expected APIs
| Endpoint | Current State |
|----------|---------------|
| `GET /cart` | Not wired — localStorage |
| `PUT /cart/items/:id` | Not wired |
| `DELETE /cart/items/:id` | Not wired |
| `GET/POST /users/addresses` | Not wired — localStorage |
| `GET /checkout/summary` | Client-side calculation |

## Permissions
- View/modify cart: **Public**
- Checkout: **Authenticated** + address required

## Errors
| Scenario | Handling |
|----------|----------|
| JSON parse failure | console.error; empty cart |
| Unauthenticated checkout | Redirect `/login` with `{ from: '/cart' }` |
| Missing address | Block checkout; open modal |
