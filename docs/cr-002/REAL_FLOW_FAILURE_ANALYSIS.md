# CR-002 — Real Flow Failure Analysis

**Date:** 2026-08-19
**Method:** Static trace of the full path (Customer UI → API → Service → Engine → Inventory → DB → EventBus → SocketGateway → Seller UI) corroborated against **live production data** in MongoDB Atlas (`mithilakart`), plus **live Shiprocket API calls**.
**Source of truth:** persisted state in the real database, not unit tests.

---

## 0. Evidence base

Queried the live Atlas cluster directly (97 fulfillments, 268 attempts, 143 orders, 8 sellers).

### Fulfillment final states

| state | count |
|---|---|
| `failed` | **79** |
| `warehouse_accepted` | 11 |
| `seller_accepted` | 7 |

**81% of every quick-commerce order ever placed ends in `failed`.**

### Seller attempt outcomes

| status | count |
|---|---|
| `reservation_failed` (never reached a seller) | 44 |
| **`timed_out`** | **41** |
| `rejected` | 7 |
| `accepted` | 7 |

Of the 55 offers that actually reached a live seller, **41 (75%) died by timeout** — the seller never responded at all. Only 14 were ever acted on by a human.

### Courier attempts

| kind | status | count |
|---|---|---|
| courier | `reservation_failed` | **79 / 79** |

**Courier fallback has a 100% failure rate.** Every order that reached the courier rung died.

This data is the reproduction. The two numbers above — 75% seller timeout and 100% courier failure — are the reported bug, measured.

---

## FAILURE 1 — Seller never receives the offer (75% timeout rate)

### EXPECTED
Backend offers an order to a seller → seller sees an incoming-order popup with a countdown and ringtone, **on whatever page they are on**, with no refresh.

### ACTUAL
The seller sees nothing unless they happen to be sitting on the **Orders list page**. Sellers land on `/seller/dashboard` after login, so in practice they see nothing. The offer expires; the sweeper records `SELLER_TIMEOUT` and moves down the ladder.

### FIRST FAILURE
`frontend/src/modules/seller/pages/orders/OrderList.jsx:145` — the mount point of `FulfillmentOffers`.

### ROOT CAUSE
The seller panel runs **three parallel realtime systems**, and the CR-002 event is wired into the one with the narrowest mount scope:

| # | Component | Transport | Listens for | Mounted |
|---|---|---|---|---|
| 1 | `NewOrderModal` | **SSE** `/api/v1/seller/stream` | `new_order` | **App-wide** (`SellerLayout.jsx:25`) |
| 2 | `useSellerOrderStream` | Socket.IO | `new_order`, `status_update` | App-wide (`Topbar.jsx:49`) |
| 3 | **`FulfillmentOffers`** | Socket.IO | **`fulfillment_offer`** | **Orders page only** |

The backend emits the CR-002 offer as Socket.IO **`fulfillment_offer`** (`backend/src/realtime/fulfillmentFanout.js`). A repo-wide grep proves `FulfillmentOffers.jsx` is the **only** listener for that event anywhere in the frontend.

The two app-wide components both listen for the **legacy** `new_order` event, which the CR-002 engine never publishes. `SellerOrderStreamService.registerEventBridge()` bridges only `order.placed` and `order.status_changed` — **no `FULFILLMENT_EVENTS` are bridged to SSE at all**.

So there is **no app-wide path from `fulfillment_offer` to any UI**. The backend is correct and the socket is connected; the event arrives and lands on zero listeners.

### LAYER
Frontend — realtime subscription scope. (Backend, EventBus, SocketGateway, rooms and auth are all correct and verified.)

### FIX
Mount an app-wide offer listener in `SellerLayout` that owns the `fulfillment_offer` subscription, renders a blocking modal, and drives the ringtone. Page-level panels become consumers of that shared state rather than the sole subscriber.

---

## FAILURE 2 — No sustained ringtone, no autoplay handling

### EXPECTED
Ringtone loops on offer arrival; stops on accept/reject/timeout/cancel/replace; if the browser blocks autoplay, a prominent visual alert appears with a control to enable sound.

### ACTUAL
`FulfillmentOffers` plays **no sound at all**. The only sound helper, `playOrderAlert()` (`shared/utils/orderAlertSound.js`), is a **one-shot 0.5s beep** with no loop and no stop, and it is wired exclusively to the legacy `new_order` event. `AudioContext` is created without a user gesture, so on a fresh tab it starts `suspended` and the beep is silently dropped — the `catch {}` swallows it and the code reports nothing.

### FIRST FAILURE
`frontend/src/shared/utils/orderAlertSound.js:12` — fire-and-forget, unstoppable, autoplay-blind.

### ROOT CAUSE
No ringtone lifecycle exists: no loop, no stop conditions, no duplicate suppression, no autoplay-block detection or visual fallback.

### LAYER
Frontend — notification layer.

### FIX
A dedicated ringtone controller with explicit start/stop, single-instance guard, autoplay-block detection and a visual fallback banner. Never report success when audio was actually blocked.

---

## FAILURE 3 — Courier fallback fails 100%, and the order dies instead of downgrading

### EXPECTED
Sellers and warehouse exhausted → courier shipment created → order persists `fulfillmentMode=STANDARD`, `deliveryMode=COURIER`, ETA/tracking → customer UI stops showing "15 min" and shows **Standard Delivery**.

### ACTUAL
All 79 courier attempts fail with `COURIER_UNAVAILABLE`. The fulfillment transitions to **`failed`**. The order is dead-ended, and because the STANDARD snapshot is only written on the success path, **the customer keeps seeing the original quick-commerce promise on a fulfillment that is already dead.**

### FIRST FAILURE
`backend/.env` → `SHIPROCKET_PICKUP_LOCATION=Primary`

### ROOT CAUSE (verified live against the Shiprocket API)
Shiprocket auth succeeds (HTTP 200, token issued) and serviceability succeeds for the real failing order (Patna 800001 → 800001, COD, 0.5 kg — returns valid couriers). The break is the **pickup location nickname**:

```
Configured in .env : "Primary"
Registered on account:
    "BhaveshTailor"        pin=452001  status=2
    "AtharvaTailor_2113f4" pin=450331  status=1
    "MayurTailor"          pin=452001  status=1
```

**No pickup location named `Primary` exists on the account.** `createAdhocOrder` is rejected on every call. `ShiprocketShippingProvider.createShipment` hardcodes the fallback `this.config.pickupLocation || 'Primary'` and never validates it against the account, so a pure configuration error surfaces as an opaque generic `COURIER_UNAVAILABLE`.

**Second, independent defect in the same path** — `FulfillmentEngineService._escalateToCourier` writes the `deliveryMode: STANDARD` snapshot **only after** the provider call succeeds. When the provider throws, control goes to `_fail()`, which marks the fulfillment `failed` **without ever downgrading the order to standard delivery**. This directly violates the Phase 15 rule *"DO NOT cancel the customer's order"*: the mode downgrade is a **business decision made the moment the courier rung is entered**, and must not be contingent on a third-party API call succeeding.

### LAYER
Two layers: configuration/provider (`.env`, `ShiprocketShippingProvider`) **and** engine state handling (`FulfillmentEngineService._escalateToCourier`).

### FIX
1. Point the config at a real, verified pickup location and resolve/validate it against the account, failing with a specific, actionable error code instead of a generic one.
2. Persist the **STANDARD downgrade when the courier rung is entered**, before the provider call. A provider failure then leaves the order as *standard delivery, tracking pending, flagged for admin* — never falsely shipped, and never dead-ended while the customer is still shown a quick promise.

---

## Summary — first broken link per layer

| Layer | Status |
|---|---|
| Database / models | correct |
| Inventory reservation (atomic, transactional) | correct |
| Fulfillment engine ladder (seller→warehouse→courier) | correct |
| EventBus | correct |
| SocketGateway rooms + auth | correct (`seller:<Seller._id>` matches JWT `sellerId` claim) |
| **Fanout → frontend subscription** | **FAILURE 1** — no app-wide listener |
| **Seller notification / ringtone** | **FAILURE 2** — no lifecycle, autoplay-blind |
| **Courier provider config** | **FAILURE 3a** — pickup location does not exist |
| **Courier failure → order state** | **FAILURE 3b** — dead-ends instead of downgrading |

**The backend fulfillment engine was not the bug.** It behaved correctly throughout: it offered, it timed out, it escalated, it recorded every reason. The ladder only *looked* stalled because every seller rung burned its full timeout window — because no seller could ever see the offer.

---

## FAILURE 4 — The engine started inside an uncommitted transaction (the deepest root cause)

Found by placing a **real order through the running API** after the first three fixes were in. It sits *earlier* in the chain than Failures 1–3.

### EXPECTED
Order placed → engine starts → an `order_fulfillments` document exists and the seller ladder begins.

### ACTUAL
Two consecutive real `quick_shop` orders produced **zero** fulfillment documents and zero attempts. The API returned 201, the order was in MongoDB, and nothing else happened. The server log carried one line:

```
WARN: CR-002 start called for a missing order
```

### FIRST FAILURE
`backend/src/services/orders/OrderService.js` — `_afterOrderConfirmed()`

### ROOT CAUSE
`placeOrder` runs inside `withTransaction`. That session is threaded down through `confirmOrder(..., session)` into `_afterOrderConfirmed(order, session)`, which fired the engine **fire-and-forget, without the session**:

```js
Promise.resolve(this.fulfillmentEngineService.start(order._id)).catch(...)
```

The engine reads the order on its own connection — **outside the still-open transaction** — so `findById` returned null and it gave up silently.

This is a race, not a constant failure: when the transaction happened to commit before the async read landed, fulfillment worked. That is exactly the reported symptom — *"not reliably progressing"*, and *"the browser flow can stop even though backend/unit tests may pass"*. **Every unit test passed because no unit test opens a real transaction.** It reproduces only against real MongoDB.

### LAYER
Backend — transaction boundary / side-effect sequencing.

### FIX
`withTransaction` now exposes `session.afterCommit(fn)`. Work registered there runs **only after a successful commit** and is discarded entirely on abort, so a rolled-back order can never trigger fulfillment. `_afterOrderConfirmed` registers the engine start through it.

Fixed at the transaction helper rather than at the call site, because the same hazard applies to `PaymentService.confirmOrder` (the Razorpay path) and to every future post-commit side effect.

### VERIFIED (live)
The same real order, after the fix:

```
CR-002 fulfillment started
CR-002 seller offered
  attempt 1  seller     -> SELLER_TIMEOUT
  attempt 2  warehouse  -> SELLER_MISSING_PRODUCT
  attempt 3  courier    -> COURIER_UNAVAILABLE
```

The full ladder runs. Regression locked by `tests/unit/services/order-fulfillment-start-race.test.js`.

---

## Corrected failure ordering

The chain broke in four independent places. In execution order:

| # | Failure | Layer | Effect |
|---|---|---|---|
| **4** | Engine started pre-commit | Backend transaction | Fulfillment **never started at all** (intermittent) |
| **1** | No app-wide `fulfillment_offer` listener | Frontend realtime | Seller never saw the offer → 75% timeout |
| **2** | No ringtone lifecycle | Frontend notification | No audible alert; autoplay blocks hidden |
| **3a** | Pickup location does not exist | Config / provider | 100% courier failure |
| **3b** | Downgrade written only on success | Backend engine | Order dead-ended still showing "15 min" |

Failure 4 had to be fixed first: until the engine actually started, none of the others could even be observed.
