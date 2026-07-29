# CR-001 — Migration Strategy

**Change Request:** CR-001  
**Date:** 2026-07-20  

---

## 1. Migration Required?

**Yes.** Existing implementation (Phases 0–10) stores price, stock, and `commerceFlows[]` on `products`. CR-001 requires extracting tab-specific commercial data to `marketplace_listings`.

**Migration type:** Online, zero-downtime, backward-compatible during transition.

---

## 2. Migration Principles

1. **No data loss** — every product with `commerceFlows[]` gets corresponding listings
2. **Dual-read period** — APIs read listings first, fall back to product fields
3. **Dual-write period** — seller updates write to both (CR-2 only)
4. **Rollback safe** — migration script has inverse operation
5. **No production migration until staging validated**

---

## 3. Schema Migration Steps

### Step 1: Add Collections (Non-Breaking)

```
CREATE marketplace_listings (empty)
CREATE marketplace_config (seed 4 tabs)
ADD categories.visibleTabs (nullable initially)
ADD sellers.mithilakEligible, quickCommerceEligible, groceryEligible (default false)
```

### Step 2: Backfill Listings

For each product where `deletedAt = null`:

```javascript
for (const flow of product.commerceFlows) {
  const tab = MAP_FLOW_TO_TAB(flow);  // standard → mithilakart
  const deliveryType = QUICK_TABS.includes(tab) ? 'fixed_promise' : 'standard';
  
  create marketplace_listing {
    productId: product._id,
    sellerId: product.sellerId,
    marketplaceTab: tab,
    price: product.price,
    mrp: product.mrp,
    listingStatus: mapProductStatus(product.status),
    isVisible: product.status === 'approved',
    deliveryType,
    deliveryPromiseMinutes: deliveryType === 'fixed_promise' ? 30 : null,  // default; flag for seller review
    publishedAt: product.createdAt
  }
}
```

**Quick commerce default promise:** Set to 30 min during migration; flag listings for seller confirmation.

### Step 3: Backfill Categories

```javascript
category.visibleTabs = category.commerceFlows.map(MAP_FLOW_TO_TAB);
```

### Step 4: Rename Product Status

```javascript
product.masterStatus = product.status;
// Keep product.status for dual-read during transition
```

### Step 5: Cart & Order Migration (CR-2)

**Carts:** Existing cart items with `productId` → resolve default listing for cart's commerceFlow → set `listingId`.

**Orders (historical):** Add `marketplaceTab` from `commerceFlow`; generate retrospective listing snapshots from product data at migration time (best-effort).

---

## 4. Enum Mapping

| Legacy `commerceFlows` | New `marketplaceTab` |
|------------------------|----------------------|
| `standard` | `mithilakart` |
| `mithilak` | `mithilak` |
| `quick_shop` | `quick_shop` |
| `fresh_grocery` | `groceries_fresh` |

| Legacy `commerceFlow` (order) | New `marketplaceTab` |
|-------------------------------|----------------------|
| Same mapping | Same mapping |

---

## 5. Dual-Read / Dual-Write Timeline

| Period | Read | Write |
|--------|------|-------|
| CR-1 | Product fields (legacy) | Master + new listings |
| CR-2 | Listing first, product fallback | Both (sync) |
| CR-3 | Listing only | Listing + master stock |
| CR-3 + 2 releases | Listing only | Listing only; product.price deprecated |

---

## 6. Migration Script Outline

```
migrations/
  CR001_001_seed_marketplace_config.js
  CR001_002_add_visible_tabs_to_categories.js
  CR001_003_backfill_marketplace_listings.js
  CR001_004_add_seller_tab_eligibility.js
  CR001_005_migrate_carts_to_listing_id.js      (CR-2)
  CR001_006_backfill_order_listing_snapshots.js   (CR-2)
  CR001_rollback_003_remove_listings.js           (emergency)
```

**Execution order:** Sequential; each step idempotent.

---

## 7. Validation Queries (Post-Migration)

```javascript
// Every product with commerceFlows has listings
db.products.find({ commerceFlows: { $exists: true, $ne: [] } }).count()
=== db.marketplace_listings.distinct('productId').length

// No listing without master product
db.marketplace_listings.find({ productId: { $nin: productIds } }).count() === 0

// Quick listings have promise
db.marketplace_listings.find({
  marketplaceTab: { $in: ['quick_shop', 'groceries_fresh'] },
  deliveryPromiseMinutes: null
}).count() === 0

// Categories have visibleTabs
db.categories.find({ visibleTabs: { $exists: false } }).count() === 0
```

---

## 8. Rollback Plan

| Step | Action |
|------|--------|
| 1 | Stop CR-2 deployment (revert to dual-read product fields) |
| 2 | Run `CR001_rollback_003` — archive listings, do not delete |
| 3 | Restore API to read product.commerceFlows |
| 4 | Notify sellers of temporary revert |

**Rollback window:** Before CR-3 legacy field removal — rollback is straightforward. After CR-3, rollback requires re-backfill from listing archive.

---

## 9. Zero-Downtime Strategy

1. Deploy CR-1 schema additions (additive only)
2. Run backfill migration during low traffic
3. Deploy CR-2 code with dual-read
4. Monitor error rates for 48h
5. Deploy CR-3; stop writing legacy fields
6. Schedule legacy field removal after 2 release cycles

---

## 10. Seller Communication

| Milestone | Message |
|-----------|---------|
| Pre-migration | "We're enabling per-marketplace pricing and delivery settings" |
| Post CR-1 | "Review your Quick Shop listings — confirm delivery promise" |
| Post CR-2 | "Products now managed as master + marketplace listings" |

---

## 11. Migration NOT Required For

- Auth tokens, users, sellers (except new eligibility flags)
- Payments, wallets, refunds
- Reviews, Q&A (stay on productId)
- Delivery partners, assignments
- Admin roles (except new permissions seed)
- Audit logs

---

## 12. Estimated Downtime

**Zero.** All migrations are online additive + backfill. Brief read latency increase during backfill on large catalogs.
