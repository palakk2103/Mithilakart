# CR-001 Implementation Report

**Change Request:** CR-001 — Marketplace Listings (per-tab pricing & delivery promises)  
**Date:** 2026-07-22  
**Status:** CR-1 + CR-2 core complete (CR-3 deferred)

---

## Summary

Delivery commitment and tab-specific pricing now live on **Marketplace Listing**, not Product. The same master product can appear on multiple tabs (Mithilakart, Mithilak, Quick Shop, Groceries & Fresh) with independent price, promise, and visibility.

| Tab | Canonical key | Legacy `commerceFlow` |
|-----|---------------|----------------------|
| Mithilakart | `mithilakart` | `standard` |
| Mithilak | `mithilak` | `mithilak` |
| Quick Shop | `quick_shop` | `quick_shop` |
| Groceries & Fresh | `groceries_fresh` | `fresh_grocery` |

---

## Backend Delivered

### New modules
- `marketplace_listings` + `marketplace_config` models and repositories
- `MarketplaceEngineService` — tab rules, seller eligibility
- `MarketplaceListingService` — seller CRUD, public catalog, cart resolution
- Public routes: `GET /api/v1/marketplace/tabs`, `/marketplace/listings`, etc.
- Seller routes: `POST /api/v1/seller/products/:productId/listings`, listing publish/unpublish
- Admin routes: listing moderation (approve/reject/suspend)
- Migration: `npm run migrate:cr001` — seeds config, backfills listings from `commerceFlows`, sets `visibleTabs` on categories

### Integrated services
- **Cart** — accepts `{ listingId, marketplaceTab }` or legacy `{ productId, commerceFlow }`; enforces single-tab cart (`CART_TAB_MISMATCH`)
- **Orders** — snapshots `marketplaceTab`, `deliveryType`, `deliveryPromiseMinutes`, `estimatedDeliveryAt`, `listingSnapshot` on line items
- **Catalog** — `ProductService` / `CategoryService` dual-read with `marketplaceTab` query param
- **Nearby** — quick-commerce nearby API returns listing-aware items with `deliveryPromiseMinutes`

### Schema additions
- `Category.visibleTabs[]`
- `Seller.mithilakEligible`, `quickCommerceEligible`, `groceryEligible`
- `Product.masterStatus`
- `Cart` / `CartItem` / `Order` / `OrderItem` listing fields

---

## Frontend Delivered

- **Seller Add Product** — marketplace tab picker + quick promise dropdown (15/20/25/30 min); creates listings after master product
- **Seller API** — listing CRUD helpers in `sellerApi.js`
- **Admin Category Manager** — `visibleTabs` synced with commerce flow toggles; updated labels
- **Cart utils** — `getMarketplaceTab()`, listing-aware `addProductToCart`
- **Checkout** — passes `marketplaceTab` on order placement
- **Quick Shop subcategory** — ETA from `deliveryPromiseMinutes` when available
- **Product mappers** — `listingId`, `marketplaceTab`, `deliveryPromiseMinutes` on cards

---

## Test Results

```
backend: npm test → 26 suites, 56 tests passed
```

Includes new unit tests for `marketplaceTab` utils.

---

## Setup / Migration

1. **Seed auth** (seller tab eligibility for demo seller):
   ```bash
   cd backend && node scripts/seed-auth.js
   ```

2. **Backfill listings** (existing products → listings):
   ```bash
   cd backend && npm run migrate:cr001
   ```

3. **Re-seed demo seller** if already exists — run `seed-auth.js` again to set `quickCommerceEligible`, `groceryEligible`, `mithilakEligible`.

---

## Deferred (CR-3)

- Search index on listings
- Wishlist `listingId`
- Admin reports by `marketplaceTab`
- Deprecation headers on legacy `commerceFlow` params
- Full seller listing edit UI on product edit page
- Customer catalog pages passing `marketplaceTab` on all product list fetches

---

## Key API Examples

```http
GET /api/v1/marketplace/tabs
GET /api/v1/marketplace/listings?marketplaceTab=quick_shop&categoryId=...
POST /api/v1/cart/items  { "listingId": "...", "quantity": 1 }
POST /api/v1/orders      { "addressId": "...", "marketplaceTab": "quick_shop", "paymentMethod": "cod" }
POST /api/v1/seller/products/:id/listings  { "marketplaceTab": "quick_shop", "price": 99, "mrp": 120, "deliveryPromiseMinutes": 20 }
```
