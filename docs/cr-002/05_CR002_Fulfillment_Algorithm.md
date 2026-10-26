# CR-002 — 05: Fulfillment Algorithm

**Invariant:** ONE CHECKOUT = ONE FULFILLMENT SOURCE. No split orders. No partial reservations.

---

## 1. Entry Points

| Marketplace tab | Path |
|---|---|
| `mithilakart`, `mithilak` | **Unchanged.** `_afterOrderConfirmed()` -> `CourierShipmentService` -> Shiprocket. The engine is not invoked. |
| `quick_shop`, `groceries_fresh` | `_afterOrderConfirmed()` -> `FulfillmentEngineService.start(orderId)` |

The engine is invoked **after payment authorisation**, asynchronously. Checkout latency is unchanged; the customer never waits for the search timeout.

---

## 2. Top-Level Flow

```
start(orderId)
  |
  ├─ load Order + OrderItems + address (server-side only)
  ├─ create OrderFulfillment { state: 'searching', requiredItems[], traceId }
  ├─ resolve config (tab override -> platform setting -> constant default)
  ├─ set searchDeadlineAt = now + quickFulfillmentSearchTimeoutSeconds
  |
  └─ attemptNext(fulfillmentId)
```

```
attemptNext(fulfillmentId)
  |
  ├─ if now > searchDeadlineAt          -> escalate(FULFILLMENT_TIMEOUT)
  ├─ if attemptCount >= maxSellerAttempts -> escalate(NO_SELLER_AVAILABLE)
  |
  ├─ candidates = findEligibleSellers()          // §3
  ├─ if candidates empty                -> escalate(NO_SELLER_AVAILABLE)
  |
  ├─ ranked = rank(candidates)                   // §4
  |
  └─ for candidate in ranked:
        result = reserveCompleteCart(candidate)  // §5 — all-or-nothing
        if result.ok:
           offer(candidate)                      // §6
           return
        else:
           record FulfillmentAttempt{ status:'reservation_failed' }
           excludedSellerIds.push(candidate)
           continue
     escalate(NO_SELLER_AVAILABLE)
```

The loop is important: a candidate that passes the *eligibility read* can still lose the *reservation write* to a concurrent order. That is expected and is the correctness guarantee, not a bug — the reservation, not the read, decides.

---

## 3. Seller Eligibility

A candidate must satisfy **all 13** conditions. Failing one removes the seller entirely — never partially.

| # | Condition | Source |
|---|---|---|
| 1 | `kycStatus === 'approved'` | `sellers` |
| 2 | `status === 'active'` | `sellers` |
| 3 | `isAcceptingOrders === true` | `sellers` (new) |
| 4 | Supports the tab (`quickCommerceEligible` / `groceryEligible`) | `sellers` |
| 5 | Has **every** required item | `products` + `marketplace_listings` |
| 6 | Has sufficient quantity for **every** item | `stock - reservedStock >= qty` |
| 7 | Listing is `approved` + `isVisible` for the tab | `marketplace_listings` |
| 8 | Serviceable to the customer address | pincode / radius |
| 9 | `latitude`/`longitude` present | `sellers` |
| 10 | Within `sellerSearchRadiusKm` | `SellerRepository.findNearby` |
| 11 | Within the seller's own `fulfillmentRadiusKm` (if set) | `sellers` (new) |
| 12 | Not in `excludedSellerIds` | `order_fulfillments` |
| 13 | Passes existing business rules (`MarketplaceEngineService.assertSellerEligibleForTab`) | reused, not reimplemented |

### 3.1 Complete-cart check

```
for each seller S in nearbySellers:
    for each requiredItem I:
        if I.catalogKey is null:
            # not substitutable — only the originally-carted seller qualifies
            if S._id != I.originSellerId: REJECT S; break
            candidateProduct = I.productId
        else:
            candidateProduct = product where catalogKey == I.catalogKey
                                        and sellerId == S._id
                                        and deletedAt is null
            if not found: REJECT S; break

        if (candidateProduct.stock - candidateProduct.reservedStock) < I.quantity:
            REJECT S; break

        listing = listing where productId == candidateProduct._id
                            and marketplaceTab == order.marketplaceTab
        if listing is missing or not approved or not visible: REJECT S; break

    if not rejected: ACCEPT S with its resolved productId map
```

**Consequence of `catalogKey === null`:** a cart of unkeyed products can only ever be fulfilled by its original seller. The engine degrades to today's behaviour and then falls through to warehouse/courier. This is the safe default and is why the `catalogKey` field can ship before any catalog curation exists.

`REJECT S; break` is the literal encoding of the CR-002 rule: **one missing product disqualifies the whole seller.**

---

## 4. Ranking

Never "nearest wins". Weighted, normalised, configurable.

```
score(S) = w_distance     * norm_inv(distanceKm,      maxRadiusKm)
         + w_eta          * norm_inv(routeEtaMinutes, maxEtaMinutes)
         + w_preparation  * norm_inv(prepMinutes,     maxPrepMinutes)
         + w_workload     * norm_inv(activeOrders,    maxWorkload)
         + w_availability * stockHeadroomRatio
         + w_boost        * normalisedAdminBoost
```

- `norm_inv(v, max) = clamp(1 - v/max, 0, 1)` — higher is better, bounded.
- Weights come from the `sellerRankingWeights` platform setting; they are normalised to sum to 1 at load, so a partial admin edit cannot silently rescale the whole formula.
- `stockHeadroomRatio` = min over items of `available / required`, capped at 1. Prefers sellers who will not be left at zero.
- `activeOrders` = count of the seller's orders in `placed`/`confirmed`/`packed`. If workload tracking is unavailable, the weight is redistributed rather than defaulting the factor to 0.
- Ties break by `distanceKm` ascending, then `sellerId` ascending — deterministic, so tests are reproducible.

Every candidate's `rankScore` and per-factor `rankBreakdown` are persisted on the `FulfillmentAttempt` and exposed **only** to Admin.

---

## 5. Atomic Complete-Cart Reservation

The single most correctness-critical routine in CR-002.

```
reserveCompleteCart(seller, requiredItems):
    reserved = []
    try:
        for item in requiredItems:                       # deterministic order: sort by productId
            productId = resolvedProductFor(seller, item)
            ProductRepository.reserveStock(productId, item.quantity, session)   # EXISTING primitive
            reserved.push({ productId, quantity: item.quantity })
        persist attempt.reservations = reserved
        return { ok: true, reserved }
    catch (OUT_OF_STOCK or any error):
        for r in reserved (reverse order):
            ProductRepository.releaseReservedStock(r.productId, r.quantity, session)
        return { ok: false, code: 'INVENTORY_RESERVATION_FAILED' }
```

Guarantees and how each is obtained:

| Guarantee | Mechanism |
|---|---|
| No overselling | `reserveStock` is a single-document conditional update: `$expr: stock - reservedStock >= qty` with `$inc`. MongoDB applies it atomically; two concurrent callers cannot both match. |
| No negative stock | Same guard, plus `min: 0` on the schema fields. |
| No partial reservation | Rollback loop releases everything already taken on any failure. |
| No duplicate reservation | `FulfillmentAttempt` is created *before* reserving and is uniquely keyed `{ fulfillmentId, attemptNumber }`; a retry finds the existing attempt and its `reservations[]` instead of reserving again. |
| Deterministic ordering | Items sorted by `productId` before reserving, so concurrent multi-item reservations cannot deadlock in a cycle. |
| Crash recovery | `reservations[]` is persisted; the sweeper releases exactly that list. |

**Reuse, not reinvention:** `reserveStock` / `releaseReservedStock` / `decrementStock` are called unchanged. CR-002 adds an all-or-nothing *wrapper*, not a second inventory system.

### 5.1 The mandated concurrency scenario

Seller has A=1, B=1, C=1. Customers X and Y both order A+B+C.

```
X reserves A -> ok   (reservedStock A: 0->1)
Y reserves A -> matchedCount 0 -> throws OUT_OF_STOCK
Y rolls back (nothing reserved yet) -> seller excluded -> next candidate / warehouse / courier
X reserves B -> ok
X reserves C -> ok  -> X proceeds
```

If interleaving differs (Y wins A, X wins B), **both** fail their next item and **both** roll back fully — no stock is stranded, and both orders proceed to fallback. Exactly one order can ever hold the complete set. Verified by `T-18` / `T-31` in `09_CR002_Testing_Strategy.md`.

---

## 6. Offer, Acceptance, and Timeout

```
offer(candidate):
    attempt.status = 'offered'
    attempt.expiresAt = now + sellerAcceptanceTimeoutSeconds
    fulfillment.state = 'seller_assigned'
    fulfillment.acceptanceDeadlineAt = attempt.expiresAt
    emit SELLER_ASSIGNED  -> socket room seller:<id>
```

Three outcomes:

| Outcome | Action |
|---|---|
| **Accept** | Reservations retained. `fulfillment.state = 'seller_accepted'`. Order advances `placed -> confirmed` via the existing transition. `SELLER_ACCEPTED` emitted. |
| **Reject** | Release all reservations. Exclude seller. `SELLER_REJECTED`. `attemptNext()`. |
| **Timeout** | Sweeper finds `state='seller_assigned' AND acceptanceDeadlineAt < now`. Release all. Exclude seller. `SELLER_REJECTED` (reason `timeout`). `attemptNext()`. |

**Timeouts are DB-driven, not `setTimeout`-driven.** Because `QueueManager` has no adapter (`02` §14), an in-memory timer would lose every pending fulfillment on restart or on a second instance. Deadlines are absolute timestamps; a sweeper running every `fulfillmentSweeperIntervalSeconds` finds expired rows and acts idempotently. An in-process timer may additionally fire for latency, but it is an optimisation — correctness never depends on it.

Across all three outcomes: the order is **never** duplicated, **never** re-charged, and reservations are **never** double-released (each release is guarded by `reservations[].releasedAt`).

---

## 7. Fallback Ladder

```
Level 0/1 — Local sellers, ranked, up to maxSellerAttempts
    |  all fail
    v
Level 2 — Warehouse (Seller where isWarehouse: true)
    |  requires warehouseFallbackEnabled
    |  runs the same eligibility + complete-cart + atomic reservation path
    |  fails -> WAREHOUSE_UNAVAILABLE
    v
Level 3 — Courier (Shiprocket via provider adapter)
    |  requires courierFallbackEnabled
    |  release ALL local reservations first
    |  CourierShipmentService.createForOrder()  (existing, unchanged)
    |  deliveryMode -> 'standard', quick ETA cleared
    |  fails -> COURIER_SERVICE_UNAVAILABLE
    v
Terminal — FULFILLMENT_FAILED
    order flagged for admin intervention; refund handled by the EXISTING refund flow
```

The warehouse reuses the seller path wholesale because it *is* a seller (`isWarehouse: true`). No parallel code path, no duplicated eligibility logic.

**Courier fallback honesty:** on entering level 3, `deliveryMode` becomes `standard`, `estimatedDeliveryMinutes` is cleared, and `fallbackReason` is recorded. The customer sees "Standard Delivery" with the courier's real ETA range. Showing a stale quick-commerce promise after fallback is explicitly forbidden.

---

## 8. Dynamic ETA

```
estimatedDeliveryMinutes =
      routeEtaMinutes(seller -> customer)
    + preparationMinutes(seller)
    + deliveryBufferMinutes(config)
```

| Input | Source | Fallback |
|---|---|---|
| `routeEtaMinutes` | `RoutingService` via the existing maps provider and `config.maps.apiKey` | `haversineKm / averageSpeedKmph * 60`, using `utils/geoHelper.haversineKm` |
| `preparationMinutes` | `seller.preparationTimeMinutes` | `defaultPreparationTimeMinutes` setting |
| `deliveryBufferMinutes` | `deliveryBufferMinutes` setting | constant default |

Worked example from the CR: route 12 + preparation 5 + buffer 3 = **20 minutes**.

`RoutingService` sits in `services/maps/`, reuses the existing API key and the `GeocodingService` caching/timeout conventions, and falls back silently. **No duplicate location architecture, no new provider credential.** If routing is unavailable the ETA is still computed (haversine path) and `MAP_SERVICE_UNAVAILABLE` is logged with the trace ID — the order is never blocked on the maps provider.

Nothing here is hardcoded: speed, buffer, and default preparation time are all configuration.

---

## 9. Delivery Partner Assignment

Runs after the seller marks the order `packed`, reusing the existing `notifyNearbyPartnersForOrder` trigger point.

Eligibility: approved, online, location present and fresh, serviceable, not already at `maxConcurrentDeliveries`, not in `rejectedBy[]`.

Two modes, selected by the `deliveryAssignmentMode` setting:

| Mode | Behaviour |
|---|---|
| `broadcast` *(default — today's behaviour, bit-for-bit)* | Notify all nearby online partners; first to accept wins via the existing `acceptByOrderId` guard. |
| `ranked` | Offer to the top-ranked partner for `deliveryPartnerAssignmentTimeoutSeconds`; on reject/timeout add to `rejectedBy[]` and offer the next. |

Shipping with `broadcast` as the default means CR-002 introduces **zero** regression risk to the delivery flow until an operator explicitly opts in.

Partner ranking mirrors §4: distance to seller, route ETA, current workload, acceptance-rate boost.

---

## 10. Idempotency and Recovery

| Situation | Behaviour |
|---|---|
| `start()` called twice for one order | `orderId` is unique on `order_fulfillments` -> second call is a no-op returning existing state |
| Accept called twice | Compare-and-set on attempt status; second call returns the same success |
| Process dies after reserving, before offering | Sweeper sees `searchDeadlineAt` passed, releases `attempt.reservations[]`, escalates |
| Process dies after seller accepted | State is already persisted; delivery flow proceeds normally on restart |
| Sweeper runs twice concurrently | Releases guarded by `reservations[].releasedAt`; state transitions guarded by compare-and-set |
| Duplicate payment callback | Existing `PaymentService` idempotency — **unchanged** by CR-002 |

---

## 11. Traceability

Every fulfillment carries a `traceId`, propagated to the existing pino logger and stamped on every `FulfillmentAttempt`. One admin query answers "why did order X end up on courier?" with the full ordered list of candidates, their rank breakdowns, and each failure code.
