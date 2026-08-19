# CR-002 — 11: Implementation Report (P0–P12 complete; validation pending)

**Status:** All 12 phases implemented. **NOT production ready** — Layer 2 and
migration verification are still outstanding (§9).
**Date:** 2026-08-19
**Baseline commit:** `ec177a8`

> Production readiness is **not** claimed. Code being written is not evidence.
> Four gate items remain unmet, listed in §9.

---

## 1. Decisions Taken

| # | Decision | Outcome |
|---|---|---|
| D1 | Cross-seller product identity | Nullable, indexed `Product.catalogKey` |
| D2 | Warehouse representation | `Seller.isWarehouse = true` |
| D3 | Dynamic ETA | Computed in the engine; listing validation untouched |
| D4 | Engine timing | Async, after payment authorisation |

---

## 2. Test Results (measured 2026-08-19)

```
Test Suites: 45 passed, 45 total
Tests:       402 passed, 402 total
```

**Zero failures.**

### Baseline reconciliation — important

| Point in time | Result | Explanation |
|---|---|---|
| Session start | 6 suites / 7 tests failing | 4 × `Cannot find module 'cloudinary'`; 2 × OTP |
| Mid-session | 2 suites / 2 tests failing | `cloudinary` was installed into `node_modules` **by something outside this work** — an environment change, not a CR-002 fix |
| Now | 0 failing | The 2 OTP suites now pass consistently (verified over 2 consecutive runs). **I did not modify either OTP file** — their earlier failure was environmental (Redis/rate-limit state) |

The two OTP failures are therefore **no longer outstanding**, but their
resolution is **not attributable to CR-002**. Stated plainly rather than
claimed as a fix.

### CR-002 test inventory

| Suite | Tests |
|---|---|
| `fulfillment-config.service` | 23 |
| `seller-eligibility.service` | 37 |
| `fulfillment-reservation.service` | 23 |
| `routing-and-ranking` | 37 |
| `fulfillment-sweeper` | 19 |
| `fulfillment-engine` (integration) | 37 |
| `order-service-wiring` | 13 |
| `container-wiring` | 9 |
| `seller-fulfillment` | 16 |
| `delivery-ranked-offers` | 36 |
| `realtime-fanout` | 18 |
| `admin-fulfillment` | 23 |
| `checkout-cart-clearing` | 12 |
| `cart-update-quantity` | 6 |
| `numeric` utils | 6 |
| **Layer 2** (`tests/layer2`) | **10 — SKIPPED, no DB reachable** |

### Coverage

| File | Stmts | Branch | Target | Met |
|---|---|---|---|---|
| `FulfillmentReservationService` | 100% | **100%** | 100% branch | **yes** |
| `FulfillmentSweeper` | 100% | 93.75% | — | — |
| `FulfillmentConfigService` | 100% | 95.34% | — | — |
| `SellerEligibilityService` | 97.05% | 90% | 100% branch | **no** |
| `SellerRankingService` | 98.87% | 78.94% | ≥90% | **no** |
| `FulfillmentEngineService` | 85.54% | **65.05%** | ≥90% | **no** |

Three coverage targets remain unmet. Remaining uncovered branches are mostly
compare-and-set failure paths and defensive null-guards.

---

## 3. Phases Delivered

| Phase | Scope | Status |
|---|---|---|
| P0 | Constants, error codes, events, config keys | done |
| P1 | Schema + migration script | done (**unexecuted**) |
| P2 | `FulfillmentConfigService` | done |
| P3 | `SellerEligibilityService` | done |
| P4 | `FulfillmentReservationService` | done — 100% branch |
| P5 | Ranking + routing | done |
| P6 | `FulfillmentEngineService` | done |
| P7 | Order-flow wiring | done |
| P8 | Seller offer accept/reject API | done |
| P9 | Delivery partner ranked offers | done |
| P10 | Realtime socket fanout | done |
| P11 | Admin config + monitor API | done |
| P12 | Frontend integration | done — **build passes** |

---

## 4. API Changes

**New**
- `GET /orders/:id/fulfillment` — customer-safe fulfillment state
- `GET /seller/fulfillment/offers`
- `POST /seller/orders/:id/accept`, `POST /seller/orders/:id/reject`
- `GET|PUT /admin/fulfillment/settings`
- `GET /admin/fulfillment/orders`, `GET /admin/fulfillment/orders/:orderId`
- `POST /admin/fulfillment/orders/:orderId/retry`
- `POST /admin/fulfillment/orders/:orderId/force-courier`

**Unchanged** — `POST /orders` request contract, `GET /seller/orders`,
`GET /seller/orders/:id`, `PATCH /seller/orders/:id/status`, all delivery
partner endpoints, `GET|PUT /admin/settings`.

> Correction to the earlier report: `GET /seller/orders` was described as
> returning `501`. It does **not** — the `501` stubs live in the unreferenced
> `seller.orders.routes.js`. The working endpoints were left untouched.

---

## 5. Database Changes

All additive; every existing document remains valid.

- `products.catalogKey` + partial index
- `sellers`: `isWarehouse`, `isAcceptingOrders`, `preparationTimeMinutes`, `fulfillmentRadiusKm`
- `orders`: `fulfillment{}` snapshot block, `platformFee`, `packagingFee`
- `delivery_assignments`: `offeredTo`, `offerExpiresAt`, `rejectedBy`, `offerRound`, plus four fields the code already wrote but the schema silently discarded
- `marketplace_config.fulfillmentOverrides`
- **New collections:** `order_fulfillments`, `fulfillment_attempts`

---

## 6. Frontend Changes

- `shared/hooks/useFulfillmentStatus.js` — polls + socket, server-authoritative
- `shared/components/FulfillmentStatus.jsx` — customer mode/ETA/fallback
- `shared/hooks/useOrderSocket.js` — extended with `fulfillment_update`
- `seller/components/common/FulfillmentOffers.jsx` — offer cards + countdown
- `delivery/components/OfferCountdown.jsx`
- `admin/pages/operations/FulfillmentMonitor.jsx` + route `/admin/fulfillment`
- API layers extended for customer, seller, and admin

Wired into existing pages (`user/profile/OrderDetail`, `seller/orders/OrderList`)
without redesigning them. **`npm run build` passes.**

No frontend authority over price, stock, seller selection, ETA, fulfillment
source, delivery charge, or order status.

---

## 7. Production Bugs Fixed (pre-existing, outside original scope)

### 7.1 Cart never cleared after checkout — **severe**

`placeOrder` did `return withTransaction(...)`, making the cart-clearing block
after it unreachable; the trailing `return result` referenced an undefined
variable. **Every successful order left the customer's cart full.**

Fixed with correct semantics:
- clears **after commit**, never inside the transaction
- clears on COD and on pending/paid Razorpay — the order exists
- **does not** clear on payment failure, creation failure, or rollback
- **does not** clear on "Buy Now" (`items` supplied), which would have deleted
  unrelated cart items
- a clearing failure cannot fail an already-committed order

12 regression tests.

### 7.2 Cart quantity change threw `ReferenceError` — **severe**

`CartService.updateItemQuantity` read `tab`, which was never declared in scope.
**Every quantity change crashed.** Fixed by deriving `tab` exactly as its
sibling methods do. 6 regression tests.

### 7.3 `Number(null) === 0` (CR-002 code, caught by tests)

`Number.isFinite(Number(x))` is true for `null`/`''`/`false`/`[]`. Since
`seller.preparationTimeMinutes` defaults to `null`, preparation time was read
as `0` and **every quick-commerce ETA would have been too short**. Fixed via
`src/utils/numeric.js`.

Repo lint errors: **20 → 16** (the 4 removed were 7.1 and 7.2).

---

## 8. Verification Attempted and Its Limits

| Activity | Result |
|---|---|
| Full backend suite | **402/402 pass** |
| Frontend production build | **passes** |
| Lint on all CR-002 files | **clean** |
| Layer 2 (real MongoDB) | **NOT RUN** — this sandbox has no network egress to Atlas (`ReplicaSetNoPrimary`). Tests are written and skip cleanly. |
| `migrate:cr002 --dry-run` | **NOT RUN** — same connectivity limit |
| End-to-end UI testing | **NOT PERFORMED** — no browser automation available in this environment |

The running dev server was probed: `seller/garbage-xyz` → `404` while
`seller/fulfillment/offers` → `401`, confirming CR-002 routes are registered on
the live process.

---

## 9. Production Gate — Outstanding

| Gate item | Status |
|---|---|
| P9–P12 complete | ✅ |
| Existing checkout regression fixed and tested | ✅ |
| No overselling / partial reservation (Layer 1) | ✅ |
| Seller / warehouse / courier fallback verified (Layer 1) | ✅ |
| Ranked delivery offers verified (Layer 1) | ✅ |
| Realtime + security boundaries verified | ✅ |
| Frontend build verified | ✅ |
| **Real MongoDB Layer-2 verified** | ❌ **BLOCKED — must be run on a networked machine** |
| **Migration dry-run verified** | ❌ **BLOCKED** |
| **Migration verified on staging** | ❌ |
| **End-to-end UI verification** | ❌ — see `12_CR002_E2E_Test_Runbook.md` |
| Engine branch coverage ≥90% | ❌ (65%) |
| Seller Eligibility 100% branch | ❌ (90%) |
| Seller Ranking ≥90% branch | ❌ (79%) |

**Production readiness decision: NOT READY.** Four verification gates and three
coverage targets are unmet.

---

## 10. Remaining Risks

| # | Risk | Severity |
|---|---|---|
| R1 | Atomicity proven only against an in-memory double; real MongoDB behaviour unverified | **High** |
| R2 | Engine branch coverage 65% — untested compare-and-set and escalation edges | **Medium** |
| R3 | `catalogKey` correctness is a data-quality property no test can prove; a wrong key ships the wrong product. Substitution is **off by default** for this reason | **High if enabled prematurely** |
| R4 | Migration never executed | **Medium** |
| R5 | `EventBus` is in-process; multi-instance deployments drop events. Pre-existing | **Medium** |
| R6 | Sweeper runs in every instance; idempotent and CAS-guarded, but untested with two concurrent instances | **Medium** |
| R7 | Frontend verified only by a successful build — no runtime UI testing performed | **Medium** |

---

## 11. Next Actions

1. On a machine with database access: `npm run migrate:cr002 -- --dry-run`, review, then apply to **staging**.
2. `MONGO_TEST_URI=... npm run test:layer2` against a replica set.
3. `npm run seed:cr002-test` on staging, then work through `12_CR002_E2E_Test_Runbook.md`.
   **Enable `crossSellerSubstitutionEnabled` first** — CR-002 ships dark and
   seller-to-seller fallback will not otherwise run.
4. Close the three coverage gaps with real business-branch tests.
5. Re-assess readiness on that evidence.
