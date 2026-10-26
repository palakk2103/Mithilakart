# CR-002 — 04: API Changes

**Compatibility rule:** no existing request contract changes; no existing response field is removed or retyped. Every change is either an added endpoint or an added response field.

Base path: `/api/v1`. Envelope, pagination, and error shape follow the existing `ApiResponse` / `AppError` conventions.

---

## 1. Change Table

| Method | Path | Portal | Impact |
|---|---|---|---|
| POST | `/orders` | Customer | **MODIFY** (response only) |
| GET | `/orders/:id` | Customer | **EXTEND** |
| GET | `/orders/:id/tracking` | Customer | **EXTEND** |
| GET | `/orders/:id/fulfillment` | Customer | **NEW** |
| GET | `/seller/orders` | Seller | **EXTEND** (was `501`) |
| GET | `/seller/orders/:id` | Seller | **EXTEND** (was `501`) |
| POST | `/seller/orders/:id/accept` | Seller | **NEW** |
| POST | `/seller/orders/:id/reject` | Seller | **NEW** |
| PATCH | `/seller/orders/:id/status` | Seller | **UNCHANGED** |
| GET | `/delivery/orders` | Delivery | **EXTEND** |
| POST | `/delivery/orders/:id/accept` | Delivery | **UNCHANGED** |
| POST | `/delivery/orders/:id/reject` | Delivery | **UNCHANGED** |
| GET | `/admin/fulfillment/settings` | Admin | **NEW** |
| PUT | `/admin/fulfillment/settings` | Admin | **NEW** |
| GET | `/admin/fulfillment/orders` | Admin | **NEW** |
| GET | `/admin/fulfillment/orders/:orderId` | Admin | **NEW** |
| POST | `/admin/fulfillment/orders/:orderId/retry` | Admin | **NEW** |
| POST | `/admin/fulfillment/orders/:orderId/force-courier` | Admin | **NEW** |
| GET/PUT | `/admin/settings` | Admin | **UNCHANGED** (new keys flow through generically) |

---

## 2. Customer

### 2.1 `POST /orders` — MODIFY (response only)

**Request: unchanged.** Body remains `{ addressId, paymentMethod, couponCode?, commerceFlow?, items?, idempotencyKey? }`.

The client still cannot influence fulfillment. Any `sellerId`, `deliveryCharge`, `estimatedDelivery`, or `fulfillmentType` present in the body is ignored — not validated, not echoed. See `SEC-1` in §6.

**Response: additive fields.**

```jsonc
{
  "success": true,
  "data": {
    "orderId": "...",            // existing
    "orderNumber": "...",        // existing
    "status": "placed",          // existing
    "paymentStatus": "paid",     // existing
    "payment": { },              // existing

    "fulfillment": {             // NEW
      "state": "searching",
      "deliveryMode": null,
      "estimatedDeliveryMinutes": null,
      "message": "Finding the fastest store near you"
    }
  }
}
```

For **standard tabs** (`mithilakart`, `mithilak`) the `fulfillment` block is resolved immediately and mirrors today's courier behaviour — no `searching` state, no behaviour change.

For **quick tabs** the order is created and payment authorised exactly as today; the fulfillment engine then runs **asynchronously**. The customer is never blocked for the search timeout.

### 2.2 `GET /orders/:id` — EXTEND

Adds, alongside all existing fields:

```jsonc
"fulfillment": {
  "state": "seller_accepted",
  "type": "quick_local",
  "deliveryMode": "quick",
  "estimatedDeliveryMinutes": 20,
  "estimatedDeliveryAt": "2026-08-18T12:20:00.000Z",
  "fallbackLevel": 0,
  "seller": { "id": "...", "storeName": "Quick Mart" },
  "courierProvider": null
}
```

After a courier fallback the same block reports the **real** state — `deliveryMode: "standard"`, `estimatedDeliveryMinutes: null`, courier ETA range — never a stale quick-commerce promise.

### 2.3 `GET /orders/:id/tracking` — EXTEND

Existing tracking array unchanged. Adds `fulfillmentEvents[]` (see `06_CR002_State_Machine.md`) so the customer timeline can show searching -> assigned -> accepted -> packed -> out for delivery.

### 2.4 `GET /orders/:id/fulfillment` — NEW

Lightweight poll endpoint for clients whose socket dropped (R3 mitigation).

`200` -> `{ state, deliveryMode, estimatedDeliveryMinutes, fallbackLevel, updatedAt }`
`403` if the order does not belong to the caller.

**Never exposes:** candidate seller list, rank scores, attempt history, or internal failure detail.

---

## 3. Seller

### 3.1 `GET /seller/orders` — EXTEND (currently `501`)

Query: `?status=&tab=&page=&limit=`. Returns the paginated list of orders containing this seller's `OrderItem`s, plus any **pending fulfillment offers** addressed to this seller.

```jsonc
{
  "id": "...", "orderNumber": "MK-...", "status": "placed",
  "offer": {                       // present only while an offer is live
    "attemptId": "...",
    "expiresAt": "2026-08-18T12:03:00.000Z",
    "secondsRemaining": 84
  }
}
```

Authorisation reuses the existing rule from `updateStatusAsSeller`: the seller must own at least one `OrderItem` on the order (or be the target of the live offer). Enforced in the repository query, not by post-filtering.

### 3.2 `GET /seller/orders/:id` — EXTEND (currently `501`)

Full detail scoped to this seller's items only. `403` otherwise. Must not leak other sellers' line items, the customer's full contact details beyond what pickup requires, or any competitor data.

### 3.3 `POST /seller/orders/:id/accept` — NEW

```jsonc
// Request
{ "attemptId": "..." }            // required — binds the accept to a specific offer
```

Semantics:
- Atomic compare-and-set on `FulfillmentAttempt.status: 'offered' -> 'accepted'`; a second call returns the same result (idempotent).
- On success: reservations are **retained**, order advances `placed -> confirmed` through the **existing** `updateStatusAsSeller` transition path, `SELLER_ACCEPTED` is emitted.
- `409 FULFILLMENT_OFFER_EXPIRED` if the deadline passed or the offer was already reassigned.

### 3.4 `POST /seller/orders/:id/reject` — NEW

```jsonc
{ "attemptId": "...", "reason": "out_of_stock" }
```

On success: **all** reservations for that attempt are released, the seller is added to `excludedSellerIds`, and the engine advances to the next candidate. Returns `202` — the seller is not told which seller comes next.

### 3.5 `PATCH /seller/orders/:id/status` — UNCHANGED

Existing linear transitions, existing optimistic locking, existing delivery-partner notification on `confirmed`/`packed`. CR-002 adds no constraints here.

---

## 4. Delivery Partner

`GET /delivery/orders` — EXTEND: `available[]` entries gain `offer: { expiresAt, secondsRemaining, rank }` when the ranked-offer mode is enabled. When `deliveryAssignmentMode = 'broadcast'` (the current behaviour, and the default until explicitly switched), the response is byte-identical to today.

`POST /delivery/orders/:id/accept` and `/reject` — **UNCHANGED**. The existing race-to-claim guard in `acceptByOrderId` stays the final arbiter.

---

## 5. Admin

### 5.1 `GET` / `PUT /admin/fulfillment/settings` — NEW

A typed, validated façade over the generic settings store. It reads and writes the same `platform_settings` rows via `AdminPlatformSettingsService`; it does **not** introduce a second settings mechanism. Its value is Joi validation and range checks that the generic `PUT /admin/settings` cannot provide.

Permissions: `settings.view` / `settings.edit` (existing).

### 5.2 `GET /admin/fulfillment/orders` — NEW

Monitor. Filters: `state`, `tab`, `fallbackLevel`, `failureCode`, `from`, `to`. Returns fulfillment state, attempt count, elapsed time, and current candidate. Permission: `orders.view`.

### 5.3 `GET /admin/fulfillment/orders/:orderId` — NEW

Full attempt history with rank breakdowns and failure codes — the operational answer to "why did this order go to courier?". Permission: `orders.view`.

### 5.4 `POST /admin/fulfillment/orders/:orderId/retry` — NEW

Re-runs the engine for a stuck fulfillment. Rejected unless state is terminal-failed or the deadline has passed, so it can never double-reserve. Permission: `orders.edit`. Audited via the existing `AuditService`.

### 5.5 `POST /admin/fulfillment/orders/:orderId/force-courier` — NEW

Manual escalation to courier fallback. Releases outstanding reservations first. Permission: `orders.edit`. Audited.

---

## 6. Security Contract

| ID | Rule | Enforcement |
|---|---|---|
| SEC-1 | Client cannot select a seller | `placeOrder` never reads seller/fulfillment fields from the body; the engine reads only the persisted order and cart |
| SEC-2 | Client cannot set price, delivery charge, fees, or ETA | All computed server-side by `PricingService` + `RoutingService`; request values ignored |
| SEC-3 | Client cannot fake stock | Availability read from `products.stock - reservedStock` only |
| SEC-4 | Seller sees only its own resources | Repository-level `sellerId` scoping (existing pattern, covered by `seller-isolation.test.js`) |
| SEC-5 | Seller cannot accept an offer not addressed to it | `attemptId` + `sellerId` compound match required |
| SEC-6 | Delivery partner sees only assigned/offered orders | Existing assignment checks, extended to `offeredTo[]` |
| SEC-7 | Admin endpoints respect RBAC | Existing `requirePermission` middleware |
| SEC-8 | Webhooks authenticated and idempotent | Existing payment/courier webhook handling — **unchanged** by CR-002 |
| SEC-9 | No internal detail in errors | Error codes only; rank scores, candidate lists, and stack traces never leave the server |

---

## 7. Versioning

No breaking change, so no `/v2`. New response fields are additive; clients that ignore them keep working. `GET /seller/orders` moving from `501` to `200` cannot break a caller, since no caller can currently be relying on a `501`.
