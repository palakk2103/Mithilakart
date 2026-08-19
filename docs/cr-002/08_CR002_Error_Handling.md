# CR-002 — 08: Error Handling

**Reuses** `utils/AppError`, `constants/errorCodes.js`, the existing error middleware, the existing pino logger, and the existing request-ID middleware. No new error framework.

---

## 1. Existing Codes — reused, not redefined

`src/constants/errorCodes.js` already defines: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `GONE`, `VALIDATION_ERROR`, `RATE_LIMITED`, `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE`, `DATABASE_ERROR`, `UPLOAD_ERROR`, `OUT_OF_STOCK`, `PAYMENT_FAILED`, `ORDER_NOT_FOUND`, `SELLER_OFFLINE`, `DELIVERY_NOT_AVAILABLE`, `INVALID_TOKEN`.

CR-002 requirement mapping:

| CR-002 code | Existing? | Decision |
|---|---|---|
| `OUT_OF_STOCK` | **yes** | REUSE (`AppError.outOfStock`) |
| `PAYMENT_FAILED` | **yes** | REUSE (`AppError.paymentFailed`) |
| `SELLER_UNAVAILABLE` | close — `SELLER_OFFLINE` | REUSE `SELLER_OFFLINE` |
| `DELIVERY_PARTNER_UNAVAILABLE` | close — `DELIVERY_NOT_AVAILABLE` | REUSE `DELIVERY_NOT_AVAILABLE` |
| `ORDER_CREATION_FAILED` | close — `ORDER_NOT_FOUND` + `INTERNAL_ERROR` | REUSE existing placement errors |
| `FULFILLMENT_TIMEOUT` | no | **NEW** |
| `NO_SELLER_AVAILABLE` | no | **NEW** |
| `WAREHOUSE_UNAVAILABLE` | no | **NEW** |
| `COURIER_SERVICE_UNAVAILABLE` | no | **NEW** |
| `INVENTORY_RESERVATION_FAILED` | no | **NEW** |
| `MAP_SERVICE_UNAVAILABLE` | no | **NEW** |
| `REALTIME_CONNECTION_FAILED` | no | **NEW** (client-side/diagnostic) |

**7 new codes. 5 requirements satisfied by existing codes.**

---

## 2. New Codes

Appended to `ERROR_CODES` and `DOMAIN_ERROR_STATUS`:

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| `FULFILLMENT_TIMEOUT` | 503 | yes | Search deadline elapsed with no source |
| `NO_SELLER_AVAILABLE` | 503 | yes | No seller could fulfil the complete cart |
| `WAREHOUSE_UNAVAILABLE` | 503 | yes | Warehouse fallback disabled or unable |
| `COURIER_SERVICE_UNAVAILABLE` | 503 | yes | Courier provider unavailable or disabled |
| `INVENTORY_RESERVATION_FAILED` | 409 | yes | Atomic complete-cart reservation failed |
| `FULFILLMENT_OFFER_EXPIRED` | 409 | no | Seller responded after the deadline |
| `MAP_SERVICE_UNAVAILABLE` | 503 | yes | Routing/geocoding unavailable — **non-fatal** |
| `REALTIME_CONNECTION_FAILED` | 503 | yes | Socket/SSE could not be established |

New `AppError` factories, matching the existing static-factory style:

```js
static fulfillmentTimeout(message = 'Fulfillment search timed out', details = null)
static noSellerAvailable(message = 'No seller can fulfil this order', details = null)
static warehouseUnavailable(message = 'Warehouse fulfillment unavailable', details = null)
static courierUnavailable(message = 'Courier service unavailable', details = null)
static reservationFailed(message = 'Could not reserve inventory', details = null)
static offerExpired(message = 'This order offer has expired', details = null)
```

`MAP_SERVICE_UNAVAILABLE` and `REALTIME_CONNECTION_FAILED` get **no factory** — they are logged and degraded, never thrown to a customer. Routing failure falls back to haversine; the order still completes.

---

## 3. Internal Failure Codes (not HTTP errors)

Recorded on `FulfillmentAttempt.failureCode` / `OrderFulfillment.failureCode` for traceability. These are Admin-visible only and never reach a customer response.

| Code | Recorded when |
|---|---|
| `SELLER_NOT_APPROVED` | KYC not approved |
| `SELLER_INACTIVE` | `status !== 'active'` |
| `SELLER_NOT_ACCEPTING` | `isAcceptingOrders === false` |
| `SELLER_TAB_INELIGIBLE` | tab eligibility flag false |
| `SELLER_MISSING_PRODUCT` | at least one required item not stocked |
| `SELLER_INSUFFICIENT_QUANTITY` | available < required |
| `SELLER_LISTING_UNAVAILABLE` | listing missing / unapproved / hidden |
| `SELLER_OUT_OF_RADIUS` | beyond search or seller radius |
| `SELLER_NOT_SERVICEABLE` | pincode/serviceability check failed |
| `SELLER_NO_LOCATION` | lat/lng missing |
| `SELLER_REJECTED` | explicit rejection |
| `SELLER_TIMEOUT` | acceptance deadline elapsed |
| `RESERVATION_LOST_RACE` | lost the atomic reservation to a concurrent order |
| `WAREHOUSE_DISABLED` / `COURIER_DISABLED` | fallback switched off by Admin |

The distinction between `SELLER_MISSING_PRODUCT` and `SELLER_INSUFFICIENT_QUANTITY` matters operationally: the first is a catalog gap, the second is a restocking problem.

---

## 4. Customer-Safe Messages

Internal code -> customer message. The customer is never told which seller failed, how many were tried, or why.

| Internal outcome | Customer sees |
|---|---|
| `NO_SELLER_AVAILABLE` -> courier fallback succeeded | "Standard Delivery — arriving in 2–5 days" |
| `FULFILLMENT_TIMEOUT` -> courier fallback succeeded | "Standard Delivery — arriving in 2–5 days" |
| All fallbacks failed | "We couldn't complete this order right now. Our team has been notified and you'll be refunded automatically." |
| `INVENTORY_RESERVATION_FAILED` at checkout | "Some items are no longer available. Please review your cart." |
| `MAP_SERVICE_UNAVAILABLE` | *(nothing — degraded silently, ETA still shown)* |
| `SELLER_REJECTED` / `SELLER_TIMEOUT` | *(nothing — "Preparing your order" continues)* |

---

## 5. Never Exposed

The existing error middleware already strips internals in production. CR-002 adds no path that could leak, and specifically never emits:

- stack traces, MongoDB errors, or duplicate-key detail
- file paths or module names
- Razorpay / Shiprocket / Google credentials or raw provider responses
- internal seller IDs, candidate lists, or rank scores
- inventory quantities of any seller
- `traceId` is returned to the customer (safe, opaque) but nothing else internal is

---

## 6. Traceability

Every fulfillment carries a `traceId` (existing `randomUuid()`), stamped on:

- `OrderFulfillment.traceId`
- every `FulfillmentAttempt`
- every log line via the existing pino child logger
- the customer-facing error envelope (support reference)

Log levels:

| Event | Level |
|---|---|
| Fulfillment start / resolve | `info` |
| Candidate rejected by eligibility | `debug` (high volume) |
| Reservation lost race | `info` — expected under concurrency, not an error |
| Seller reject / timeout | `info` |
| Warehouse fallback entered | `warn` |
| Courier fallback entered | `warn` |
| Fulfillment failed entirely | `error` |
| Routing provider failure | `warn` |
| Reservation release failure | `error` — the only case that can strand stock |

Structured fields on every fulfillment log: `traceId`, `orderId`, `fulfillmentId`, `attemptNumber`, `sellerId`, `state`, `failureCode`, `elapsedMs`.

---

## 7. Recovery Matrix

| Failure | Recovery | Customer impact |
|---|---|---|
| Seller rejects | Release all; next candidate | none |
| Seller times out | Sweeper releases; next candidate | none |
| Reservation loses race | Exclude seller; next candidate | none |
| All sellers fail | Warehouse fallback | none |
| Warehouse fails | Courier fallback | delivery mode + ETA change, shown honestly |
| Courier fails | `failed` state; admin alert; existing refund flow | notified + refunded |
| Routing provider down | Haversine ETA | none |
| Process crash mid-fulfillment | Sweeper releases from persisted `reservations[]`, resumes | possible delay |
| Socket disconnect | `GET /orders/:id/fulfillment` poll + `sync_state` on reconnect | none |
| Duplicate payment callback | Existing `PaymentService` idempotency | none — **never re-charged** |
| Duplicate order request | Existing `idempotencyKey` handling | none |

---

## 8. Cross-Cutting Guarantees

| Guarantee | Mechanism |
|---|---|
| No double charge | Fulfillment runs strictly after payment authorisation and never calls into `PaymentService` |
| No duplicate order | Existing `idempotencyKey` + unique `orderId` on `order_fulfillments` |
| No duplicate reservation | Attempt created before reserving; `reservations[]` is the single record |
| No stranded stock | Persisted `reservations[]` + idempotent sweeper + `releasedAt` guard |
| Every failure recorded | One `FulfillmentAttempt` row per candidate, always written |
