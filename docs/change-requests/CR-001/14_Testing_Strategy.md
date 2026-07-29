# CR-001 — Updated Testing Strategy

**Change Request:** CR-001  
**Date:** 2026-07-20  
**Base:** Testing Master Plan v1.0  

---

## 1. Testing Scope Additions

CR-001 adds **~80 new test cases** across unit, integration, and E2E layers. Existing 35+ backend tests remain; extend, do not replace.

---

## 2. Unit Tests (New)

### 2.1 MarketplaceListing Validator

| Test | Input | Expected |
|------|-------|----------|
| Quick tab requires promise | tab=quick_shop, promise=null | 422 |
| Standard tab rejects promise | tab=mithilakart, promise=20 | 422 |
| Valid promises | 15, 20, 25, 30 | Pass |
| Invalid promise | 10 | 422 |
| price > mrp | price=300, mrp=200 | 422 |
| Duplicate listing | same productId+tab | 409 |

### 2.2 MarketplaceEngineService

| Test | Expected |
|------|----------|
| Resolve listing for approved product+tab | Returns listing |
| Master not approved | Listing not publishable |
| Stock = 0 | isAvailable = false |
| Seller not mithilak eligible | Cannot create mithilak listing |

### 2.3 Category visibleTabs

| Test | Expected |
|------|----------|
| Empty visibleTabs | 422 |
| Subcategory exceeds parent | 422 |
| Filter tree by tab | Correct subset |

### 2.4 CartService

| Test | Expected |
|------|----------|
| Add listing to empty cart | Sets cart tab |
| Add listing from different tab | 409 CART_TAB_MISMATCH |
| Price refresh on listing change | Updated unit price |

### 2.5 OrderService

| Test | Expected |
|------|----------|
| Order snapshots listing | listingSnapshot populated |
| Quick order sets promise | deliveryPromiseMinutes set |
| Standard order no promise | deliveryPromiseMinutes null |
| estimatedDeliveryAt quick | orderTime + promise |

---

## 3. Integration Tests (New)

### 3.1 Seller Flow E2E

```
Create master → admin approve master → create quick_shop listing (20 min)
→ admin approve listing → listing visible on tab
```

### 3.2 Customer Flow E2E (Per Tab)

For each tab (`mithilakart`, `quick_shop`, `groceries_fresh`):
```
Browse categories → view product → add to cart → checkout → order created
```

### 3.3 Multi-Tab Product E2E

```
Same product listed on mithilakart (₹255) and quick_shop (₹249, 20min)
→ Customer on quick_shop sees ₹249 + promise
→ Customer on mithilakart sees ₹255 + standard ETA
→ Separate carts, separate orders
```

### 3.4 Serviceability

```
Quick shop checkout to non-serviceable pincode → 422
Serviceable pincode → checkout succeeds
```

### 3.5 Admin Dual Moderation

```
Master pending → listing cannot approve
Master approved → listing approve → live
```

---

## 4. Regression Suite

Run full existing suite (35 tests) after each CR phase. Zero regressions on:

- Auth flows
- Payment idempotency
- Wallet credit
- Delivery OTP
- RBAC 403
- Rate limiting
- Health/metrics

---

## 5. Migration Tests

| Test | Verification |
|------|--------------|
| Migrate product with commerceFlows | Creates N listings |
| Price copied to each listing | listing.price = product.price |
| Quick tab gets default promise | Manual review queue |
| Rollback script | Restores commerceFlows |

Run on staging clone before production.

---

## 6. Performance Tests (k6 Additions)

| Scenario | Target |
|----------|--------|
| Tab-scoped category browse | p95 < 200ms |
| Listing-aware product detail | p95 < 200ms |
| Search with marketplaceTab | p95 < 200ms |
| Cart add with listingId | p95 < 300ms |

Extend `load-tests/catalog-search.k6.js` with tab parameter.

---

## 7. Security Tests

| Test | Expected |
|------|----------|
| Seller A cannot edit Seller B listing | 403/404 |
| Customer cannot add unapproved listing to cart | 409 |
| Admin without listings.approve | 403 |
| Inject invalid marketplaceTab enum | 422 |

---

## 8. Test Data Fixtures (New)

```javascript
// fixtures/marketplace.fixture.js
{
  masterProduct: { title: 'Aashirvaad Atta', stock: 500 },
  listings: [
    { tab: 'mithilakart', price: 255, deliveryType: 'standard' },
    { tab: 'quick_shop', price: 249, promise: 20 },
    { tab: 'groceries_fresh', price: 245, promise: 15 }
  ],
  category: { visibleTabs: ['mithilakart', 'quick_shop', 'groceries_fresh'] }
}
```

---

## 9. Coverage Targets (CR-001 Modules)

| Module | Target Line Coverage |
|--------|---------------------|
| MarketplaceListingService | 90% |
| MarketplaceEngineService | 85% |
| CartService (listing paths) | 85% |
| OrderService (snapshot paths) | 85% |
| CategoryService (visibleTabs) | 80% |

---

## 10. Production Readiness Additions

Add to Testing Master Plan checklist:

- [ ] Multi-tab product E2E passes on staging
- [ ] Migration script verified on production clone
- [ ] Search returns correct tab-scoped results
- [ ] SLA snapshot correct on quick commerce orders
- [ ] Cart tab mismatch returns 409
- [ ] Legacy commerceFlow alias still works (deprecation period)
