# CR-002 — 06: State Machine & Events

**Core design decision:** the existing `ORDER_STATUS` enum and its strictly-linear transition rule are **NOT modified**. Fulfillment gets its own lifecycle on `OrderFulfillment`, running in parallel. This is what keeps every existing seller, admin, delivery, and courier code path working untouched.

---

## 1. Existing Order State Machine — UNCHANGED

`src/constants/commerce.js` + `OrderService._isValidStatusTransition`:

```
pending -> placed -> confirmed -> packed -> shipped -> out_for_delivery -> delivered
                                                                   \
                                                                    -> cancelled (from any non-delivered)
```

Rule: `toIdx === fromIdx + 1`. **No new order status is added by CR-002.**

Why this matters: adding `seller_rejected` or `fulfillment_failed` to `ORDER_STATUS` would break `_isValidStatusTransition` for every existing caller, invalidate `Order.status` enum validation on historical documents, and require changes in the admin panel, seller panel, delivery panel, and the Shiprocket status map. The parallel-lifecycle approach avoids all of it.

---

## 2. New Fulfillment State Machine (`OrderFulfillment.state`)

```
                    ┌──────────────────────────────────────────┐
                    v                                          │
   [searching] ──> [seller_assigned] ──accept──> [seller_accepted]
        │                  │                            │
        │                  ├──reject/timeout────────────┘ (release, exclude, retry)
        │                  │
        │                  v
        │            (attempts exhausted / search deadline)
        │                  │
        ├──────────────────┤
        v                  v
  [warehouse_pending] ──> [warehouse_accepted]
        │                        │
        │ unavailable            │
        v                        │
  [courier_pending] ──> [courier_assigned]
        │
        │ unavailable
        v
     [failed]

  [seller_accepted] / [warehouse_accepted] / [courier_assigned] ──> [fulfilled]
  any non-terminal ──> [cancelled]   (customer cancel / admin cancel)
```

### 2.1 States

| State | Meaning | Terminal |
|---|---|---|
| `searching` | Engine is finding an eligible seller | no |
| `seller_assigned` | Reserved + offered; awaiting seller response | no |
| `seller_accepted` | Seller confirmed; order advances on the existing chain | no |
| `warehouse_pending` | Local sellers exhausted; trying warehouse | no |
| `warehouse_accepted` | Warehouse will fulfil | no |
| `courier_pending` | Local + warehouse exhausted; creating shipment | no |
| `courier_assigned` | Shipment created; standard delivery | no |
| `fulfilled` | Delivered | **yes** |
| `failed` | No source could fulfil; needs admin/refund | **yes** |
| `cancelled` | Cancelled before fulfillment completed | **yes** |

### 2.2 Legal transitions

| From | To | Trigger |
|---|---|---|
| `searching` | `seller_assigned` | complete-cart reservation succeeded |
| `searching` | `warehouse_pending` | no eligible seller / attempts exhausted / search deadline |
| `seller_assigned` | `seller_accepted` | seller accept |
| `seller_assigned` | `searching` | seller reject or acceptance timeout (reservations released) |
| `seller_assigned` | `warehouse_pending` | reject/timeout **and** attempts exhausted |
| `warehouse_pending` | `warehouse_accepted` | warehouse reservation succeeded |
| `warehouse_pending` | `courier_pending` | warehouse ineligible / disabled / out of stock |
| `courier_pending` | `courier_assigned` | shipment created |
| `courier_pending` | `failed` | courier unavailable / disabled |
| `searching` | `failed` | courier fallback also disabled |
| `seller_accepted`, `warehouse_accepted`, `courier_assigned` | `fulfilled` | order reaches `delivered` |
| any non-terminal | `cancelled` | customer/admin cancel |

Every transition is a **compare-and-set** on the current state, mirroring the existing `updateStatusOptimistic` pattern, so two concurrent actors (seller accepting while the sweeper times out) cannot both win.

---

## 3. Mapping CR-002 Events to the Existing Architecture

CR-002 lists 15 conceptual events. Several already exist and **must not be duplicated**.

| CR-002 event | Existing bus event | Action |
|---|---|---|
| `ORDER_CREATED` | `order.placed` | **REUSE** |
| `SELLER_ASSIGNED` | — | **NEW** `fulfillment.seller_assigned` |
| `SELLER_ACCEPTED` | — | **NEW** `fulfillment.seller_accepted` |
| `SELLER_REJECTED` | — | **NEW** `fulfillment.seller_rejected` (carries `reason: 'rejected' \| 'timeout'`) |
| `ORDER_PACKING` | `order.status_changed` (`confirmed`) | **REUSE** |
| `ORDER_PACKED` | `order.status_changed` (`packed`) | **REUSE** |
| `DELIVERY_SEARCHING` | `delivery.order_available` | **REUSE** |
| `DELIVERY_ASSIGNED` | `delivery.order_available` (targeted) | **REUSE** |
| `DELIVERY_ACCEPTED` | — | **NEW** `delivery.assignment_accepted` |
| `PICKED_UP` | `order.status_changed` (`shipped`) | **REUSE** |
| `OUT_FOR_DELIVERY` | `order.status_changed` (`out_for_delivery`) | **REUSE** |
| `DELIVERY_NEAR_CUSTOMER` | `delivery.location_updated` | **REUSE** + derived proximity flag |
| `DELIVERED` | `order.status_changed` (`delivered`) | **REUSE** |
| `FULFILLMENT_FAILED` | — | **NEW** `fulfillment.failed` |
| `COURIER_FALLBACK` | — | **NEW** `fulfillment.courier_fallback` |

**Six new events. Nine reused.** No parallel event system.

### 3.1 Cleanup included

Existing event names are scattered string literals (`'order.placed'`, `'order.status_changed'`, …) while `events/eventTypes.js` exports only `system.*`. CR-002 adds the new names — and registers the existing ones — in `eventTypes.js` as named constants. Publishers keep working during the transition because the constant values are the identical strings.

---

## 4. Event Payloads

All new events share:

```jsonc
{
  "orderId": "...", "orderNumber": "MK-...", "userId": "...",
  "fulfillmentId": "...", "traceId": "...",
  "state": "seller_assigned",
  "timestamp": "2026-08-18T12:00:00.000Z"
}
```

Additions per event:

| Event | Extra fields |
|---|---|
| `fulfillment.seller_assigned` | `sellerId`, `attemptId`, `expiresAt`, `estimatedDeliveryMinutes` |
| `fulfillment.seller_accepted` | `sellerId`, `attemptId`, `estimatedDeliveryAt` |
| `fulfillment.seller_rejected` | `sellerId`, `attemptId`, `reason` |
| `fulfillment.courier_fallback` | `fallbackLevel`, `fallbackReason`, `courierProvider` |
| `fulfillment.failed` | `failureCode`, `fallbackLevel`, `attemptCount` |
| `delivery.assignment_accepted` | `partnerId`, `assignmentId`, `etaMinutes` |

**Never in a payload:** rank scores, the candidate seller list, competitor data, stack traces, provider credentials, or internal error text. Those live on `FulfillmentAttempt` and are Admin-only.

---

## 5. Realtime Fanout

Extends the **existing** `SocketGateway` subscriptions. No new gateway, no new transport.

| Event | Customer `order:<id>` | Seller `seller:<id>` | Delivery `delivery:<id>` | Admin |
|---|---|---|---|---|
| `fulfillment.seller_assigned` | `status_update` (generic "preparing") | `new_offer` (full detail) | — | monitor |
| `fulfillment.seller_accepted` | `status_update` + ETA | `status_update` | — | monitor |
| `fulfillment.seller_rejected` | *(nothing — see below)* | `offer_closed` | — | monitor |
| `fulfillment.courier_fallback` | `fulfillment_update` (mode + ETA change) | — | — | monitor |
| `fulfillment.failed` | `fulfillment_update` (safe message) | — | — | alert |
| `delivery.assignment_accepted` | `status_update` | `status_update` | `assignment_confirmed` | monitor |

**The customer is not told about seller rejections.** Which seller was tried, and how many were tried, is internal. The customer sees "preparing your order" until a source is confirmed, then a real ETA — or an honest switch to standard delivery on fallback.

`OrderTrackingStreamService` (SSE) receives the same events, so both realtime paths stay consistent. That there are two parallel realtime mechanisms is **pre-existing**; CR-002 feeds both rather than adding a third.

---

## 6. Customer-Visible Projection

The customer never sees raw internal state:

| Internal state | Customer sees |
|---|---|
| `searching` | "Finding the fastest store near you" |
| `seller_assigned` | "Preparing your order" |
| `seller_accepted` | "Preparing your order — arriving in ~20 min" |
| `warehouse_pending` / `warehouse_accepted` | "Preparing your order" + real ETA |
| `courier_pending` | "Switching to standard delivery" |
| `courier_assigned` | "Standard Delivery — arriving in 2–5 days" |
| `failed` | Safe message + support/refund path |

Every string is driven by real backend state. No hardcoded ETA, no fake status, and no quick-commerce promise displayed after a courier fallback.

---

## 7. Delivery Assignment State — UNCHANGED enum

`ASSIGNMENT_STATUS` (`pending`, `assigned`, `accepted`, `picked_up`, `delivered`, `cancelled`, `failed`, `rejected`) is **not modified**. The ranked-offer layer uses the new `offeredTo[]` / `offerExpiresAt` / `rejectedBy[]` fields while `status` keeps its current meaning, so the existing accept/pickup/deliver/OTP flow — and `delivery-accept.test.js` — continue to pass unchanged.

---

## 8. Persistence Before Emission

Mandatory ordering for every transition:

```
1. compare-and-set the state in MongoDB   (source of truth)
2. write the FulfillmentAttempt record    (traceability)
3. eventBus.publish(...)                  (advisory)
4. socket fanout                          (best-effort)
```

Because `EventBus` is an in-process `EventEmitter` (`02` §11/§14), a dropped event must never mean lost state. With this ordering the worst case is a delayed UI update that self-corrects via `GET /orders/:id/fulfillment` or the socket `sync_state` handshake on reconnect.
