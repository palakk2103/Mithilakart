# CR-002 — 01: Impact Analysis

**Change Request:** CR-002 — Intelligent Fulfillment & Hybrid Delivery
**Status:** Analysis complete — implementation **blocked on one decision** (see §2)
**Date:** 2026-08-18
**Baseline:** `main` @ `ec177a8`

---

## 1. Executive Summary

CR-002 asks the platform to choose *who fulfils an order* after checkout, instead of inheriting the seller from whichever products the customer happened to add to the cart.

The existing system is well-built for its current model and **most of CR-002 fits as a genuine extension**:

- the atomic inventory primitive already exists and is race-safe,
- the courier provider/adapter boundary already exists and is clean,
- the platform-settings key/value store is the right home for every new rule,
- geo/2dsphere seller lookup already exists,
- Socket.IO rooms and per-portal authorisation already exist.

Three things do **not** exist and are the real cost of CR-002:

1. **Cross-seller product identity** (§2) — a blocking design decision, not a coding task.
2. **A seller accept/reject workflow with timeout.** *(Corrected 2026-08-18: an earlier revision claimed `GET /seller/orders` returns `501`. It does not — that stub is in the unreferenced `seller.orders.routes.js`. The live list/detail endpoints work and are left untouched; only accept/reject is genuinely missing. See `02` §7.)*
3. **A durable scheduler** — `QueueManager` is an unwired stub, so every CR-002 timeout needs a DB-state-driven sweeper.

---

## 2. BLOCKING CONFLICT — Cross-Seller Product Identity

### 2.1 The conflict

CR-002's central example:

> Seller A: A = available, B = available, C = unavailable -> **not eligible**
> Seller B: A, B, C all available -> **eligible**

This sentence presumes that "Product A" is a **catalog concept multiple sellers can independently stock**.

The implemented schema says otherwise:

| Fact | File | Consequence |
|---|---|---|
| `Product.sellerId` is `required` | `models/Product.js:24` | every product belongs to exactly one seller |
| Unique index `{ sellerId, sku }` | `models/Product.js:59` | the same SKU under two sellers is two documents |
| `stock` / `reservedStock` live on `Product` | `models/Product.js:31-32` | inventory is per (seller, product) by construction |
| Unique index `{ productId, marketplaceTab }` on listings | `models/MarketplaceListing.js:47-50` | one listing per product per tab |
| `CartItem.sellerId` denormalised at add-time | `models/CartItem.js:10` | the cart is already bound to specific sellers |

So today, "the cart" is not a list of *what the customer wants* — it is a list of *specific sellers' inventory rows*. There is no key by which the engine could ask "which other sellers stock this same thing?"

**Without resolving this, CR-002's seller-fallback requirement is unimplementable.** Any "fallback" would only ever be able to re-offer the identical `Product._id`, i.e. the same seller — which is not a fallback at all.

### 2.2 Options

| # | Option | Change size | Risk | Notes |
|---|---|---|---|---|
| **A** | Add a nullable `catalogKey` (or `masterProductId`) to `Product`, indexed. Eligibility groups candidates by it. Products without a key are fulfillable only by their owning seller (exact current behaviour). | Additive field + index + backfill script. No breaking change. | **Low** | Recommended. Degrades safely: unkeyed catalog = today's behaviour. Requires an admin/seller catalog-matching workflow to populate keys (can start manual/CSV, later automated by GTIN/EAN). |
| **B** | True master-catalog refactor: split `Product` into `CatalogProduct` (shared) + `SellerInventory` (per-seller stock/price). | Large. Touches catalog, cart, orders, listings, search, seller panel, admin panel, migration of all existing data. | **High** | This is what CR-001 nominally intended but did not implement. Correct long-term, but it is a re-architecture, and CR-002 explicitly forbids re-architecture. |
| **C** | Scope CR-002 to warehouse + courier fallback only; no cross-seller reassignment. | Small. | Low | Delivers fallback levels 2 and 3 but **not** the headline requirement. |

**Recommendation: Option A.** It satisfies the requirement, is purely additive, and preserves every existing flow byte-for-byte when `catalogKey` is null.

**This decision must be made before Phase 4 begins.** It changes the schema, the eligibility engine, the reservation keying, the admin surface, and the test matrix.

---

## 3. Secondary Conflicts (documented, not silently resolved)

### 3.1 Fixed delivery promise vs. dynamic ETA

`MarketplaceEngineService.validateListingCommercialFields()` **rejects** any quick-commerce listing whose `deliveryPromiseMinutes` is not 15/20/25/30, and `OrderService.placeOrder()` computes the order ETA as `max(item.deliveryPromiseMinutes)`.

CR-002 requires `ETA = routeETA + preparationTime + buffer`.

**Smallest safe change:** keep the listing promise as a *seller-declared preparation/service-level input*, and let the fulfillment engine compute the *order* ETA. `Order.deliveryPromiseMinutes` stays populated for backward compatibility; new fields carry the computed value. No listing validation changes, so the seller panel is untouched.

### 3.2 Linear order state machine

`_isValidStatusTransition` enforces `toIdx === fromIdx + 1` over a 7-state chain. CR-002 needs seller rejection, reassignment, fulfillment failure, and courier downgrade — none of which are forward steps in that chain.

**Smallest safe change:** do not modify `ORDER_STATUS` or the chain. Model fulfillment as a **separate lifecycle** on a new `OrderFulfillment` document. The order stays `placed` while the engine searches, and only advances along the existing chain when a seller actually confirms. Existing seller/admin PATCH endpoints keep working unchanged.

### 3.3 Broadcast delivery assignment vs. ranked offers

Today every online partner within a hardcoded 10 km sees every order and races to claim it. CR-002 wants ranked, targeted offers with per-partner timeout.

**Smallest safe change:** keep `DeliveryAssignment` (one per order) as the system of record and add an *offer* layer on top. The existing accept path — including its race-to-claim guard, which is genuinely correct — remains the final arbiter. Broadcast mode stays available behind a config flag so the current behaviour can be restored instantly.

### 3.4 No warehouse entity

Nothing in `src/models` references a warehouse. Fallback level 2 is net-new.

**Smallest safe change:** model the warehouse as a `Seller` with `isWarehouse: true`, so it inherits inventory, geo, listings, order items, settlement, and the seller panel for free. A separate `Warehouse` collection would duplicate all of it.

### 3.5 EventBus is in-process only

`EventBus` is a bare `EventEmitter`. With more than one app instance, an event published on instance 1 never reaches a socket held by instance 2. This is a **pre-existing** limitation that CR-002 inherits and makes more visible (fulfillment is inherently multi-step and long-running).

**Not in CR-002 scope to fix.** Documented in `16_Risk_Analysis` equivalent (see §7 below). CR-002 must not assume cross-instance delivery; all state transitions are persisted to MongoDB first and emitted second, so a missed event degrades to "UI updates on next poll/refresh", never to lost state.

---

## 4. Impact Matrix

Legend: **UNCHANGED** · **EXTEND** (additive only) · **MODIFY** (existing code paths altered) · **CRITICAL** (correctness/regression risk requiring dedicated tests)

### 4.1 Models

| Model | Impact | Why |
|---|---|---|
| `Product` | **CRITICAL** | Add nullable `catalogKey` + index (Option A). Field is additive, but it becomes the join key for all seller substitution — wrong keys cause wrong-product fulfillment. |
| `Order` | **EXTEND** | Add fulfillment snapshot fields (`fulfillmentSource`, `fallbackLevel`, `fallbackReason`, `warehouseId`, `courierProvider`, `estimatedDeliveryMinutes`, `platformFee`, `packagingFee`, `configSnapshot`). All optional with defaults — existing documents remain valid. |
| `OrderFulfillment` *(new)* | **EXTEND** | New collection. System of record for the fulfillment lifecycle, attempts, and timeout deadlines. |
| `FulfillmentAttempt` *(new)* | **EXTEND** | New collection. One row per seller/warehouse tried; gives full traceability. |
| `Seller` | **EXTEND** | Add `isWarehouse`, `isAcceptingOrders`, `preparationTimeMinutes`, `fulfillmentRadiusKm`. All defaulted to preserve current behaviour. |
| `DeliveryAssignment` | **EXTEND** | Add `offeredTo[]`, `offerExpiresAt`, `rejectedBy[]`. Existing unique `{orderId}` index and accept race guard untouched. |
| `MarketplaceListing` | **UNCHANGED** | No schema change. `deliveryPromiseMinutes` semantics reinterpreted only in the new engine. |
| `Cart` / `CartItem` | **UNCHANGED** | Fulfillment decisions happen after checkout. Cart stays a request, not a decision. |
| `PlatformSetting` | **UNCHANGED** | Generic key/value — new keys need no schema change. |
| `MarketplaceConfig` | **EXTEND** | Optional per-tab overrides for radius/timeouts. |
| All others | **UNCHANGED** | — |

### 4.2 Services

| Service | Impact | Why |
|---|---|---|
| `FulfillmentEngineService` *(new)* | **EXTEND** | The orchestrator. All new logic concentrated here. |
| `SellerEligibilityService` *(new)* | **EXTEND** | The 13 eligibility conditions. Pure and unit-testable. |
| `SellerRankingService` *(new)* | **EXTEND** | Configurable weighted ranking. |
| `FulfillmentReservationService` *(new)* | **EXTEND** | All-or-nothing wrapper **around the existing** `ProductRepository.reserveStock`. Introduces no new inventory mechanism. |
| `RoutingService` *(new)* | **EXTEND** | Route ETA via the existing maps provider + key; haversine/speed fallback when unavailable. |
| `OrderService` | **CRITICAL** | `_afterOrderConfirmed()` gains a branch for quick tabs. Every existing branch must remain reachable and unchanged. This is the single highest-regression-risk edit in CR-002. |
| `DeliveryOrderService` | **MODIFY** | Add ranked offer + timeout. `acceptOrder`, `confirmPickup`, `confirmDelivery`, OTP flow all unchanged. |
| `CourierShipmentService` | **UNCHANGED** | Called as the level-3 fallback exactly as it is called today for standard orders. |
| `InventoryService` | **UNCHANGED** | Seller-panel stock management. Not on the checkout path. |
| `CartService` | **UNCHANGED** | — |
| `PaymentService` | **UNCHANGED** | Fulfillment runs strictly after payment authorisation. No re-charge, ever. |
| `PlatformConfigService` | **EXTEND** | New defaults in `DEFAULT_PLATFORM_SETTINGS`; existing merge/cache logic reused as-is. |
| `MarketplaceEngineService` | **UNCHANGED** | Listing validation untouched (see §3.1). |

### 4.3 API

| Surface | Impact |
|---|---|
| `POST /orders` | **MODIFY** — response gains fulfillment fields. Request contract unchanged. Backend still decides everything. |
| `GET /orders/:id`, `GET /orders/:id/tracking` | **EXTEND** — additive fields only. |
| `GET /seller/orders`, `GET /seller/orders/:id` | **UNCHANGED** — already implemented and working; left alone. |
| `GET /seller/fulfillment/offers` | **EXTEND** — new; live offers for this seller. |
| `POST /seller/orders/:id/accept`, `/reject` | **EXTEND** — new. |
| `PATCH /seller/orders/:id/status` | **UNCHANGED** |
| Delivery partner endpoints | **UNCHANGED** — offer layer sits above them. |
| `GET/PUT /admin/settings` | **UNCHANGED** — new keys flow through the existing generic handler. |
| New admin fulfillment-monitor endpoints | **EXTEND** |

### 4.4 Frontend

| Area | Impact |
|---|---|
| Checkout / OrderConfirmation | **MODIFY** — render backend-supplied `deliveryMode` + `estimatedDeliveryMinutes` instead of any static text. |
| Order tracking | **EXTEND** — handle new fulfillment events. |
| Seller order pages | **EXTEND** — accept/reject UI + countdown. |
| Delivery panel | **EXTEND** — offer countdown. |
| Admin panel | **EXTEND** — fulfillment settings + monitor. |

---

## 5. What CR-002 Explicitly Must NOT Do

| Rule | Enforcement in this design |
|---|---|
| No second inventory architecture | `FulfillmentReservationService` calls `ProductRepository.reserveStock/releaseReservedStock` only. |
| No duplicate realtime system | New events published through the existing `eventBus`; fanout added to the existing `SocketGateway`. |
| No direct Shiprocket coupling | Courier fallback calls `CourierShipmentService` -> `getProvider('shipping')`. |
| No duplicate location architecture | `RoutingService` extends the maps layer and reuses `config.maps.apiKey` and `haversineKm`. |
| No duplicate admin settings | All new rules are `PlatformSetting` keys resolved via `PlatformConfigService`. |
| No hardcoded business rules | Every threshold read from config with a named default constant; no literals in service logic. |
| No split orders | One `OrderFulfillment` per order, one `sellerId`, enforced by the all-or-nothing reservation. |
| Backend is authority | Fulfillment inputs come from the persisted order + cart, never from the request body. |

---

## 6. Regression Surface (must stay green)

| Flow | Guarded by |
|---|---|
| Mithilakart / Mithilak standard checkout -> Shiprocket | `e2e-ecommerce-shiprocket.test.js` |
| Quick Shop full pipeline | `e2e-quick-commerce.test.js` |
| Concurrency / idempotency / optimistic locking | `e2e-concurrency.test.js` |
| Order placement + status transitions | `orders/order-flow.test.js`, `order.service.test.js` |
| Seller data isolation | `seller-isolation.test.js` |
| Delivery accept race | `delivery-accept.test.js` |

All six pass at baseline and **must still pass unmodified** after CR-002.

---

## 7. Open Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | `catalogKey` mismatched -> customer receives a different product than ordered | **High** | Admin-approved matching only; never auto-match on fuzzy title. Substitution restricted to exact key equality. Ship with substitution disabled by default. |
| R2 | Reservation leak if the process dies mid-fulfillment | **High** | Deadline persisted on `OrderFulfillment`; idempotent sweeper releases expired reservations. Reuses the existing `_releaseStalePendingOrders` pattern. |
| R3 | `EventBus` is in-process; multi-instance deployments drop events | **Medium** | Pre-existing. DB is source of truth; events are advisory. Flagged as a known limitation, not fixed by CR-002. |
| R4 | No durable queue -> timeouts depend on a sweeper interval | **Medium** | Sweeper interval configurable; deadlines are absolute timestamps so a late sweep is still correct, just slower. |
| R5 | Google Distance Matrix cost/latency on the checkout path | **Medium** | Cache by rounded coordinate pair; hard timeout; haversine fallback; feature-flagged off by default. |
| R6 | Fulfillment search adds latency to checkout | **Medium** | Engine runs **after** payment authorisation, asynchronously. The customer is never blocked for 30 s. |
| R7 | Baseline suite is not green (`cloudinary` missing) | **Low** | Recorded in `02_CR002_Current_Architecture.md` §16. Compare against baseline, not against zero failures. |

---

## 8. Gate to Phase 4

Implementation must not start until:

1. §2 is decided (Option A / B / C).
2. Warehouse-as-seller (§3.4) is accepted or rejected.
3. Dynamic-ETA reinterpretation (§3.1) is accepted or rejected.
4. It is confirmed that fulfillment runs **after** payment authorisation, asynchronously.
