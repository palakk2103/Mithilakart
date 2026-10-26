# CR-002 — Intelligent Fulfillment & Hybrid Delivery

**Change Request ID:** CR-002
**Status:** Phase 1–3 complete (inspection + impact analysis). **Phase 4 implementation gated on decision D1.**
**Date:** 2026-08-18
**Baseline commit:** `ec177a8`
**Applies to:** Backend Master Plan v1.0, CR-001 marketplace listing architecture

---

## Document Index

| # | Document | Purpose |
|---|----------|---------|
| 01 | [Impact Analysis](./01_CR002_Impact_Analysis.md) | Module-by-module impact matrix, blocking conflict, risks |
| 02 | [Current Architecture](./02_CR002_Current_Architecture.md) | What actually exists, verified by source inspection |
| 03 | [Database Changes](./03_CR002_Database_Changes.md) | Collections, fields, indexes, migration |
| 04 | [API Changes](./04_CR002_API_Changes.md) | Endpoint deltas and security contract |
| 05 | [Fulfillment Algorithm](./05_CR002_Fulfillment_Algorithm.md) | Eligibility, ranking, atomic reservation, fallback ladder, ETA |
| 06 | [State Machine](./06_CR002_State_Machine.md) | Fulfillment lifecycle and event mapping |
| 07 | [Admin Configuration](./07_CR002_Admin_Configuration.md) | Settings audit — extend vs. new |
| 08 | [Error Handling](./08_CR002_Error_Handling.md) | Error codes, safe messages, traceability |
| 09 | [Testing Strategy](./09_CR002_Testing_Strategy.md) | 38 test cases, concurrency design, baseline |
| 10 | [Implementation Plan](./10_CR002_Implementation_Plan.md) | 12 phases, rollout safety, definition of done |
| 11 | [Implementation Report](./11_CR002_Implementation_Report.md) | **INTERIM** — P0–P8 results, defects found, remaining risks |

---

## The One Blocking Issue

CR-002 requires that when Seller A cannot supply the complete cart, Seller B — who stocks *the same products* — becomes eligible.

The implemented schema has **no cross-seller product identity**:

- `Product.sellerId` is required; `{ sellerId, sku }` is unique
- `stock` / `reservedStock` live on `Product`, so inventory is per (seller, product)
- `MarketplaceListing` is unique on `{ productId, marketplaceTab }`
- `CartItem.sellerId` is denormalised at add-to-cart time

There is no key by which the engine can ask *"which other sellers stock this same thing?"* Without resolving this, seller fallback is unimplementable — any "next seller" would be the same seller.

**Recommended: Option A** — a nullable, indexed `Product.catalogKey`. Purely additive; when null, behaviour is exactly as today. See [01 §2](./01_CR002_Impact_Analysis.md).

---

## What Already Exists and Is Reused

| Capability | Where | CR-002 usage |
|---|---|---|
| Atomic stock reservation | `ProductRepository.reserveStock` (conditional `$expr` + `$inc`) | Reused verbatim — no second inventory system |
| Courier provider adapter | `getProvider('shipping')`, `CourierShipmentService` | Courier fallback — no direct Shiprocket coupling |
| Admin settings store | `PlatformSetting` + `PlatformConfigService` | All new rules — no duplicate settings system |
| Geo seller lookup | `SellerRepository.findNearby` (2dsphere + haversine) | Candidate discovery |
| Realtime | `eventBus` + `SocketGateway` rooms | 6 new events, 9 reused |
| Order idempotency | `idempotencyKey`, `updateStatusOptimistic` | Reused for duplicate protection |

---

## What Does Not Exist and Must Be Built

| Gap | Evidence |
|---|---|
| Cross-seller catalog identity | `models/Product.js` — `sellerId` required |
| Seller accept/reject workflow | `routes/v1/seller.orders.routes.js` — `GET /seller/orders` returns `501` |
| Durable scheduler | `queues/QueueManager.js` — stub, no adapter ever registered |
| Warehouse entity | zero references in `src/` |
| Route ETA | maps layer has geocoding only; distance is straight-line haversine |
| Ranked delivery assignment | current model is broadcast + first-come-first-served |

The missing scheduler is why every CR-002 timeout is designed as a **persisted deadline plus an idempotent sweeper**, not `setTimeout`.

---

## Non-Negotiable Constraints

- ONE CHECKOUT = ONE FULFILLMENT SOURCE — no split orders, no partial reservations
- Reservations are all-or-nothing; any failure releases everything already taken
- Backend decides fulfillment; the frontend may only request
- Historical orders are immutable against later config changes (`configSnapshot`)
- No duplicate architecture: inventory, realtime, maps, settings, courier all reused
- No hardcoded business rules — the 30-second search timeout is `quickFulfillmentSearchTimeoutSeconds`

---

## Baseline Test State (measured, not assumed)

```
Test Suites: 6 failed, 24 passed, 30 total
Tests:       7 failed, 73 passed, 80 total
```

Four failures are `Cannot find module 'cloudinary'` (declared in `package.json`, not installed); two are pre-existing OTP assertion failures. **None relate to CR-002.** Acceptance is measured against this baseline — see [09 §1](./09_CR002_Testing_Strategy.md).

---

## Gate to Implementation — DECIDED 2026-08-18

| # | Decision | Outcome |
|---|---|---|
| D1 | Cross-seller product identity | **Option A** — nullable, indexed `Product.catalogKey` |
| D2 | Warehouse representation | **`Seller.isWarehouse = true`** |
| D3 | Dynamic ETA vs. fixed listing promise | **Compute order ETA in the engine**; listing validation untouched |
| D4 | Engine timing | **Async, after payment authorisation** |

Phase 4 implementation is unblocked. Estimated effort: **~41 developer-days** across 12 phases, shipping dark behind feature flags.

### Implementation progress

| Phase | Scope | Status |
|---|---|---|
| P0 | Foundations — constants, error codes, events, config keys | **done** |
| P1 | Schema + migration | **done** |
| P2 | `FulfillmentConfigService` | **done** |
| P3 | `SellerEligibilityService` | **done** |
| P4 | `FulfillmentReservationService` (atomic) | **done** — 100% branch coverage |
| P5 | Ranking + routing | **done** |
| P6 | `FulfillmentEngineService` | **done** |
| P7 | Wire into order flow | **done** |
| P8 | Seller offer accept/reject API | **done** |
| P9 | Delivery partner ranked offers | pending |
| P10 | Realtime socket fanout | pending |
| P11 | Admin config + monitor API | pending |
| P12 | Frontend | pending |

**Test state after P8:** 287 tests, 285 passing. The 2 failures are the
pre-existing OTP suites recorded in [09 §1](./09_CR002_Testing_Strategy.md) and
are unrelated to CR-002.

### Corrections made during implementation

| Finding | Impact |
|---|---|
| `GET /seller/orders` is **not** `501` — it works. The `501` stubs are in the unreferenced `seller.orders.routes.js`. | P8 rescoped: existing list/detail endpoints left untouched; only offers + accept/reject added. See [02 §7](./02_CR002_Current_Architecture.md). |
| `Number(null) === 0` passes `Number.isFinite` | Would have made every seller's `preparationTimeMinutes: null` read as 0, so every quick-commerce ETA came out too short. Fixed via `src/utils/numeric.js`. |
| `cloudinary` was installed into `node_modules` mid-session | 4 integration suites that failed at baseline now pass. An environment change, not a CR-002 effect. |
