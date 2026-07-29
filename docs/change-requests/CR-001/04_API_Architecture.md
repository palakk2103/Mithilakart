# CR-001 — Updated API Architecture

**Change Request:** CR-001  
**Date:** 2026-07-20  
**Base:** API Master Plan v1.0 (~210 endpoints)  

**Status:** Specification only — DO NOT IMPLEMENT until CR-001 approved.

---

## 1. Naming Convention Changes

| Legacy | CR-001 |
|--------|--------|
| `commerceFlow` | `marketplaceTab` |
| `commerceFlows[]` | `visibleTabs[]` (categories) / listings (products) |
| `?commerceFlow=mithilak` | `?marketplaceTab=mithilak` |
| `GET /storefront/:flow/home` | `GET /storefront/:tab/home` |

**Backward compatibility:** Accept `commerceFlow` as alias for `marketplaceTab` for 2 release cycles. Return deprecation header: `X-Deprecated-Param: commerceFlow`.

---

## 2. APIs — No Change (Confirmed)

All endpoints in these groups remain **unchanged**:

- Customer Auth (6)
- Seller Auth (3)
- Admin Auth (4)
- Delivery Auth (4)
- User Profile — except optional tab preference (1 field)
- Payment Methods (4)
- Payments / Webhooks (3)
- Wallet (2)
- Reviews (4) — scoped to master productId
- Q&A (4) — scoped to master productId
- Support Tickets (4)
- Admin RBAC roles (5)
- Admin audit (2)
- Health / Metrics (3)
- File uploads (2)

**Total unchanged:** ~56 endpoints

---

## 3. APIs — Modified

### 3.1 Customer Catalog

| Method | Endpoint | Change |
|--------|----------|--------|
| GET | `/categories` | Require `marketplaceTab`; filter by `visibleTabs` |
| GET | `/categories/:id/products` | Return **listings** for tab, not raw products |
| GET | `/products` | Tab-scoped listing results |
| GET | `/products/:id` | Return master product + **active listing for tab** |
| GET | `/search` | Filter by `marketplaceTab`; index listing docs |
| GET | `/storefront/:tab/home` | Tab param renamed; sections reference listings |

### 3.2 Cart

| Method | Endpoint | Change |
|--------|----------|--------|
| GET | `/cart` | Include `marketplaceTab`; items show listingId + delivery promise |
| POST | `/cart/items` | Body: `{ listingId, quantity }` — not productId |
| PATCH | `/cart/items/:id` | Validate listing still active |
| DELETE | `/cart/items/:id` | Unchanged |
| DELETE | `/cart` | Unchanged |

### 3.3 Orders

| Method | Endpoint | Change |
|--------|----------|--------|
| POST | `/orders` | Snapshot listing on each line; store delivery promise |
| GET | `/orders` | Filter `?marketplaceTab=` |
| GET | `/orders/:id` | Include listing snapshots + promise |
| GET | `/orders/:id/tracking` | SLA-aware tracking for quick tabs |
| POST | `/orders/:id/cancel` | Unchanged logic |

### 3.4 Seller Products (becomes two-step)

| Method | Endpoint | Change |
|--------|----------|--------|
| GET | `/seller/products` | List master products with listing summary per tab |
| POST | `/seller/products` | Create **master product only** (no price on quick tabs yet) |
| PUT | `/seller/products/:id` | Update master fields only |
| GET | `/seller/products/:id` | Master + all listings |

### 3.5 Seller Inventory

| Method | Endpoint | Change |
|--------|----------|--------|
| PATCH | `/seller/inventory/:productId` | Updates master stock; triggers listing availability refresh |
| GET | `/seller/inventory` | Show per-tab availability derived from listings |

### 3.6 Admin Catalog

| Method | Endpoint | Change |
|--------|----------|--------|
| GET/POST/PUT | `/admin/catalog/categories` | `visibleTabs[]` instead of `commerceFlows[]` |
| GET | `/admin/catalog/products` | Master product queue |
| PATCH | `/admin/catalog/products/:id/approve` | Approves **master** only |

### 3.7 Admin Orders & Reports

| Method | Endpoint | Change |
|--------|----------|--------|
| GET | `/admin/orders` | Filter `marketplaceTab`; show delivery promise |
| GET | `/admin/reports/*` | Tab dimension on all commerce reports |

### 3.8 Delivery

| Method | Endpoint | Change |
|--------|----------|--------|
| GET | `/delivery/orders` | Show SLA deadline for quick commerce |
| PATCH | `/delivery/orders/:id/pickup` | SLA breach flag if past promise |
| PATCH | `/delivery/orders/:id/deliver` | Record actual vs promised duration |

### 3.9 Coupons & Deals

| Method | Endpoint | Change |
|--------|----------|--------|
| POST | `/coupons/validate` | Validate tab applicability |
| GET | `/deals` | Tab-scoped flash sales |
| POST | `/seller/coupons` | `applicableTabs[]` |
| CRUD | `/admin/coupons` | Tab scope |

### 3.10 Wishlist

| Method | Endpoint | Change |
|--------|----------|--------|
| POST | `/users/me/wishlist` | Body: `{ listingId }` |
| GET | `/users/me/wishlist` | Returns listing-aware items |

---

## 4. APIs — New

### 4.1 Customer Listing Resolution

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/listings/:id` | Public | Single listing detail with master product embed |
| GET | `/products/:id/listings` | Public | All active listings for product (compare tabs) |
| GET | `/marketplace/tabs` | Public | Active tabs + delivery model metadata |
| GET | `/marketplace/serviceability` | Public | `?tab=&pincode=` — is tab deliverable to pincode |

### 4.2 Seller Listings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/seller/listings` | Seller | List all listings with filters |
| POST | `/seller/products/:productId/listings` | Seller | Create listing for a tab |
| GET | `/seller/listings/:id` | Seller | Listing detail |
| PUT | `/seller/listings/:id` | Seller | Update price, promise, visibility |
| PATCH | `/seller/listings/:id/publish` | Seller | Submit for moderation |
| PATCH | `/seller/listings/:id/unpublish` | Seller | Hide listing |
| DELETE | `/seller/listings/:id` | Seller | Soft delete listing |

### 4.3 Admin Listings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/listings` | Admin | Moderation queue |
| GET | `/admin/listings/:id` | Admin | Detail |
| PATCH | `/admin/listings/:id/approve` | Admin | Approve listing |
| PATCH | `/admin/listings/:id/reject` | Admin | Reject with note |
| PATCH | `/admin/listings/:id/suspend` | Admin | Suspend active listing |
| GET | `/admin/marketplace/config` | Admin | Tab configuration |
| PUT | `/admin/marketplace/config/:tab` | Admin | Update tab rules |
| PATCH | `/admin/vendors/:id/mithilak-eligible` | Admin | Grant Mithilak tab access |
| PATCH | `/admin/vendors/:id/quick-commerce-eligible` | Admin | Grant quick shop access |

### 4.4 Admin Delivery Rules

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/delivery/sla-rules` | Admin | Quick commerce SLA config |
| PUT | `/admin/delivery/sla-rules` | Admin | Update promise tiers |

**New endpoints:** ~22

---

## 5. APIs — Deprecated

| Method | Endpoint | Replacement | Sunset |
|--------|----------|-------------|--------|
| GET | `/products/:id` (price without tab) | `GET /products/:id?marketplaceTab=` | CR-2 + 2 releases |
| POST | `/seller/products` (with price + commerceFlows) | Master + listing two-step | CR-2 + 2 releases |
| GET | `/storefront/:flow/home` (flow param) | `/storefront/:tab/home` | Alias retained |
| Any | `?commerceFlow=` | `?marketplaceTab=` | Alias retained |

---

## 6. Request/Response Examples

### 6.1 Create Master Product (Seller)

```http
POST /api/v1/seller/products
{
  "title": "Aashirvaad Atta 5kg",
  "sku": "ASH-ATTA-5KG",
  "categoryId": "...",
  "description": "...",
  "images": [...]
}
```

Response: `{ productId, masterStatus: "pending" }` — no price, no tab.

### 6.2 Create Listing (Seller)

```http
POST /api/v1/seller/products/{productId}/listings
{
  "marketplaceTab": "quick_shop",
  "price": 249,
  "mrp": 280,
  "deliveryPromiseMinutes": 20
}
```

### 6.3 Customer Product Detail

```http
GET /api/v1/products/{id}?marketplaceTab=quick_shop
```

```json
{
  "product": { "title": "...", "images": [], "rating": 4.5 },
  "listing": {
    "listingId": "...",
    "price": 249,
    "mrp": 280,
    "deliveryPromiseMinutes": 20,
    "deliveryLabel": "Delivery in 20 minutes"
  }
}
```

### 6.4 Add to Cart

```http
POST /api/v1/cart/items
{ "listingId": "...", "quantity": 2 }
```

---

## 7. Error Codes (New)

| Code | HTTP | When |
|------|------|------|
| `LISTING_NOT_FOUND` | 404 | listingId invalid |
| `LISTING_NOT_APPROVED` | 409 | listing not sellable |
| `CART_TAB_MISMATCH` | 409 | item tab ≠ cart tab |
| `DELIVERY_PROMISE_REQUIRED` | 422 | quick tab listing missing promise |
| `TAB_NOT_ALLOWED` | 403 | seller not eligible for tab |
| `PINCODE_NOT_SERVICEABLE` | 422 | quick commerce not available at address |
| `MASTER_PRODUCT_NOT_APPROVED` | 409 | cannot publish listing until master approved |

---

## 8. OpenAPI Update Scope

When implemented, update `config/swagger.js` with:
- New `MarketplaceTab` enum schema
- `MarketplaceListing` schema
- Modified `CartItem`, `Order`, `OrderItem` schemas
- Deprecation notices on legacy params

---

## 9. Endpoint Count Summary

| Status | Count |
|--------|-------|
| Unchanged | ~56 |
| Modified | ~38 |
| New | ~22 |
| Deprecated | ~5 |
| **Total after CR-001** | **~232** |
