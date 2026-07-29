# CR-001 — Business Impact Report

**Change Request:** CR-001  
**Role:** Principal Architect Impact Assessment  
**Date:** 2026-07-20  

---

## 1. Executive Summary

CR-001 shifts the platform from a **tag-based commerce flow model** (`commerceFlows[]` on Product) to a **Master Product + Marketplace Listing** model. This is the single most impactful catalog change since Phase 2. It affects catalog, cart, orders, pricing, promotions, search, seller portal, admin moderation, delivery logic, and analytics — but **does not** require redesign of auth, payments infrastructure, RBAC, or core platform services.

**Overall impact:** Medium-to-High on catalog/commerce modules; Low on auth/platform modules.

---

## 2. Current State vs Target State

| Aspect | Current (Implemented) | Target (CR-001) |
|--------|----------------------|-----------------|
| Product entity | Holds price, stock, `commerceFlows[]` | Master catalog only — identity, media, category, master stock |
| Per-tab pricing | Single price on product | Per listing price/MRP |
| Delivery promise | Implicit / on product or flow | Explicit on listing; fixed minutes for quick commerce |
| Category visibility | `commerceFlows[]` tag | `visibleTabs[]` — category hidden unless tab selected |
| Cart line item | References `productId` | References `listingId` + `marketplaceTab` |
| Order | `commerceFlow` field | `marketplaceTab` + `deliveryPromiseSnapshot` |
| Search index | Product document | Product + active listings (denormalized index doc) |

---

## 3. Module Impact Matrix

Impact levels: **NC** No Change · **Mi** Minor · **Me** Medium · **Ma** Major · **CR** Critical Redesign

| Module | Impact | Rationale |
|--------|--------|-----------|
| **M01 — Core Platform** | NC | Config, health, logging unchanged |
| **M02 — Customer Auth** | Mi | Optional `preferredMarketplaceTab` on user profile; cart merge must respect tab |
| **M03 — Seller Auth** | NC | Login/JWT unchanged |
| **M04 — Admin Auth** | NC | RBAC unchanged; new permissions added (see M30) |
| **M05 — Delivery Auth** | NC | Partner auth unchanged |
| **M06 — User Profile** | Mi | Display order history grouped by marketplace tab |
| **M07 — Address Management** | Me | Quick commerce requires serviceability check per pincode + tab |
| **M08 — Payment Methods** | NC | Payment instruments unchanged |
| **M09 — Catalog (Categories & Products)** | **CR** | Split master product from marketplace listing; category `visibleTabs[]` |
| **M10 — CMS (Storefront)** | Me | Home sections/banners scoped by tab; product refs become listing refs |
| **M11 — Cart** | **Ma** | Items bind to listingId; tab-homogeneous cart enforcement |
| **M12 — Orders** | **Ma** | Listing snapshots; delivery promise at order time; tab-specific status paths |
| **M13 — Payments** | Mi | Amount from listing prices; idempotency unchanged |
| **M14 — Wallet** | NC | Ledger unchanged |
| **M15 — Coupons & Promotions** | **Ma** | Scope coupons/flash sales to marketplace tab + listing |
| **M16 — Wishlist** | Me | Wishlist item = listing reference (same product, different tab = different wishlist entry) |
| **M17 — Reviews** | Mi | Reviews remain on **master productId** (one review per product, not per listing) |
| **M18 — Q&A** | Mi | Q&A remains on master productId |
| **M19 — Seller Dashboard** | Me | Stats split by marketplace tab |
| **M20 — Seller Inventory** | **Ma** | Master stock pool; listing availability flags; optional per-listing allocation |
| **M21 — Seller Earnings** | Me | Earnings attributed via order listing tab |
| **M22 — Seller Settings** | Mi | Seller `allowedMarketplaceTabs[]` based on KYC/approval |
| **M23 — Seller Customers** | Mi | Filter by tab in analytics |
| **M24 — Delivery Operations** | **Ma** | Two delivery modes: standard ETA vs fixed promise SLA |
| **M25 — Returns & Refunds** | Mi | Return line references listing snapshot on order item |
| **M26 — Admin User Management** | NC | Unchanged |
| **M27 — Admin Vendor Management** | Me | Grant/revoke Mithilak tab eligibility per seller |
| **M28 — Admin Finance** | Me | Commission rules may vary by marketplace tab |
| **M29 — Admin Reports** | **Ma** | Reports dimensioned by marketplace tab |
| **M30 — Admin RBAC & Audit** | Mi | New permissions: `listings.approve`, `marketplace.manage` |
| **M31 — Support Tickets** | NC | Unchanged |
| **M32 — Notifications** | Mi | Templates include delivery promise in quick commerce messages |
| **M33 — Search Service** | **Ma** | Index listings; filter by tab; return listing-aware results |
| **M34 — File Storage** | NC | Unchanged |
| **M35 — Commerce Flow Engine** | **CR** | Becomes **M36 — Marketplace Engine** (listing resolution, tab context, serviceability) |

---

## 4. New Module

| Module | Purpose |
|--------|---------|
| **M36 — Marketplace Engine** | Resolves active listing for (productId, tab); enforces tab rules; serviceability; listing lifecycle |

M35 is **superseded and extended** by M36 — not deleted from documentation, but marked deprecated in favor of listing-centric logic.

---

## 5. API Impact Summary

| Category | Unchanged | Modified | New | Deprecated |
|----------|-----------|----------|-----|------------|
| Auth | All | 0 | 0 | 0 |
| Catalog (customer) | — | 6 | 4 | 2 |
| Seller products | — | 8 | 6 | 3 |
| Cart & orders | — | 7 | 2 | 0 |
| Admin catalog | — | 5 | 8 | 2 |
| Delivery | — | 4 | 3 | 0 |
| Search | — | 2 | 1 | 0 |
| CMS/Storefront | — | 4 | 0 | 0 |

See [04_API_Architecture.md](./04_API_Architecture.md) for full endpoint list.

---

## 6. Database Impact Summary

| Collection | Impact |
|------------|--------|
| `products` | **Modified** — remove tab-specific fields; retain master attributes |
| `marketplace_listings` | **New** — core CR-001 entity |
| `categories` | **Modified** — `commerceFlows[]` → `visibleTabs[]` |
| `carts` / cart items | **Modified** — add `listingId`, `marketplaceTab` |
| `orders` / `order_items` | **Modified** — listing snapshot, delivery promise |
| `coupons`, `flash_sale_products` | **Modified** — tab scope |
| `home_sections`, `banners` | **Modified** — tab scope + listing refs |
| `delivery_charge_rules` | **Modified** — tab-aware rules |
| `commerce_flows` | **Deprecated** — replaced by `marketplace_config` |

**New collection count:** +2 (`marketplace_listings`, `marketplace_config`)  
**Net collections after CR-001:** 64

---

## 7. Workflow Impact Summary

| Workflow | Impact Level | Key Change |
|----------|--------------|------------|
| Seller product creation | **Major** | Two-step: master product → per-tab listings |
| Customer browse/search | **Major** | All reads tab-scoped via listings |
| Customer cart/checkout | **Major** | Single-tab cart; listing prices |
| Admin category management | **Medium** | Visible tabs per category |
| Admin product moderation | **Major** | Moderate master + listing separately |
| Delivery assignment | **Major** | SLA differs by tab |
| Returns/refunds | **Minor** | Snapshot already on order item |
| Reports/analytics | **Major** | Tab dimension on all commerce metrics |

---

## 8. Frontend Impact (Reference Only — No Frontend Changes in CR-001)

| Screen | Backend Change Required |
|--------|------------------------|
| Seller add product | Tab selection + per-listing config UI |
| Seller product list | Show listings per tab |
| Customer product detail | Show tab-specific price + delivery promise |
| Customer category browse | Filter by active tab context |
| Admin categories | Visible tabs checkboxes |
| Admin moderation queue | Master + listing approval queues |
| Quick Shop / Groceries home | Fixed delivery promise badges from listing |

---

## 9. Implementation Status Consideration

Backend Phases 0–10 are **implemented** with the legacy `commerceFlows[]` model. CR-001 requires:

1. **Architecture documentation** (this CR) — before code changes
2. **Phase CR-1** — Schema + listing CRUD (no customer-facing switch)
3. **Phase CR-2** — Cart/order migration to listing model
4. **Phase CR-3** — Search, analytics, deprecation removal

Existing work is **preserved** via migration, not thrown away.

---

## 10. Decision Log

| Decision | Choice | Why |
|----------|--------|-----|
| Collection name | `marketplace_listings` | Clear domain language; avoids confusion with `product_variants` |
| Master product keeps stock | Yes | One physical SKU; listings control visibility/price, not duplicate inventory |
| Reviews on master product | Yes | Customer reviews the product, not the tab |
| Separate carts per tab | Yes | Cannot mix 15-min quick commerce with 2-day standard in one checkout |
| Enum rename `standard` → `mithilakart` | Alias during migration | Aligns with client branding |
| Mithilak seller gate | Admin-approved sellers only | Business rule for exclusive marketplace |

---

## 11. Approval Checklist

- [ ] Product Architecture — Master + Listing model approved
- [ ] Database Architecture — Schema and indexes approved
- [ ] API Architecture — Endpoint delta approved
- [ ] Business Rules — Validation matrix approved
- [ ] Migration Strategy — Zero-downtime path approved
- [ ] Implementation Roadmap — Phase CR-1/2/3 scheduled

**Next step:** Review sub-documents in this folder before any implementation begins.
