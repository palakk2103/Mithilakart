# CR-002 — 03: Database Changes

**Principle:** every change is **additive**. No field is removed, no field changes type, no existing index is dropped. Every existing document remains valid without migration; migration scripts only *populate* new optional fields.

---

## 1. Summary

| Collection | Action |
|---|---|
| `products` | EXTEND — `catalogKey` (nullable) + index |
| `sellers` | EXTEND — 4 operational fields |
| `orders` | EXTEND — fulfillment snapshot block |
| `delivery_assignments` | EXTEND — offer fields |
| `order_fulfillments` | **NEW** |
| `fulfillment_attempts` | **NEW** |
| `platform_settings` | no schema change (generic key/value) |
| `marketplace_config` | EXTEND — optional per-tab overrides |
| everything else | UNCHANGED |

---

## 2. `products` — EXTEND (CRITICAL)

```js
// ADD to src/models/Product.js
catalogKey: { type: String, default: null, trim: true, index: true },
```

**Semantics**

- `catalogKey === null` (default) -> the product participates in **no** cross-seller substitution. Only its owning seller can fulfil it. **This is exactly today's behaviour**, so every existing product is unaffected.
- Two products sharing a non-null `catalogKey` are declared by Admin to be *the same sellable thing*.

**Index**

```js
productSchema.index(
  { catalogKey: 1, sellerId: 1 },
  { partialFilterExpression: { catalogKey: { $type: 'string' }, deletedAt: null } }
);
```

Partial so null-keyed products cost nothing.

**Population policy (R1 mitigation)**

- Never auto-derived from fuzzy title similarity.
- Sources, in order of trust: admin-curated mapping -> verified GTIN/EAN -> admin-approved bulk CSV.
- A seller cannot set `catalogKey` on their own product.

---

## 3. `sellers` — EXTEND

```js
isWarehouse:             { type: Boolean, default: false, index: true },
isAcceptingOrders:       { type: Boolean, default: true },
preparationTimeMinutes:  { type: Number, default: null, min: 0 },
fulfillmentRadiusKm:     { type: Number, default: null, min: 0 },
```

- `isWarehouse` — a warehouse is a Seller. It reuses inventory, geo (2dsphere), listings, order items, settlement, and the seller panel. No parallel `Warehouse` collection.
- `isAcceptingOrders` — a soft pause distinct from `status: 'suspended'`. Defaults `true` so all existing sellers stay eligible.
- `preparationTimeMinutes` / `fulfillmentRadiusKm` — `null` means "inherit the platform default", so no backfill is required.

---

## 4. `orders` — EXTEND (fulfillment snapshot)

Per CR-002, historical orders must not change when Admin later edits configuration. All values below are frozen at fulfillment-finalisation time.

```js
fulfillment: {
  type: {                                  // 'quick_local' | 'warehouse' | 'courier'
    type: String, enum: FULFILLMENT_TYPE_VALUES, default: null,
  },
  source:            { type: String, enum: FULFILLMENT_SOURCE_VALUES, default: null },
  sellerId:          { type: ObjectId, ref: 'Seller', default: null },
  warehouseId:       { type: ObjectId, ref: 'Seller', default: null },
  courierProvider:   { type: String, default: null },
  deliveryMode:      { type: String, default: null },   // 'quick' | 'standard'
  estimatedDeliveryMinutes: { type: Number, default: null },
  estimatedDeliveryAt:      { type: Date,   default: null },
  fallbackLevel:     { type: Number, default: 0 },       // 0 seller, 1 next seller, 2 warehouse, 3 courier
  fallbackReason:    { type: String, default: null },
  decidedAt:         { type: Date, default: null },
  configSnapshot:    { type: Mixed, default: null },     // the exact rule values used
},

platformFee:  { type: Number, default: 0, min: 0 },
packagingFee: { type: Number, default: 0, min: 0 },
```

**Backward compatibility**

- The existing top-level `fulfilmentType` (note the single-l British spelling already in the codebase), `deliveryType`, `deliveryPromiseMinutes`, `estimatedDeliveryAt`, `shipment`, `sellerSubOrders` fields are **all retained and kept populated**. Existing readers — including `_afterOrderConfirmed`, the admin panel, and `e2e-*` tests — continue to work untouched.
- `fulfillment.*` is the new authoritative block; the legacy fields are maintained as a mirror.

**Index**

```js
orderSchema.index({ 'fulfillment.sellerId': 1, status: 1 });
```

---

## 5. `order_fulfillments` — NEW

One document per order. System of record for the fulfillment lifecycle, so nothing depends on in-memory state.

```js
{
  orderId:        { type: ObjectId, ref: 'Order', required: true, unique: true, index: true },
  marketplaceTab: { type: String, enum: MARKETPLACE_TAB_VALUES, required: true },

  state: {                                  // see 06_CR002_State_Machine.md
    type: String, enum: FULFILLMENT_STATE_VALUES,
    default: 'searching', index: true,
  },

  requiredItems: [{                         // immutable snapshot of what must be fulfilled
    catalogKey:   String,                   // null -> only the origin seller can fulfil
    productId:    ObjectId,                 // originally-carted product
    variantId:    ObjectId,
    quantity:     Number,
    unitPrice:    Number,
  }],

  customerLocation: { lat: Number, lng: Number, pincode: String },

  currentAttemptId: { type: ObjectId, ref: 'FulfillmentAttempt', default: null },
  attemptCount:     { type: Number, default: 0 },
  fallbackLevel:    { type: Number, default: 0 },

  searchDeadlineAt:     { type: Date, default: null, index: true },  // fulfillment search timeout
  acceptanceDeadlineAt: { type: Date, default: null, index: true },  // seller acceptance timeout

  excludedSellerIds: [{ type: ObjectId, ref: 'Seller' }],            // tried and failed

  resolvedSellerId: { type: ObjectId, ref: 'Seller', default: null },
  failureCode:      { type: String, default: null },                 // see 08_CR002_Error_Handling.md
  traceId:          { type: String, default: null, index: true },

  configSnapshot:   { type: Mixed, default: null },
  createdAt, updatedAt,
}
```

**Indexes**

```js
{ orderId: 1 }                                unique
{ state: 1, acceptanceDeadlineAt: 1 }         // sweeper: expired acceptances
{ state: 1, searchDeadlineAt: 1 }             // sweeper: expired searches
{ traceId: 1 }
```

The two sweeper indexes are what make timeouts survive a process restart: deadlines are absolute timestamps in MongoDB, not `setTimeout` handles in RAM.

---

## 6. `fulfillment_attempts` — NEW

One document per seller/warehouse tried. Gives per-order traceability of *why* each candidate was skipped or failed.

```js
{
  fulfillmentId: { type: ObjectId, ref: 'OrderFulfillment', required: true, index: true },
  orderId:       { type: ObjectId, ref: 'Order', required: true, index: true },
  sellerId:      { type: ObjectId, ref: 'Seller', default: null },
  attemptNumber: { type: Number, required: true },
  kind:          { type: String, enum: ['seller', 'warehouse', 'courier'], required: true },

  status: {
    type: String,
    enum: ['reserved', 'offered', 'accepted', 'rejected', 'timed_out', 'reservation_failed', 'released'],
    required: true, index: true,
  },

  rankScore:        { type: Number, default: null },
  rankBreakdown:    { type: Mixed,  default: null },   // per-factor contributions
  distanceKm:       { type: Number, default: null },
  routeEtaMinutes:  { type: Number, default: null },
  preparationMinutes: { type: Number, default: null },

  reservations: [{                                     // exactly what was reserved, for safe release
    productId: ObjectId,
    quantity:  Number,
    releasedAt: Date,
  }],

  offeredAt, respondedAt, expiresAt: Date,
  failureCode:   { type: String, default: null },
  failureDetail: { type: String, default: null },
  createdAt, updatedAt,
}
```

**Indexes**

```js
{ fulfillmentId: 1, attemptNumber: 1 }   unique
{ orderId: 1, createdAt: -1 }
{ sellerId: 1, status: 1, createdAt: -1 }   // seller-facing "pending offers" query
```

The `reservations[]` array is the recovery record: if the process dies after reserving but before the seller responds, the sweeper reads this array and releases exactly what was taken — no more, no less.

---

## 7. `delivery_assignments` — EXTEND

```js
offeredTo:      [{ type: ObjectId, ref: 'DeliveryPartner' }],
offerExpiresAt: { type: Date, default: null, index: true },
rejectedBy:     [{ type: ObjectId, ref: 'DeliveryPartner' }],
offerRound:     { type: Number, default: 0 },
```

The existing unique `{ orderId: 1 }` index and the `acceptByOrderId` race-to-claim guard are **unchanged** — that guard is already correct and remains the final arbiter of who gets the order.

---

## 8. `marketplace_config` — EXTEND (optional overrides)

```js
fulfillmentOverrides: {
  sellerSearchRadiusKm:            { type: Number, default: null },
  quickFulfillmentSearchTimeoutSeconds: { type: Number, default: null },
  sellerAcceptanceTimeoutSeconds:  { type: Number, default: null },
  warehouseFallbackEnabled:        { type: Boolean, default: null },
  courierFallbackEnabled:          { type: Boolean, default: null },
},
```

`null` -> inherit the platform-level `PlatformSetting`. Resolution order: `MarketplaceConfig.fulfillmentOverrides` -> `PlatformSetting` -> `DEFAULT_PLATFORM_SETTINGS` constant.

---

## 9. `platform_settings` — no schema change

New keys are inserted as ordinary `{ key, value }` rows through the existing `PUT /admin/settings` handler. Defaults are added to `DEFAULT_PLATFORM_SETTINGS` in `src/constants/platformSettings.js`. See `07_CR002_Admin_Configuration.md`.

---

## 10. Migration

New script: `backend/scripts/migrate-cr002.js`, following the existing `migrate-cr001.js` / `migrate-phase3.js` conventions.

| Step | Action | Idempotent | Reversible |
|---|---|---|---|
| 1 | Create indexes on `products.catalogKey`, `order_fulfillments`, `fulfillment_attempts` | yes | drop index |
| 2 | Default `sellers.isAcceptingOrders = true` where missing | yes | unset field |
| 3 | Default `sellers.isWarehouse = false` where missing | yes | unset field |
| 4 | Seed new `platform_settings` rows **only if absent** (never overwrite an admin value) | yes | delete row |
| 5 | Backfill `orders.fulfillment` from existing `fulfilmentType` / `deliveryType` for historical orders (read-only reconstruction) | yes | unset block |
| 6 | `catalogKey` backfill | **not run automatically** | — |

Step 6 is deliberately excluded from the migration. Populating `catalogKey` is a business/curation decision with real customer-facing consequences (R1) and must go through the admin catalog-matching workflow.

**Rollback:** steps 1–5 are individually reversible and the new collections can be dropped. Because no existing field is modified or removed, rolling back the code alone restores prior behaviour even if the new fields remain in the database.

---

## 11. ER Delta

```
Order (1) ──── (1) OrderFulfillment
                     │
                     └── (1..n) FulfillmentAttempt ──── (0..1) Seller
                                                          │
                                                          ├─ isWarehouse: true  -> warehouse fallback
                                                          └─ isWarehouse: false -> local seller

Product.catalogKey ──┐
                     ├── groups products across sellers into one substitutable set
Product.sellerId  ───┘

Order (1) ──── (0..1) DeliveryAssignment  [+ offeredTo/offerExpiresAt]
```
