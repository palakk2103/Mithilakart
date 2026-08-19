# CR-002 — 09: Testing Strategy

**Runner:** Jest 29 + supertest, `--runInBand` (existing config). Conventions follow `tests/unit/services/*.test.js` and `tests/integration/e2e-*.test.js`: hand-built in-memory repository doubles, `jest.mock('../../src/database')` for `withTransaction`, `MemoryRedisClient` for cache.

---

## 1. Baseline (measured 2026-08-18, before any CR-002 change)

```
Test Suites: 6 failed, 24 passed, 30 total
Tests:       7 failed, 73 passed, 80 total
```

| Failing suite | Cause | CR-002 related |
|---|---|---|
| `integration/health.test.js` | `Cannot find module 'cloudinary'` | no |
| `integration/metrics.test.js` | same | no |
| `integration/auth/auth.test.js` | same | no |
| `integration/shipping/serviceability.test.js` | same | no |
| `unit/services/otp.service.test.js` | rate-limit assertion resolves instead of rejecting | no |
| `unit/services/delivery-otp.service.test.js` | OTP single-use assertion resolves instead of rejecting | no |

`cloudinary` is declared in `package.json` but not installed in `node_modules`. **Acceptance is measured against this baseline**, not against zero failures. CR-002 must not increase the failure count; fixing these six is out of scope (and the `cloudinary` one is an `npm install`, not a code change).

---

## 2. Regression Gate — must stay green

| Suite | Protects |
|---|---|
| `e2e-ecommerce-shiprocket.test.js` | Mithilakart/Mithilak -> courier -> Shiprocket |
| `e2e-quick-commerce.test.js` | Full quick pipeline incl. OTP, earnings |
| `e2e-concurrency.test.js` | Partner accept race, webhook race, optimistic locking, idempotency |
| `orders/order-flow.test.js` | Placement, confirmation, cancellation |
| `order.service.test.js` | Order service unit behaviour |
| `inventory.service.test.js` | Stock management |
| `seller-isolation.test.js` | Seller data isolation |
| `delivery-accept.test.js` | Delivery accept race |
| `courier-shipment.service.test.js` | Shipment payload |

These run **unmodified**. If CR-002 requires editing any of them, that is a signal the change is not additive and must be re-reviewed.

---

## 3. The 30 Mandated Test Cases

New suites under `tests/unit/services/fulfillment/` and `tests/integration/fulfillment/`.

### 3.1 Seller selection — complete-cart rule

| # | Case | Assertion |
|---|---|---|
| T-01 | One product, one seller | Seller selected; 1 item reserved; `fallbackLevel = 0` |
| T-02 | Three products, one seller has all | Seller selected; **all 3** reserved atomically |
| T-03 | Seller missing one product | Seller **not** selected; `SELLER_MISSING_PRODUCT`; **zero** reservations against it |
| T-04 | Seller has all products but insufficient qty on one | Not selected; `SELLER_INSUFFICIENT_QUANTITY`; zero reservations |
| T-05 | Seller offline (`isAcceptingOrders: false`) | Excluded; `SELLER_NOT_ACCEPTING` |
| T-06 | Seller outside `sellerSearchRadiusKm` | Excluded; `SELLER_OUT_OF_RADIUS` |
| T-07 | Seller rejects offer | All reservations released; next candidate offered |
| T-08 | Seller acceptance timeout | Sweeper releases all; next candidate offered; **order not duplicated** |
| T-09 | Second seller succeeds after first rejects | `fallbackLevel = 1`; exactly one seller holds reservations |
| T-10 | All sellers fail | Escalates to `warehouse_pending` |

T-03 and T-04 are the core of the CR: assert `reserveStock` was **never called** for the seller, not merely that the order went elsewhere. A partial reservation that is later rolled back would still be a specification violation.

### 3.2 Fallback ladder

| # | Case | Assertion |
|---|---|---|
| T-11 | Warehouse fulfils | `fulfillmentSource = 'warehouse'`, `fallbackLevel = 2`, `deliveryMode` still quick |
| T-12 | Warehouse cannot fulfil | Escalates to `courier_pending`; `WAREHOUSE_UNAVAILABLE` |
| T-13 | Courier fallback | `fulfillmentType = 'courier'`, `deliveryMode = 'standard'`, quick ETA **cleared**, all local reservations released |

T-13 also asserts the negative: no quick-commerce ETA survives into a courier-fulfilled order.

### 3.3 Payment

| # | Case | Assertion |
|---|---|---|
| T-14 | Payment success | Fulfillment starts exactly once |
| T-15 | Payment failure | Fulfillment **never** starts; reservations released |
| T-16 | Duplicate payment callback | Existing idempotency holds; **one** fulfillment; **no** second charge |

### 3.4 Concurrency — MANDATORY

| # | Case | Assertion |
|---|---|---|
| T-17 | Two concurrent orders, ample stock | Both succeed |
| T-18 | **Last-unit race (A=1,B=1,C=1; two customers order A+B+C)** | Exactly **one** succeeds; other falls back; zero overselling; zero negative stock; zero partial reservation |
| T-19 | Duplicate order request, same `idempotencyKey` | One order, one fulfillment |

### 3.5 Delivery partner

| # | Case | Assertion |
|---|---|---|
| T-20 | Partner rejects | Added to `rejectedBy[]`; next partner offered |
| T-21 | Partner timeout | Offer expires; reassigned |
| T-22 | No partner available | `DELIVERY_NOT_AVAILABLE`; order stays `packed`; seller notified; **not** cancelled |

### 3.6 Resilience

| # | Case | Assertion |
|---|---|---|
| T-23 | Realtime disconnect mid-fulfillment | State advances correctly in DB; `sync_state` on reconnect returns truth |
| T-24 | Customer refreshes during fulfillment | `GET /orders/:id/fulfillment` returns real current state |
| T-25 | Routing provider failure | Haversine ETA used; order completes; `MAP_SERVICE_UNAVAILABLE` logged, **not thrown** |
| T-26 | Courier API failure | `COURIER_SERVICE_UNAVAILABLE`; fulfillment `failed`; admin alerted |

### 3.7 Configuration and history

| # | Case | Assertion |
|---|---|---|
| T-27 | Admin changes timeout/radius/weights | New fulfillments use new values without restart (cache invalidated) |
| T-28 | Historical order snapshot | Changing config **does not** alter a completed order's ETA, fees, commission, or delivery charge |

### 3.8 Security

| # | Case | Assertion |
|---|---|---|
| T-29 | Seller A requests Seller B's order / accepts B's offer | `403`; no data leak |
| T-30 | Delivery partner requests unassigned order | `403` |

### 3.9 Additional cases required by the design

| # | Case | Assertion |
|---|---|---|
| T-31 | Crash after reserve, before offer | Sweeper releases exactly `attempt.reservations[]`; stock restored exactly |
| T-32 | Sweeper runs twice concurrently | No double release (`releasedAt` guard); stock correct |
| T-33 | Client sends `sellerId` / `deliveryCharge` / `estimatedDelivery` in `POST /orders` | Values **ignored**; server decision unaffected |
| T-34 | `catalogKey` null on all items | No cross-seller substitution attempted; behaviour identical to today |
| T-35 | `crossSellerSubstitutionEnabled = false` | Substitution skipped even where keys exist |
| T-36 | Seller accepts twice (same `attemptId`) | Idempotent; single state transition |
| T-37 | Seller accepts after timeout already fired | `409 FULFILLMENT_OFFER_EXPIRED`; no double reservation |
| T-38 | Standard tab order (`mithilakart`) | Engine **not invoked**; existing courier path taken unchanged |

T-38 is the guard that CR-002 did not leak into the standard e-commerce flow.

---

## 4. Concurrency Test Design

Faithfully reproducing the last-unit race requires real atomicity, and `tests/*` currently mock `withTransaction` to `callback(null)` — i.e. **no real session**. Two layers are therefore needed:

**Layer 1 — unit (fast, always runs).** A repository double whose `reserveStock` mimics MongoDB's conditional-update semantics: a synchronous compare-and-increment that returns `matchedCount: 0` when `stock - reservedStock < qty`. Interleaving is driven deterministically so both orderings (X-wins-A, Y-wins-A) are exercised.

**Layer 2 — integration against real MongoDB (opt-in).** Guarded by `describe.skipIf(!process.env.MONGO_TEST_URI)`. Runs N concurrent `placeOrder` calls against a real replica set and asserts, after settling:

```
stock >= 0
reservedStock >= 0
successfulOrders === floor(initialStock / requiredQty)
sum(reservations) === reservedStock
```

Layer 1 keeps CI green without infrastructure; Layer 2 is what actually proves the transactional claim. **Reporting rule: any production-readiness claim about concurrency must cite a Layer 2 run.** A Layer 1 pass proves the algorithm, not the database behaviour.

---

## 5. Coverage Targets

| Component | Target | Rationale |
|---|---|---|
| `FulfillmentReservationService` | **100 %** branch | Correctness-critical; rollback paths must all be exercised |
| `SellerEligibilityService` | **100 %** branch | 13 conditions, each with a pass and fail case |
| `FulfillmentEngineService` | ≥ 90 % | Orchestration |
| `SellerRankingService` | ≥ 90 % | Includes weight normalisation and redistribution |
| `RoutingService` | ≥ 85 % | Includes provider-failure fallback |
| New controllers/routes | ≥ 80 % | |

---

## 6. Execution Order per Phase

Per the CR's "TEST, VERIFY, AUDIT, THEN CONTINUE" rule, each implementation phase in `10_CR002_Implementation_Plan.md` ends with:

1. New unit tests for that phase pass.
2. **Full regression suite** re-run; failure count must equal the baseline (6 suites / 7 tests).
3. Lint clean (`npm run lint`).
4. Manual smoke of the affected panel.

No phase begins until the previous one clears all four.

---

## 7. What These Tests Do Not Prove

Stated explicitly so the final report cannot overclaim:

- Layer 1 concurrency tests do not prove MongoDB transactional behaviour — only Layer 2 does.
- No load/soak testing of the fulfillment engine is included (k6 exists in the repo but has no fulfillment scenario).
- Multi-instance event delivery is untested because `EventBus` is in-process by design (R3).
- Real Shiprocket and real Google Maps are mocked throughout; provider contract changes are not detected.
- `catalogKey` correctness is a **data-quality** property; no test can prove that two products are genuinely the same item.
