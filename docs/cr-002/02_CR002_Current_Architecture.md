# CR-002 — 02: Current Architecture (Verified by Inspection)

**Status:** Analysis complete — no code written
**Inspection date:** 2026-08-18
**Method:** Direct source reading of `backend/src` (362 JS files, ~23k LOC) and `frontend/src`. Nothing below is assumed; every claim cites a file.

---

## 1. Stack Facts

| Fact | Value |
|---|---|
| Backend language | **JavaScript (CommonJS)** — *not* TypeScript |
| Framework | Express 4 |
| ODM | Mongoose 8 (MongoDB) |
| Realtime | Socket.IO 4 **and** SSE (two parallel mechanisms) |
| Cache | ioredis + `MemoryRedisClient` fallback |
| Payments | Razorpay + `MockPaymentProvider` |
| Courier | Shiprocket behind a provider adapter |
| Maps | Google Geocoding + Nominatim fallback |
| Queue/scheduler | **Stub only — no adapter wired** |

---

## 2. Layering Convention (must be followed by CR-002)

```
routes/v1/*.routes.js
  -> controllers/<domain>/*Controller.js      (asyncHandler + ApiResponse)
    -> services/<domain>/*Service.js          (extends BaseService, business logic)
      -> repositories/*Repository.js          (extends BaseRepository, all DB access)
        -> models/*.js                        (Mongoose schemas)
```

Cross-cutting: `utils/AppError`, `constants/*`, `events/EventBus`, `core/providers.registry`, `bootstrap/container.js` (manual DI — constructor injection via an object literal).

---

## 3. Marketplace Model (CR-001, implemented)

`src/constants/marketplace.js`

| Tab | Delivery model |
|---|---|
| `mithilakart` | `standard` |
| `mithilak` | `standard` |
| `quick_shop` | `fixed_promise` |
| `groceries_fresh` | `fixed_promise` |

Legacy `commerceFlow` values (`standard`, `mithilak`, `quick_shop`, `fresh_grocery`) are still carried on `Order` and `Cart` and bidirectionally mapped in `utils/marketplaceTab.js`. **Both representations are live** — CR-002 must not drop either.

`MarketplaceEngineService.validateListingCommercialFields()` hard-restricts quick-commerce listings to `deliveryPromiseMinutes` in `{15, 20, 25, 30}`.

---

## 4. Catalog & Inventory — the decisive structural facts

### 4.1 Products are seller-owned

`src/models/Product.js`
```js
sellerId: { type: ObjectId, ref: 'Seller', required: true },
sku:      { type: String, required: true },
stock:    { type: Number, default: 0, min: 0 },
reservedStock: { type: Number, default: 0, min: 0 },
```
Unique index: `{ sellerId, sku }` (partial, `deletedAt: null`).

There is **no cross-seller catalog identity**. "Aashirvaad Atta 5kg" sold by Seller A and by Seller B are two unrelated `Product` documents with different `_id`s, different SKUs, and independent stock. Despite CR-001 calling `products` the "Master Product", it is still scoped to exactly one seller (`docs/change-requests/CR-001/03_Database_Architecture.md` line 103: `_id, sellerId`).

### 4.2 Listings are one-per-product-per-tab

`src/models/MarketplaceListing.js`
```js
marketplaceListingSchema.index(
  { productId: 1, marketplaceTab: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
```
Because `productId` is already seller-scoped, this yields exactly one listing per (seller, product, tab).

### 4.3 Inventory lives on `products.stock` / `products.reservedStock`

`src/repositories/ProductRepository.js` — this is the **existing atomic reservation primitive and it is correct**:

```js
async reserveStock(productId, quantity, session) {
  const result = await this.model.updateOne(
    { _id: productId, deletedAt: null,
      $expr: { $gte: [{ $subtract: ['$stock', '$reservedStock'] }, quantity] } },
    { $inc: { reservedStock: quantity } }
  );            // matchedCount === 0 -> throws AppError.outOfStock
}
async releaseReservedStock(productId, quantity, session)  // guarded $inc -qty
async decrementStock(productId, quantity, session)        // stock -qty AND reservedStock -qty
```

Single-document conditional update — no read-then-write race. CR-002 **reuses this verbatim**; it must not introduce a second inventory mechanism.

---

## 5. Cart

`src/models/CartItem.js` stores `productId`, `listingId`, **`sellerId`** (denormalised at add-time from `product.sellerId`), `quantity`, `unitPrice`, `deliveryPromiseMinutes`.

`CartService.addItem()` pins `state.marketplaceTab` on the first item and rejects items from a different tab. **A cart is therefore already hard-bound to specific sellers' product documents at add-to-cart time.**

---

## 6. Order Placement (`services/orders/OrderService.js`)

`placeOrder()` inside `withTransaction`:
1. Idempotency check on `idempotencyKey`.
2. `_releaseStalePendingOrders(userId)`.
3. Build cart.
4. **Loop `reserveStock(productId, qty)` per item** — no all-or-nothing grouping, no seller choice.
5. Create `Order` + `OrderItem[]` + tracking + status history.
6. `paymentService.initiatePayment()`; if PAID -> `confirmOrder()`.

`confirmOrder()` -> `decrementStock` per item, status `PLACED`, then `_afterOrderConfirmed()`:
- quick tabs -> set `fulfilmentType: 'local_delivery'` and stop
- otherwise -> `courierShipmentService.createForOrder()` -> `fulfilmentType: 'courier'`

**ETA today:** `promiseMinutes = max(item.deliveryPromiseMinutes)`, `estimatedDeliveryAt = now + promiseMinutes`. Entirely listing-driven; no distance, no preparation time, no routing.

**Seller selection today:** none. The seller is whoever owns the cart's products.

### 6.1 Order state machine (`_isValidStatusTransition`)

```
pending -> placed -> confirmed -> packed -> shipped -> out_for_delivery -> delivered
```
Strictly `toIdx === fromIdx + 1`. `cancelled` allowed from anything except `delivered`. **No rejection, reassignment, or fulfillment-failure state exists.**

---

## 7. Seller Order Workflow — accept/reject absent

> **Correction (2026-08-18, during implementation).** An earlier revision of this
> document stated that `GET /seller/orders` returns `501 Not Implemented`. That
> was **wrong** and is corrected below. The `501` stubs live in
> `src/routes/v1/seller.orders.routes.js`, a file whose exported
> `createSellerOrdersRoutes` is **never called anywhere** — it is dead code. The
> live routes are registered by `createSellerRoutes`.

**Live routes** — `src/routes/v1/seller.routes.js:38-48`:
```js
router.get('/orders',        ...sellerScope, controllers.orders.listOrdersForSeller);
router.get('/orders/:id',    ...sellerScope, controllers.orders.getOrderDetailForSeller);
router.patch('/orders/:id/status', ..., controllers.orders.updateOrderStatusAsSeller);
```

All three are **implemented and working** (`OrderService.listOrdersForSeller:534`,
`getOrderDetailForSeller:574`, `updateStatusAsSeller`). `updateStatusAsSeller()`
authorises by "seller owns at least one `OrderItem` on this order", applies
optimistic locking (`updateStatusOptimistic`), and on `confirmed`/`packed` for
local delivery calls `notifyNearbyPartnersForOrder()`.

**What is genuinely missing is only accept/reject and an acceptance timeout.**
"Accept" is currently approximated by the `placed -> confirmed` transition.

**Consequence for CR-002:** the working list/detail endpoints must be left
alone. CR-002 adds three new routes and touches none of the existing three.

**Dead code noted:** `seller.orders.routes.js` is unreferenced. Removing it is
out of CR-002 scope but it should not be mistaken for the live surface.

---

## 8. Delivery Partner Assignment (`DeliveryOrderService`)

- `DeliveryAssignment` is **one per order** (`{ orderId: 1 }` unique) with `partnerId` nullable.
- `notifyNearbyPartnersForOrder()` finds online partners within a **hardcoded 10 000 m / limit 20** and emits `delivery.order_available` to all of them.
- `listOrders()` shows `findAvailable(20)` to every online partner.
- `acceptOrder()` is a **race-to-claim**: `acceptByOrderId` returns null if already taken -> `AppError.conflict`.
- Reject -> `partnerId: null`, status back to `pending`, re-broadcast.

**Model is broadcast + first-come-first-served.** There is no ranking, no targeted offer, no per-partner timeout.

`DeliveryPartner` has `isOnline`, `latitude/longitude`, `location` (2dsphere), `status`. Workload is not tracked. `DEFAULT_DELIVERY_EARNING_AMOUNT = 50` is a hardcoded constant.

---

## 9. Maps / Location

`services/maps/GeocodingService.js` — `reverseGeocode`, `geocodeAddress`, `buildDirectionsUrl`. Google key optional (`config.maps.apiKey`), Nominatim fallback, 5 s timeout, in-memory TTL cache.

`utils/geoHelper.js` — `haversineKm`.

`SellerRepository.findNearby()` — `$near` on the 2dsphere index with a haversine fallback path; filters `status: 'active', kycStatus: 'approved'`.

**There is no Distance Matrix / Directions ETA call anywhere.** Straight-line haversine is the only distance measure. CR-002's "route ETA" input does not exist yet.

---

## 10. Courier / Shiprocket

`core/providers.registry.js` exposes `getProvider('shipping')`. `CourierShipmentService` builds a normalised payload (`buildShipmentPayload`) and calls `shipping.createShipment()` / `shipping.trackShipment()`. Shiprocket status -> order status mapping lives in `core/providers/shipping/shiprocketStatusMap.js`.

**The adapter boundary CR-002 requires already exists and is clean.** Business logic never imports Shiprocket directly.

---

## 11. Realtime

`events/EventBus.js` is a **bare in-process Node `EventEmitter`** (`EVENT_TYPES` only contains `system.*`). Not persisted, not cross-instance.

Published today (string literals, scattered): `order.placed`, `order.status_changed`, `order.shipment_created`, `order.shipment_failed`, `delivery.order_available`, `delivery.location_updated`, `delivery.otp_created`.

`realtime/SocketGateway.js` — JWT-authenticated Socket.IO, rooms `order:<id>`, `seller:<id>`, `delivery:<id>`, with per-portal authorisation on `join:order`. Emits `new_order`, `status_update`, `new_assignment`, `location_update`, `sync_state`.

`services/realtime/*StreamService.js` — a **second, parallel SSE** path for the same events.

---

## 12. Admin Configuration

`models/PlatformSetting.js` — generic `{ key, value }` key/value store. `services/platform/PlatformConfigService.js` merges `DEFAULT_PLATFORM_SETTINGS` then stored rows then `deliveryRules`, caches under `cache:platform:config` for 60 s, exposes `getPublicConfig()`.

Existing keys (`constants/platformSettings.js`): `platformFee`, `packagingFee`, `minOrderAmount`, `maxDeliveryRadiusKm`, `codEnabled`, `codHandlingFee`, `freeShippingThreshold`, `defaultDeliveryCharge`, `quickCommerceEnabled`, `ecommerceEnabled`, `razorpayEnabled`, `gst`, ...

Write path: `PUT /api/v1/admin/settings` -> `AdminPlatformSettingsService.updateSettings()` -> cache invalidate. **This is the correct extension point — CR-002 adds keys here, it does not create a new settings system.**

`MarketplaceConfig` is a second, tab-scoped config collection (`sellerEligibilityRule`, `minCartValue`, `serviceablePincodes`, `allowedPromiseMinutes`).

`DeliveryChargeRule`, `CommissionRule`, and `TaxConfig` collections already exist.

---

## 13. Errors

`constants/errorCodes.js` defines 19 codes. Relevant existing ones: `OUT_OF_STOCK`, `PAYMENT_FAILED`, `SELLER_OFFLINE`, `DELIVERY_NOT_AVAILABLE`, `ORDER_NOT_FOUND`, `SERVICE_UNAVAILABLE`. `AppError` maps code -> HTTP status and carries `details[]`. The error middleware already strips internals in production.

---

## 14. Scheduling — the gap that shapes the design

`src/queues/QueueManager.js`:
```js
if (!queue || !queue.adapter) {
  logger.debug(..., 'Queue adapter not configured — job skipped (Phase 0 stub)');
  return { queued: false, ... };
}
```
No adapter is ever registered. `jobs/` contains only `BaseJob` and `NotificationDispatchJob`.

**Consequence:** CR-002's three timeouts (fulfillment search, seller acceptance, delivery partner assignment) have no durable timer. In-process `setTimeout` alone would silently drop every pending fulfillment on restart or on a second app instance. The design must be **DB-state-driven with an idempotent sweeper**, with timers as a latency optimisation only.

---

## 15. Frontend Touchpoints

- `frontend/src/modules/user/services/ordersApi.js` — `POST /orders`, `GET /orders/:id`, `GET /orders/:id/tracking`.
- `frontend/src/shared/hooks/useOrderSocket.js`, `modules/seller/hooks/useSellerOrderStream.js`.
- Pages: `user/pages/Checkout.jsx`, `OrderConfirmation.jsx`, `profile/OrderDetail.jsx`; `seller/pages/orders/*`; `delivery/pages/Orders.jsx`; `admin/pages/Orders.jsx`.

Checkout does not currently render any dynamic ETA string.

---

## 16. Baseline Test State (measured, not assumed)

```
Test Suites: 6 failed, 24 passed, 30 total
Tests:       7 failed, 73 passed, 80 total
```

| Failing suite | Cause |
|---|---|
| `integration/health.test.js` | `Cannot find module 'cloudinary'` — dependency declared in `package.json` but **not installed** |
| `integration/metrics.test.js` | same |
| `integration/auth/auth.test.js` | same |
| `integration/shipping/serviceability.test.js` | same |
| `unit/services/otp.service.test.js` | rate-limit assertion resolves instead of rejecting |
| `unit/services/delivery-otp.service.test.js` | OTP single-use assertion resolves instead of rejecting |

These are **pre-existing** and unrelated to CR-002. They are recorded here so post-CR-002 regression results are compared against this baseline, not against an imagined green build.

Passing and directly relevant: `e2e-quick-commerce`, `e2e-ecommerce-shiprocket`, `e2e-concurrency`, `orders/order-flow`, `order.service`, `inventory.service`, `seller-isolation`, `delivery-accept`, `courier-shipment.service`.
