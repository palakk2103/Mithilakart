# CR-002 — 10: Implementation Plan

**Status:** Not started. Phase 4 is gated on the decisions in §1.
**Sequencing rule:** every phase ends with `TEST -> VERIFY -> AUDIT` before the next begins. No phase is merged with another.

---

## 1. Gate — Decisions Required Before Any Code

| # | Decision | Options | Recommendation |
|---|---|---|---|
| **D1** | Cross-seller product identity (`01` §2) | A: nullable `catalogKey` · B: full master-catalog refactor · C: drop cross-seller fallback | **A** |
| **D2** | Warehouse representation | Seller with `isWarehouse: true` · separate `Warehouse` collection | **Seller flag** |
| **D3** | Dynamic ETA vs. fixed listing promise (`01` §3.1) | Compute order ETA in the engine, keep listing promise as a prep-time input · change listing validation | **Compute in engine** |
| **D4** | Engine timing | Async after payment authorisation · synchronous in checkout | **Async** |

D1 is genuinely blocking: it determines the schema, the eligibility engine, the reservation keying, the admin surface, and roughly half the test matrix. D2–D4 have safe defaults but change the shape of the work if reversed later.

---

## 2. Phase Sequence

The CR's 16-step order is grouped into 12 phases so each ends at an independently testable, independently revertible boundary.

| Phase | Scope | New files | Modified files | Risk |
|---|---|---|---|---|
| **P0** | Foundations: constants, error codes, event names, config keys/defaults | `constants/fulfillment.js` | `constants/errorCodes.js`, `constants/platformSettings.js`, `events/eventTypes.js`, `utils/AppError.js` | **Low** — additive only |
| **P1** | Schema + migration | `models/OrderFulfillment.js`, `models/FulfillmentAttempt.js`, repositories, `scripts/migrate-cr002.js` | `models/Product.js`, `models/Seller.js`, `models/Order.js`, `models/DeliveryAssignment.js`, `models/MarketplaceConfig.js` | **Low** — every field optional/defaulted |
| **P2** | `FulfillmentConfigService` (resolution + snapshot) | `services/fulfillment/FulfillmentConfigService.js` | `services/platform/PlatformConfigService.js` | Low |
| **P3** | `SellerEligibilityService` — 13 conditions + complete-cart check | `services/fulfillment/SellerEligibilityService.js` | `repositories/SellerRepository.js`, `repositories/ProductRepository.js` (new read queries only) | **Medium** — pure logic, heavily tested |
| **P4** | `FulfillmentReservationService` — atomic all-or-nothing | `services/fulfillment/FulfillmentReservationService.js` | none | **CRITICAL** — wraps existing primitive; 100 % branch coverage required |
| **P5** | `SellerRankingService` + `RoutingService` | `services/fulfillment/SellerRankingService.js`, `services/maps/RoutingService.js` | `bootstrap/container.js` | Medium |
| **P6** | `FulfillmentEngineService` — orchestration, attempts, fallback ladder | `services/fulfillment/FulfillmentEngineService.js` | none yet | **CRITICAL** |
| **P7** | Wire into order flow | `services/fulfillment/FulfillmentSweeper.js` | `services/orders/OrderService.js` (`_afterOrderConfirmed` branch), `bootstrap/container.js`, `server.js` (sweeper start) | **CRITICAL** — highest regression risk in CR-002 |
| **P8** | Seller accept/reject API | `services/seller/SellerOrderService.js`, `controllers/seller/SellerOrderController.js` | `routes/v1/seller.orders.routes.js` (replaces two `501` stubs) | **Low** — replacing `501` cannot break a caller |
| **P9** | Delivery partner ranked offers | `services/fulfillment/DeliveryPartnerRankingService.js` | `services/delivery/DeliveryOrderService.js` | Medium — **default stays `broadcast`** |
| **P10** | Realtime events + customer projection | none | `realtime/SocketGateway.js`, `services/realtime/*StreamService.js`, `services/orders/OrderService.js` | Medium |
| **P11** | Admin config + monitor API | `services/admin/AdminFulfillmentService.js`, controller | `routes/v1/admin.platform.routes.js` | Low |
| **P12** | Frontend | — | `Checkout.jsx`, `OrderConfirmation.jsx`, `profile/OrderDetail.jsx`, seller order pages, delivery pages, admin settings | Medium |

**P4, P6, and P7 are the three phases that carry real risk.** P7 in particular edits `_afterOrderConfirmed()`, which is on the live path for *every* order in the system.

---

## 3. Phase Detail — the critical three

### P4 — Atomic Reservation

The entire phase is one service with two public methods:

```js
async reserveCompleteCart({ seller, requiredItems, attempt, session })
async releaseAttempt({ attempt, session })
```

Constraints, enforced by review and by test:
- Calls **only** `ProductRepository.reserveStock` / `releaseReservedStock`. No new query, no new field, no direct `Product.updateOne`.
- Items sorted by `productId` before reserving (deadlock-free ordering).
- On any failure, releases in reverse order, then returns `{ ok: false }` — it never throws past its own boundary, so a failed candidate is an ordinary control-flow outcome rather than an exception that could abort the whole fulfillment.
- Writes `attempt.reservations[]` before returning success, so a crash is always recoverable.

Exit criteria: T-01–T-04, T-17–T-19, T-31, T-32 pass; 100 % branch coverage on this file.

### P6 — Engine

Implements `05_CR002_Fulfillment_Algorithm.md` §2 exactly. Contains **no** direct DB access — all state through repositories, all rules through `FulfillmentConfigService`, all reservations through P4.

Exit criteria: T-05–T-13, T-34–T-37 pass.

### P7 — Wiring (highest regression risk)

The only edit to `OrderService`:

```js
// _afterOrderConfirmed(), inside the existing `if (useLocalDelivery && this.deliveryOrderService)` branch
await this.orderRepository.updateById(order._id, { fulfilmentType: 'local_delivery' }, session);

// NEW — additive, guarded, non-throwing
if (this.fulfillmentEngineService && await this.fulfillmentEngineService.isEnabledForTab(tab)) {
  this.fulfillmentEngineService.start(order._id).catch((err) =>
    logger.error({ err, orderId: order._id }, 'Fulfillment engine start failed'));
}
```

Three deliberate properties:
1. **Guarded by injection** — if `fulfillmentEngineService` is not wired, behaviour is byte-identical to today.
2. **Guarded by config** — `quickCommerceEnabled` + tab check.
3. **Non-blocking, non-throwing** — a `.catch` on the promise means an engine fault can never fail order placement or roll back a paid order.

The `else` branch (courier for standard tabs) is **not touched at all**. T-38 asserts this.

Exit criteria: full regression suite at baseline failure count; `e2e-quick-commerce` and `e2e-ecommerce-shiprocket` both still green.

---

## 4. Per-Phase Exit Checklist

Applied identically to every phase:

1. New unit tests for the phase pass.
2. Full suite re-run; failure count **equals baseline** (6 suites / 7 tests) — not "fewer than before", exactly equal.
3. `npm run lint` clean.
4. Manual smoke of any affected panel.
5. Phase committed separately, on a branch, revertible in isolation.

---

## 5. Rollout Safety

CR-002 ships **dark**. After full deployment, live behaviour is unchanged until an operator flips flags:

| Flag | Ship default | Effect when off |
|---|---|---|
| `crossSellerSubstitutionEnabled` | `false` | No seller substitution; engine resolves to the cart's own seller, then warehouse/courier |
| `deliveryAssignmentMode` | `'broadcast'` | Delivery flow identical to today |
| `routingProviderEnabled` | `false` | Haversine ETA; no Google Distance Matrix cost |
| `warehouseFallbackEnabled` | `true` | No-op until a seller is marked `isWarehouse` |
| `courierFallbackEnabled` | `true` | Matches existing behaviour |

Suggested enablement order: internal test tab -> `routingProviderEnabled` -> warehouse designation -> `crossSellerSubstitutionEnabled` on a curated category -> `deliveryAssignmentMode: ranked`.

**Rollback:** revert the P7 commit alone. The engine stops being invoked; all other CR-002 code becomes inert; new DB fields are ignored by the old code (all optional). No data migration is needed to roll back.

---

## 6. Estimated Effort

| Phase | Backend | Tests |
|---|---|---|
| P0 | 0.5 d | 0.5 d |
| P1 | 1.5 d | 0.5 d |
| P2 | 1 d | 0.5 d |
| P3 | 2 d | 2 d |
| P4 | 1.5 d | **2.5 d** |
| P5 | 2 d | 1 d |
| P6 | 3 d | **3 d** |
| P7 | 1.5 d | **2 d** |
| P8 | 2 d | 1 d |
| P9 | 2 d | 1 d |
| P10 | 1.5 d | 1 d |
| P11 | 2 d | 1 d |
| P12 | 4 d | 1 d |
| **Total** | **~24.5 d** | **~17 d** |

≈ **41 developer-days**, excluding D1 catalog curation, which is an ongoing business/data workstream rather than an engineering task.

The test-to-code ratio is deliberately near 1:1 on P4/P6/P7 — those three phases are where a defect means overselling, double-charging, or a broken checkout.

---

## 7. Out of Scope

Explicitly not in CR-002, recorded so they are not mistaken for omissions:

- Split orders / multi-seller fulfillment (CR-002 forbids it).
- Replacing `EventBus` with a distributed broker (R3) — pre-existing limitation.
- Wiring a real queue adapter into `QueueManager` — the sweeper design deliberately avoids needing one.
- Fixing the 6 pre-existing failing test suites.
- Making the pre-existing hardcoded values in `07` §8.1 configurable, except the one call site the ranked-offer path necessarily replaces.
- Automated catalog matching (GTIN/ML) to populate `catalogKey`.
- Refactoring `Product` into a true shared catalog (Option B).

---

## 8. Definition of Done

CR-002 is complete only when all of the following are demonstrated **with evidence**, not asserted:

- [ ] All 38 test cases in `09` pass
- [ ] Concurrency proven at **Layer 2** (real MongoDB), not only Layer 1
- [ ] Regression suite at exactly the baseline failure count
- [ ] Complete-cart selection verified: no partial reservation in any scenario
- [ ] Seller, warehouse, and courier fallback each verified end-to-end
- [ ] Dynamic ETA verified with routing both enabled and disabled
- [ ] Admin controls verified live, including snapshot immutability (T-28)
- [ ] All four panels smoke-tested
- [ ] Existing Shiprocket and standard e-commerce flows verified unchanged
- [ ] No hardcoded business rule introduced (grep audit)
- [ ] No duplicate architecture introduced (inventory / realtime / maps / settings / courier)
- [ ] Final report states measured results, known limitations, and residual risks — production readiness claimed **only** on the strength of that evidence
