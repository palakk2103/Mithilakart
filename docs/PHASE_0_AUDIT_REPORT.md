# Phase 0 — Codebase Audit Report

**Project:** Mithilakart MERN Marketplace  
**Date:** 2026-07-22  
**Scope:** Quick Commerce + E-commerce end-to-end flows across Customer, Seller, Delivery Boy, and Admin panels  
**Test baseline:** `cd backend && npm test` → **18 suites / 35 tests PASS** (no delivery/order E2E, no frontend E2E)

---

## Executive Summary

The codebase has a **solid backend skeleton** (orders, payments, Socket.IO, geo APIs, delivery assignment) but is **not production-ready** for the target flows described in the master prompt. Quick Commerce works only partially; E-commerce courier fulfillment is **mock-only** (Shiprocket is an empty stub). Several **blocker-level schema/query mismatches** prevent correct product discovery by commerce type. The seller Accept/Reject step is effectively bypassed because payment confirmation auto-advances orders to `confirmed`.

| Area | Overall Status |
|------|----------------|
| Seller onboarding & product listing | **Partially working** |
| Customer discovery (Quick Commerce) | **Partially working / Broken filters** |
| Cart / checkout / payment | **Working** (Razorpay + COD; mock fallback in dev) |
| Order routing to seller | **Working** |
| Seller notification & accept/reject | **Partially working** |
| Delivery boy assignment | **Partially working** |
| E-commerce / Shiprocket | **Missing** |
| Automated E2E tests | **Missing** |
| Production readiness claims in `docs/INTEGRATION_AUDIT_REPORT.md` | **Overstated** |

---

## Architecture Map

| Component | Path | Notes |
|-----------|------|-------|
| Backend API | `backend/src/` | Express, MongoDB, Redis, Socket.IO |
| Frontend (4 portals in one SPA) | `frontend/src/modules/{user,seller,delivery,admin}/` | React 19 + Vite |
| Order model | `backend/src/models/Order.js` | Uses `commerceFlow` + `fulfilmentType` — **no `orderType` field** |
| Product model | `backend/src/models/Product.js` | Uses `commerceFlows[]` array |
| Quick commerce flows | `quick_shop`, `fresh_grocery` | Mapped from seller UI `deliveryMode: quick_commerce` |
| E-commerce flows | `standard`, `mithilak` | Mapped from seller UI `deliveryMode: ecommerce` |

**Terminology mismatch (spec vs code):**

| Master prompt | Codebase equivalent |
|---------------|---------------------|
| `orderType: 'quick_commerce'` | `commerceFlow` ∈ `{quick_shop, fresh_grocery}` + `fulfilmentType: local_delivery` |
| `orderType: 'e_commerce'` | `commerceFlow` ∈ `{standard, mithilak}` + `fulfilmentType: courier` |
| Status `placed` | Status `pending` (pre-payment) → `confirmed` (post-payment) |

---

## End-to-End Flow Audit

### 1. Seller Onboarding & Product Listing

| Step | Status | Evidence |
|------|--------|----------|
| Seller address + lat/lng at registration | **Partially working** | `Seller.js` L39–55 stores `addressLine`, `latitude`, `longitude`, GeoJSON `location`; `SellerAuthService.js` L58–78 geocodes if coords missing — but **lat/lng not required** (can remain null) |
| Seller selects order type at product creation | **Partially working** | `AddProduct.jsx` L17–21, L317–346: UI `deliveryMode` (quick_commerce / ecommerce / both) → `commerceFlows[]`; **not enforced server-side** (`seller.validator.js` L20: `commerceFlows` optional) |
| Quick Commerce products carry seller location | **Partially working** | Proximity uses **seller document** location via `SellerRepository.findNearby`, not product-level coords (acceptable if seller always has location — but location is optional) |
| `serviceableRadius` on quick products | **Missing (stored only)** | Saved in `attributes.serviceableRadius` (`AddProduct.jsx` L186–187) — **never read** in backend geo queries |

### 2. Customer Discovery

| Step | Status | Evidence |
|------|--------|----------|
| Quick Commerce proximity filtering | **Partially working** | API: `GET /maps/nearby/products` → `NearbyService.nearbyProducts` (`NearbyService.js` L79–122); subcategory page uses it when GPS available (`QuickShopSubcategory.jsx` L74–104) |
| Main Quick Shop home page | **Broken (hardcoded catalog)** | `QuickShop.jsx` L9–24 imports static product images; L262–314 hardcoded offer products; L148–181 simulated countdown timer — **does not call nearby API** |
| Category taxonomy (9 nav categories) | **Partially working** | Categories loaded from API by `commerceFlow` (`AddProduct.jsx` L88–90, `QuickShop.jsx` L130–133); Quick Shop home uses **legacy hardcoded category names** in fresh-grocery branch (`QuickShop.jsx` L216–224) |
| Filter products by commerce type in catalog | **Broken** | `ProductService.listPublic` filters on field `commerceFlow` (`ProductService.js` L21–22) but Product schema has **`commerceFlows` array** (`Product.js` L28–31) — filter never matches |
| Nearby products commerce filter | **Broken** | Same bug: `NearbyService.js` L86 uses `{ commerceFlow: query.commerceFlow }` against wrong field |
| "Not deliverable" when no nearby seller | **Missing** | `QuickShopSubcategory.jsx` L102–104 silently falls through to non-proximity category listing; no user-facing undeliverable state |
| E-commerce pan-India listing (no proximity) | **Working** | Standard catalog `/products`, `/categories/:id/products` without geo filter |

### 3. Order Placement

| Step | Status | Evidence |
|------|--------|----------|
| Cart / checkout | **Working** | `Checkout.jsx`, `CartService.js`, `OrderService.placeOrder` |
| COD payment | **Working** | `PaymentService.js` L86–98 marks paid immediately; triggers `confirmOrder` |
| Razorpay payment + signature verify | **Working** | `RazorpayPaymentProvider.js` L33–47 HMAC verify; `PaymentService.verifyPayment` L159–195 |
| Order created with correct flow type | **Partially working** | Order stores single `commerceFlow` from checkout (`Checkout.jsx` L178, `Order.js` L11–15) — multi-flow cart not validated |
| Order status after payment | **Partially working** | Becomes `confirmed`, not spec's `placed`; seller accept step skipped (see §4) |
| Routed to owning seller only | **Working** | `orderItemRepository` scopes by `sellerId`; `order.placed` event fan-out per seller (`OrderService.js` L366–373) |
| Idempotency | **Working** | `OrderService.js` L66–77, payment idempotency tested |

### 4. Seller Notification & Accept/Reject

| Step | Status | Evidence |
|------|--------|----------|
| Real-time notification to seller | **Working** | `order.placed` → Socket.IO `new_order` to `seller:{sellerId}` (`SocketGateway.js` L68–76) |
| Audible ring alert | **Working** | `useSellerOrderStream.js` L16–18 calls `playOrderAlert()` |
| Seller Accept / Reject UI | **Broken (happy path)** | `OrderDetail.jsx` L16–24: Accept/Reject only on `pending`; but paid orders auto-`confirmOrder` → **`confirmed`** (`OrderService.confirmOrder` L238–241) — sellers land on "Mark as Packed" only |
| Status → packed after seller confirms packing | **Working** | Seller PATCH status `packed` → triggers delivery (`OrderService.js` L710–716) |
| Seller reject from confirmed | **Missing** | No reject action once order is `confirmed` |

### 5. Delivery Boy Assignment

| Step | Status | Evidence |
|------|--------|----------|
| Visible to delivery boys on `packed` | **Working** | `notifyNearbyPartnersForOrder` called when seller sets `packed` |
| Geo-radius assignment | **Partially working** | Uses **customer address** coords, not seller location (`DeliveryOrderService.js` L331–338) — spec requires seller-location radius |
| Nearby online partners query | **Working** | `DeliveryPartnerRepository.findNearbyOnline` — MongoDB `$near` |
| Fallback when none nearby | **Partially working** | Falls back to **any** online partner globally (`DeliveryOrderService.js` L342–347) — masks "no coverage" |
| First-accept-wins (race condition) | **Broken** | `acceptOrder` read-check-write without conditional atomic update (`DeliveryOrderService.js` L141–173; `DeliveryAssignmentRepository` has no `findOneAndUpdate` with `partnerId: null`) |
| Order disappears from other queues on accept | **Partially working** | `findAvailable` returns `partnerId: null` pending — accepted orders have `partnerId` set, but race can assign duplicate |
| Pickup → `picked_up` / shipped | **Working** | OTP pickup flow (`DeliveryOrderService.confirmPickup`) |
| Deliver with OTP | **Working** | `confirmDelivery` |
| Live location to customer | **Working** | `updateLocation` → `delivery.location_updated` → socket `location_update` (`SocketGateway.js` L127–137); customer map in `OrderDetail.jsx` |

### 6. E-commerce / Shiprocket Flow

| Step | Status | Evidence |
|------|--------|----------|
| E-commerce products pan-India | **Partially working** | Products tagged via `commerceFlows`; listing filter broken (see §2) |
| Shiprocket auth / token refresh | **Missing** | `ShiprocketShippingProvider.js` — empty subclass, no API |
| Order push to Shiprocket | **Missing** | `BaseCourierShippingProvider.createShipment` generates **mock AWB** (`BaseCourierShippingProvider.js` L24–41) |
| AWB / courier assignment | **Missing (mock only)** | Mock AWB like `SHI12345678` |
| Pickup scheduling | **Missing** | — |
| Webhook / polling status sync | **Missing** | `trackShipment` returns static `in_transit` |
| Shipping label / invoice | **Missing** | — |
| Serviceability (pincode) check | **Missing** | — |
| Customer tracking from Shiprocket | **Broken** | Customer timeline uses internal statuses only (`OrderDetail.jsx` L16–23); no AWB/courier integration |
| Courier failure handling | **Broken** | E-commerce courier failure **falls back to local delivery** (`OrderService.js` L358–362) — wrong for pan-India orders |

### 7. SLA (Quick Commerce ≤ 1 day)

| Step | Status | Evidence |
|------|--------|----------|
| Delivery time target | **Missing** | Hardcoded UI `"14 mins"` in `QuickShopSubcategory.jsx` L92 |
| Hard ceiling enforcement | **Missing** | No SLA timers or breach handling in backend |
| Undeliverable address UX | **Missing** | Silent fallback to non-nearby catalog |

---

## Panel Connectivity Audit

| Panel | Data source | Mock / hardcoded remnants |
|-------|-------------|---------------------------|
| **Customer** | Live APIs (`customerApi`, `catalogApi`, `ordersApi`) | `QuickShop.jsx` static products; `ProductCard.jsx` placeholder image; `OrderDetail.jsx` L77–78 falls back to store orders on error |
| **Seller** | Live APIs (`sellerApi`) | Delivery mode UI present; defaults to `ecommerce` |
| **Delivery** | Live APIs + Socket.IO | **Hardcoded** `"FreshMart Vendor"` in `OrderDetail.jsx` L357 |
| **Admin** | Live APIs | Prior audit doc claims 100% — admin largely wired |

**Legacy dead route:** `backend/src/routes/v1/seller.orders.routes.js` returns **501** for GET orders (superseded by `seller.routes.js` but still mounted risk if duplicated).

---

## Security & Auth Audit

| Check | Status | Evidence |
|-------|--------|----------|
| Customer routes guarded | **Working** | `orders.routes.js`, `payments.routes.js` use `authenticateCustomer()` |
| Seller routes guarded + scope | **Working** | `seller.routes.js`: auth + `requireActiveSeller` + `requireSellerContext`; isolation tested |
| Delivery routes guarded | **Working** | `delivery.routes.js`: auth + `requireApprovedPartner` |
| Admin RBAC | **Working** | `requirePermission` on admin routes; unit tests present |
| Maps API public | **Minor gap** | `maps.routes.js` — no auth (acceptable for geocode, but exposes seller/product locations) |
| Razorpay webhook signature | **Working** | `PaymentService.handleRazorpayWebhook` L205–209 |
| Payment signature on verify | **Working** | HMAC in `RazorpayPaymentProvider` |
| Cross-portal token reuse blocked | **Working** | Portal-specific JWT verification in `authMiddleware.js` |
| Sensitive data in responses | **Minor** | Dev OTP exposed when `EXPOSE_OTP_IN_DEV=true` (intentional for dev) |
| Secrets in repo | **Major** | `docs/INTEGRATION_AUDIT_REPORT.md` L46 contains **live MongoDB credentials** in plaintext |

---

## Silent Failures & Error Handling

| Issue | Severity | Location |
|-------|----------|----------|
| E-commerce shipment failure silently falls back to local delivery | **Blocker** | `OrderService._afterOrderConfirmed` L358–362 |
| Nearby product fetch failure silently falls back | **Major** | `QuickShopSubcategory.jsx` L102–104 |
| Customer order detail falls back to cached/wrong order | **Major** | `OrderDetail.jsx` L76–78 |
| `commerceFlow` filter silently returns empty/wrong results | **Blocker** | `ProductService.js`, `NearbyService.js` |
| No atomic delivery accept | **Blocker** | `DeliveryOrderService.acceptOrder` |
| Seller proximity query loads **all** sellers into memory | **Major (scale)** | `SellerRepository.findNearby` L42–57 — O(n) haversine, not `$geoNear` |
| Legacy seller orders route 501 if hit | **Minor** | `seller.orders.routes.js` |

Global error envelope exists (`AppError`, async handlers on controllers). Frontend loading/error states are **inconsistent** — seller/delivery order pages have them; Quick Shop home has neither for static content.

---

## Test Infrastructure Audit

| Layer | Framework | Coverage | Gap |
|-------|-----------|----------|-----|
| Backend unit/integration | Jest (18 files, 35 tests) | Auth, payment idempotency, order inventory, OTP, RBAC, seller isolation | **No** delivery accept race tests, **no** order flow integration, **no** Shiprocket, **no** geo API tests in Jest |
| Backend E2E scripts | Node scripts (`e2e-live-test.js`, `e2e-full-report.js`) | Manual/CI-adjacent | Not Jest; not in `npm test` |
| Frontend E2E | **None** | — | No Cypress, Playwright, or Vitest |
| Single command full E2E | **Missing** | — | No `npm run test:e2e` |

---

## Gap Register (Ranked by Severity)

### Blockers

| ID | Gap | Files |
|----|-----|-------|
| B1 | **Shiprocket integration is mock-only** — no real courier API, AWB, tracking, webhooks | `ShiprocketShippingProvider.js`, `BaseCourierShippingProvider.js` |
| B2 | **`commerceFlow` vs `commerceFlows` schema mismatch** breaks product discovery and nearby filtering | `ProductService.js` L22, `NearbyService.js` L86, `Product.js` L28 |
| B3 | **Seller Accept/Reject bypassed** — payment auto-confirms order before seller action | `OrderService.confirmOrder`, `OrderDetail.jsx` L16–24 |
| B4 | **Delivery accept race condition** — not atomic; two partners can accept same order | `DeliveryOrderService.acceptOrder` L136–177 |
| B5 | **No automated E2E test suite** (Playwright/Cypress + flow integration tests) | `frontend/package.json`, `backend/tests/` |
| B6 | **Quick Shop home page uses hardcoded catalog**, not proximity API | `QuickShop.jsx` |
| B7 | **E-commerce courier failure incorrectly routes to local delivery** | `OrderService.js` L358–362 |

### Major

| ID | Gap | Files |
|----|-----|-------|
| M1 | Delivery partner search uses **customer address**, not **seller location** | `DeliveryOrderService.notifyNearbyPartnersForOrder` L331–338 |
| M2 | `serviceableRadius` stored but never enforced in geo queries | `AddProduct.jsx`, no backend consumer |
| M3 | Seller lat/lng **optional** — proximity silently degrades | `Seller.js`, `SellerAuthService.js` |
| M4 | `commerceFlows` **not required** on product create (backend) | `seller.validator.js` L20 |
| M5 | No **"not deliverable to this address"** UX or API | `QuickShopSubcategory.jsx`, checkout |
| M6 | Seller proximity uses in-memory haversine over all sellers — won't scale | `SellerRepository.findNearby` |
| M7 | Customer e-commerce tracking is **static internal timeline**, not Shiprocket status | `OrderDetail.jsx` |
| M8 | **MongoDB credentials committed** in documentation | `docs/INTEGRATION_AUDIT_REPORT.md` L46 |
| M9 | Delivery fallback broadcasts to **any online partner** when none nearby | `DeliveryOrderService.js` L342–347 |
| M10 | Fresh grocery / Quick Shop **hardcoded category names** vs canonical taxonomy | `QuickShop.jsx` L216–224 |
| M11 | Hardcoded vendor name in delivery UI | `delivery/pages/OrderDetail.jsx` L357 |
| M12 | No Shiprocket env config (`SHIPROCKET_*`) in `.env.example` | `backend/.env.example` |

### Minor

| ID | Gap | Files |
|----|-----|-------|
| m1 | Spec `orderType` / `placed` status naming differs from implementation | `Order.js`, `commerce.js` |
| m2 | Legacy `seller.orders.routes.js` 501 stubs still present | `seller.orders.routes.js` |
| m3 | Maps endpoints unauthenticated | `maps.routes.js` |
| m4 | Image placeholder URLs (`via.placeholder.com`) | `ProductCard.jsx`, `mappers.js` |
| m5 | Simulated flash-sale countdown on Quick Shop | `QuickShop.jsx` L148–181 |
| m6 | Prior `INTEGRATION_AUDIT_REPORT.md` claims 100% production readiness — contradicted by this audit | `docs/INTEGRATION_AUDIT_REPORT.md` |
| m7 | `picked_up` status not in order enum — uses `shipped` instead | `commerce.js`, `DeliveryOrderService.js` L197 |

---

## Phase 0 Verification Log

```text
Command: cd backend && npm test
Result:  18 passed, 18 total suites; 35 passed, 35 total tests
Date:    2026-07-22
Note:    Tests do NOT cover quick-commerce E2E, delivery race, Shiprocket, or frontend flows
```

---

## Recommended Phase 1 Priority Order

1. Fix `commerceFlows` filtering (B2) — unblocks discovery  
2. Fix order status machine for seller accept/reject (B3)  
3. Atomic delivery accept + seller-location radius (B4, M1)  
4. Replace Quick Shop hardcoded catalog with nearby API + undeliverable state (B6, M5)  
5. Remove e-commerce → local delivery fallback (B7)  
6. Enforce seller location + required `commerceFlows` (M3, M4)  

Phase 2 should implement real Shiprocket (B1) before declaring e-commerce production-ready.  
Phase 3 must add Jest integration tests + Playwright E2E (B5).

---

## Phase 0 Conclusion

**Do not proceed to production.** The backend payment and socket infrastructure is usable, but Quick Commerce discovery, seller accept semantics, delivery assignment atomicity, and all Shiprocket functionality require substantive work. The existing documentation overstates readiness; this audit should be treated as the authoritative gap list for Phases 1–4.
