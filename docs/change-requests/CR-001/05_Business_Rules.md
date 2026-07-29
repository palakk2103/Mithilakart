# CR-001 — Business Rules

**Change Request:** CR-001  
**Date:** 2026-07-20  

---

## 1. Marketplace Tab Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| MR-001 | Four marketplace tabs exist: `mithilakart`, `mithilak`, `quick_shop`, `groceries_fresh` | Enum validation |
| MR-002 | Legacy alias `standard` maps to `mithilakart` during migration | API middleware |
| MR-003 | Each tab has exactly one delivery model (standard or fixed_promise) | `marketplace_config` |
| MR-004 | Inactive tab cannot accept new listings or orders | MarketplaceEngine |
| MR-005 | Customer must operate in exactly one tab context per session/cart | CartService |

---

## 2. Master Product Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| PR-001 | Master product holds: title, SKU, description, images, categoryId, stock, brand, attributes | Schema |
| PR-002 | Master product does NOT hold tab-specific price or delivery promise | Schema + validator |
| PR-003 | SKU unique per seller (not globally) | Index `{ sellerId, sku }` unique |
| PR-004 | Master product must be `masterStatus=approved` before any listing can go live | ListingService |
| PR-005 | Master product moderation is separate from listing moderation | Admin workflow |
| PR-006 | Soft-deleted master product hides all its listings | Cascade visibility |
| PR-007 | Stock decrement on order always against master `products.stock` | OrderService transaction |

---

## 3. Marketplace Listing Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| LR-001 | One listing per `(productId, marketplaceTab, sellerId)` | Unique index |
| LR-002 | Listing holds price, MRP, visibility, delivery promise | Schema |
| LR-003 | `price <= mrp` always | Validator |
| LR-004 | Listing cannot be `approved` if master product is not approved | ListingService |
| LR-005 | Listing `isVisible=true` only when `listingStatus=approved` | Service layer |
| LR-006 | Rejected listing cannot be visible | State machine |
| LR-007 | Delivery promise MUST NOT exist on master product | **CR-001 core rule** |
| LR-008 | Delivery promise MUST exist on listing for quick commerce tabs | Validator |
| LR-009 | Standard tabs: `deliveryType=standard`, `deliveryPromiseMinutes=null` | Validator |
| LR-010 | Quick tabs: `deliveryType=fixed_promise`, `deliveryPromiseMinutes ∈ {15,20,25,30}` | Validator |
| LR-011 | Seller can only create listing for tabs they are eligible for | Seller eligibility check |
| LR-012 | Listing price changes do not affect in-flight orders (snapshot at order time) | OrderService |

---

## 4. Seller Eligibility Rules

| Rule ID | Tab | Eligibility |
|---------|-----|-------------|
| SE-001 | `mithilakart` | Seller `status=active`, `kycStatus=approved` |
| SE-002 | `mithilak` | SE-001 + `mithilakEligible=true` (admin grant) |
| SE-003 | `quick_shop` | SE-001 + `quickCommerceEligible=true` |
| SE-004 | `groceries_fresh` | SE-001 + `groceryEligible=true` |
| SE-005 | Admin can revoke tab eligibility; existing approved listings → suspended | AdminVendorService |

---

## 5. Category Visibility Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| CR-001 | Category must have at least one `visibleTabs[]` entry | Admin validator |
| CR-002 | Subcategory `visibleTabs` ⊆ parent `visibleTabs` | CategoryService |
| CR-003 | Category not visible on tab → excluded from tab category tree | CategoryService |
| CR-004 | Product master category must be visible on tab for listing to publish | ListingService |
| CR-005 | Admin can set different visible tabs per subcategory independently | Admin UI |

---

## 6. Cart Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| CT-001 | Cart is scoped to single `marketplaceTab` | Cart schema |
| CT-002 | Cart items reference `listingId`, not `productId` alone | Cart validator |
| CT-003 | Adding item from different tab → 409 `CART_TAB_MISMATCH` | CartService |
| CT-004 | Switching tab requires empty cart or explicit cart clear | API design |
| CT-005 | Price validated against current listing at add and checkout | CartService |
| CT-006 | Out of stock on master product blocks all listings | Stock check |
| CT-007 | Guest cart merge on login preserves tab scope | CartMergeService |

---

## 7. Order & Checkout Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| OR-001 | Order records `marketplaceTab`, `deliveryType`, `deliveryPromiseMinutes` snapshot | Order schema |
| OR-002 | Each order line includes `listingSnapshot` | OrderService |
| OR-003 | Quick commerce order: `estimatedDeliveryAt = orderTime + promiseMinutes` | OrderService |
| OR-004 | Standard order: `estimatedDeliveryAt` from pincode + delivery rules | PricingService |
| OR-005 | Cannot checkout if pincode not serviceable for quick tab | ServiceabilityService |
| OR-006 | Mixed-tab checkout forbidden | Cart validation |
| OR-007 | SLA breach flagged if delivery exceeds promise + grace (5 min) | DeliveryOrderService |

---

## 8. Pricing Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| PC-001 | Checkout price always from listing, never master product | PricingService |
| PC-002 | Coupon discount applied after listing price | CouponService |
| PC-003 | Coupon must include order's `marketplaceTab` in `applicableTabs` | CouponService |
| PC-004 | Flash sale price overrides listing price when active | PromotionService |
| PC-005 | Commission calculated on listing price at order time | CommissionService |
| PC-006 | Tax rules may vary by tab (configurable) | TaxConfig |

---

## 9. Promotion Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| PM-001 | Flash sale targets `listingId` (preferred) or tab + productId | FlashSaleService |
| PM-002 | Featured products scoped by tab | FeaturedProduct |
| PM-003 | Home section product cards reference listing for active tab | CmsService |
| PM-004 | Banner scheduling unchanged; tab visibility via `visibleTabs[]` | CmsService |

---

## 10. Admin Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| AD-001 | Master product approval: `products.approve` permission | RBAC |
| AD-002 | Listing approval: `listings.approve` permission (new) | RBAC |
| AD-003 | Mithilak seller grant: `sellers.approve` + audit log | AdminVendorService |
| AD-004 | Tab config change: `marketplace.manage` permission (new) | RBAC |
| AD-005 | Reject listing requires moderation note | Validator |
| AD-006 | Suspend listing does not delete master product | State machine |
| AD-007 | Bulk listing approve max 100 IDs | Existing bulk pattern |

---

## 11. Customer Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| CU-001 | Customer sees only approved + visible listings for active tab | Query filter |
| CU-002 | Product detail shows delivery promise from listing, not product | API response |
| CU-003 | Search results scoped to active tab | SearchService |
| CU-004 | Wishlist entries are listing-specific | WishlistService |
| CU-005 | Order history filterable by tab | OrderController |
| CU-006 | Reviews submitted against master productId (one review per product per user) | ReviewService |

---

## 12. Quick Commerce Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| QC-001 | Delivery promise options: 15, 20, 25, 30 minutes only | Enum |
| QC-002 | Seller selects promise per listing (not per product globally) | Listing create |
| QC-003 | Promise displayed on PLP, PDP, cart, checkout, order confirmation | API + frontend |
| QC-004 | Serviceability: pincode must be in quick-commerce zone for tab | ServiceabilityService |
| QC-005 | Dark store / hub assignment (future) — CR-001 documents hook only | DeliveryService |
| QC-006 | Order auto-escalation if not assigned within 5 min of promise/2 | Scheduled job (future) |

---

## 13. Standard Delivery Rules (Mithilakart & Mithilak)

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| SD-001 | No fixed promise on listing | Validator |
| SD-002 | ETA computed from customer pincode + delivery_charge_rules | PricingService |
| SD-003 | Mithilak listings only from `mithilakEligible` sellers | Seller gate |
| SD-004 | Delivery charge may differ by tab via rule config | DeliveryChargeRule |

---

## 14. Search Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| SR-001 | Search index includes listingId + marketplaceTab | SearchService |
| SR-002 | Search without tab defaults to `mithilakart` | API default |
| SR-003 | Only approved + visible listings appear in search | Query filter |
| SR-004 | Same product may appear once per tab in results (via listing) | Index design |
| SR-005 | Autocomplete prefix match scoped to tab | SearchService |

---

## 15. Analytics & Reporting Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| AN-001 | All commerce reports include `marketplaceTab` dimension | ReportService |
| AN-002 | Revenue attributed to tab of order | Order field |
| AN-003 | Seller dashboard shows GMV split by tab | SellerDashboardService |
| AN-004 | SLA compliance report for quick tabs (% delivered within promise) | AdminReportService |

---

## 16. New RBAC Permissions

| Permission | Group | Description |
|------------|-------|-------------|
| `listings.view` | Catalog | View listing moderation queue |
| `listings.approve` | Catalog | Approve/reject listings |
| `listings.suspend` | Catalog | Suspend active listings |
| `marketplace.manage` | Settings | Configure tab rules |
| `marketplace.serviceability` | Delivery | Manage pincode zones |

Super Admin receives all automatically.

---

## 17. Validation Matrix (Quick Reference)

| Field | mithilakart | mithilak | quick_shop | groceries_fresh |
|-------|-------------|----------|------------|-----------------|
| price on listing | Required | Required | Required | Required |
| deliveryPromiseMinutes | Prohibited | Prohibited | Required | Required |
| deliveryType | standard | standard | fixed_promise | fixed_promise |
| seller eligibility | All approved | Mithilak approved | Quick enabled | Grocery enabled |
| category visibleTabs | Must include tab | Must include tab | Must include tab | Must include tab |
