# CR-002 — 12: End-to-End UI Test Runbook

**Purpose:** manually verify the full fallback chain through the real UI —
customer → seller 1 → seller 2 → … → warehouse → standard courier delivery.

---

## ⚠️ READ THIS FIRST — CR-002 SHIPS DARK

Three flags default to **off**, deliberately, so deploying CR-002 changes
nothing until you opt in. **If you skip Step 1, seller-to-seller fallback will
NOT happen and the test will look broken.**

| Flag | Default | Effect while off |
|---|---|---|
| `crossSellerSubstitutionEnabled` | `false` | **A cart can only be fulfilled by its original seller.** No seller 1 → seller 2 fallback. |
| `deliveryAssignmentMode` | `broadcast` | Delivery offers go to all partners at once; no ranked offer, no countdown. |
| `routingProviderEnabled` | `false` | ETA uses straight-line distance, not Google routing. |

There is also a **data prerequisite**: cross-seller substitution matches
products by `Product.catalogKey`. Every product is `null` by default, and the
migration deliberately does **not** populate it (a wrong key means the customer
receives the wrong item). Products you want to be substitutable must share the
same non-null `catalogKey`.

---

## Step 0 — Preconditions

```bash
# 1. Backend must be running the CR-002 code. Restart to be certain.
cd backend && npm run dev

# 2. Migration — dry run first, review the counts, then apply.
npm run migrate:cr002 -- --dry-run
npm run migrate:cr002

# 3. Frontend
cd ../frontend && npm run dev
```

Verify the backend is healthy and has CR-002 routes:

```bash
curl -s localhost:5000/ready
curl -s -o /dev/null -w "%{http_code}\n" localhost:5000/api/v1/seller/fulfillment/offers
# 401 = route exists (auth required). 404 = old code still running.
```

---

## Step 1 — Enable the flags (Admin)

`PUT /api/v1/admin/fulfillment/settings`, or via Admin → Settings.

```jsonc
{
  "crossSellerSubstitutionEnabled": true,   // enables seller -> seller fallback
  "deliveryAssignmentMode": "ranked",       // enables ranked partner offers
  "sellerAcceptanceTimeoutSeconds": 30,     // short, so timeouts are testable
  "deliveryPartnerAssignmentTimeoutSeconds": 30,
  "quickFulfillmentSearchTimeoutSeconds": 60,
  "sellerSearchRadiusKm": 15,
  "warehouseFallbackEnabled": true,
  "courierFallbackEnabled": true
}
```

Out-of-range values are **rejected, not clamped** — that is intended.

---

## Step 2 — Test data

Three sellers + one warehouse, all within `sellerSearchRadiusKm` of the
customer address, all `status: active`, `kycStatus: approved`,
`quickCommerceEligible: true`, with `latitude`/`longitude` set.

| Actor | `isWarehouse` | Stock of `catalogKey: TEST-ATTA-5KG` |
|---|---|---|
| Seller A (nearest) | false | **0** — forces failure |
| Seller B | false | 5 |
| Seller C | false | 5 |
| Warehouse W | **true** | 5 |

Each product needs an **approved, visible** `MarketplaceListing` for
`quick_shop`, otherwise the seller is skipped with
`SELLER_LISTING_UNAVAILABLE`.

A helper is provided:

```bash
node scripts/seed-cr002-test-data.js --dry-run   # review first
node scripts/seed-cr002-test-data.js             # staging only
```

---

## Step 3 — The scenarios

Watch **Admin → Fulfillment Monitor** (`/admin/fulfillment`) throughout. It
shows every attempt, rank score, and failure code, so you never need server logs.

### 3.1 Happy path — nearest seller accepts
1. Customer: Quick Shop → add product → checkout (COD).
2. **Cart must now be empty.** (This was broken before — see §5.)
3. Customer order page shows "Quick Delivery" + a real ETA in minutes.
4. Seller B panel → Orders → a **New order offer** card with a live countdown.
5. Seller B: **Accept**.
6. Expected: order → `confirmed`; monitor shows `seller_accepted`, `fallbackLevel 0`.

### 3.2 Seller rejects → next seller
1. Repeat 3.1 up to the offer.
2. Seller B: **Reject → Out of stock**.
3. Expected: Seller B's stock is released; Seller C receives the offer;
   monitor shows attempt 1 `rejected`, attempt 2 `offered`, `fallbackLevel 1`.
4. **Customer must see no change** — rejections are internal.

### 3.3 Seller timeout → next seller
1. Repeat to the offer; do nothing for `sellerAcceptanceTimeoutSeconds`.
2. Expected: within one sweeper interval (~15 s) the offer expires,
   reservation is released, next seller is offered.
3. Attempt shows `timed_out`, not `rejected`.

### 3.4 All sellers fail → warehouse
1. Set B and C stock to 0 (leave warehouse stocked).
2. Place the order.
3. Expected: monitor shows both sellers `reservation_failed`, then
   `warehouse_accepted`, `fallbackLevel 2`. Customer **still sees Quick Delivery**.

### 3.5 Warehouse fails → standard courier
1. Set warehouse stock to 0 as well, but leave the **original** seller's
   product in stock so the order can still be placed.
2. Place the order.
3. Expected:
   - monitor: `courier_assigned`, `fallbackLevel 3`
   - customer page switches to **"Standard Delivery"**
   - **the quick-commerce ETA in minutes is gone** — no fake promise survives
   - a Shiprocket shipment/AWB is attached

### 3.6 Delivery partner ranked offers
1. Two delivery partners online near the seller.
2. Seller accepts → marks `packed`.
3. Expected: the better-ranked partner alone gets the offer, with a countdown.
4. Reject or wait out the timeout → the second partner is offered.
5. **Only one partner can ever accept.**

### 3.7 Concurrency (two browsers)
1. One product, `stock = 1`.
2. Two customers check out simultaneously.
3. Expected: one succeeds; the other falls back or fails cleanly.
   Stock never goes negative; `reservedStock` never exceeds `stock`.

---

## Step 4 — Security spot-checks

| Check | Expected |
|---|---|
| Seller B calls accept with Seller C's `attemptId` | `403` |
| Delivery partner opens an unassigned order | `403` |
| Customer sends `sellerId` / `deliveryCharge` / `estimatedDelivery` in `POST /orders` | ignored |
| Customer inspects socket traffic | never sees seller rejections, rank scores, or other customers' orders |

---

## Step 5 — Regression checks for the two bug fixes shipped alongside

1. **Cart clears after checkout** (was permanently broken — unreachable code).
   - COD order → cart empty ✅
   - Razorpay order → cart empty ✅
   - Failed/declined payment → **cart still intact** ✅
   - "Buy Now" direct purchase → **rest of cart untouched** ✅
2. **Cart quantity change works** (previously threw `ReferenceError` on every call).
   - Change any cart item's quantity → succeeds ✅

---

## Step 6 — Rolling back

Revert to pre-CR-002 behaviour without a deploy:

```jsonc
{
  "crossSellerSubstitutionEnabled": false,
  "deliveryAssignmentMode": "broadcast"
}
```

New DB fields are all optional and ignored by the old code, so a code rollback
needs no data migration.

---

## What this runbook cannot prove

Manual UI testing does not substitute for the Layer 2 database tests. Run those
separately against a replica set (`npm run test:layer2`); only they prove the
atomicity guarantees under real concurrency.
