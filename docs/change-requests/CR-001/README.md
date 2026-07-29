# CR-001 — Marketplace Listing Architecture

**Change Request ID:** CR-001  
**Title:** Multi-Marketplace Listing Model (Master Product + Marketplace Listings)  
**Status:** Approved — Architecture Integration Pending  
**Date:** 2026-07-20  
**Applies To:** Backend Master Plan v1.0  

---

## Summary

CR-001 introduces a **Master Product + Marketplace Listing** model. Delivery commitment, per-tab pricing, visibility, and quick-commerce promises move from the Product entity to **Marketplace Listing**. The existing four shopping experiences are preserved; the architecture is **extended**, not replaced.

---

## Document Index

| # | Document | Purpose |
|---|----------|---------|
| 01 | [Business Impact Report](./01_Business_Impact_Report.md) | Module-by-module impact classification |
| 02 | [Architecture Update](./02_Architecture_Update.md) | High-level architecture delta |
| 03 | [Database Architecture](./03_Database_Architecture.md) | Collections, schemas, indexes, ER |
| 04 | [API Architecture](./04_API_Architecture.md) | Endpoint changes, additions, deprecations |
| 05 | [Business Rules](./05_Business_Rules.md) | Validations, restrictions, approval rules |
| 06 | [Seller Workflow](./06_Seller_Workflow.md) | Master product → listing → publish flow |
| 07 | [Customer Workflow](./07_Customer_Workflow.md) | Browse, search, cart, checkout changes |
| 08 | [Admin Workflow](./08_Admin_Workflow.md) | Category, listing approval, delivery rules |
| 09 | [Delivery Workflow](./09_Delivery_Workflow.md) | Standard vs quick-commerce delivery |
| 10 | [Category Architecture](./10_Category_Architecture.md) | Tab visibility for categories/subcategories |
| 11 | [Marketplace Architecture](./11_Marketplace_Architecture.md) | Four marketplaces, listing model, boundaries |
| 12 | [Module Dependency Graph](./12_Module_Dependency_Graph.md) | Updated dependency graph |
| 13 | [Implementation Roadmap](./13_Implementation_Roadmap.md) | Phase impact, sequencing, dependencies |
| 14 | [Testing Strategy](./14_Testing_Strategy.md) | New test suites and regression scope |
| 15 | [Migration Strategy](./15_Migration_Strategy.md) | Data migration from commerceFlows model |
| 16 | [Risk Analysis](./16_Risk_Analysis.md) | Risks, mitigations, rollback |

---

## Core Business Rule (Non-Negotiable)

> **Delivery commitment MUST NOT belong to Product.**  
> Delivery commitment belongs to **Marketplace Listing**.

One master product (e.g. Aashirvaad Atta) may appear in Mithilakart (2-day delivery), Quick Shop (20 min), and Groceries & Fresh (15 min) via **separate listings** — without duplicating master product data.

---

## Marketplace Tabs (Canonical Enum)

| Tab Key | Display Name | Delivery Model |
|---------|--------------|----------------|
| `mithilakart` | Mithilakart (General Marketplace) | Standard — location-based ETA |
| `mithilak` | Mithilak (Exclusive Marketplace) | Standard — admin + approved sellers only |
| `quick_shop` | Quick Shop | Fixed promise — 15/20/25/30 minutes |
| `groceries_fresh` | Groceries & Fresh | Fixed promise — 15/20/25/30 minutes |

**Migration alias:** Existing `standard` commerce flow maps to `mithilakart`.

---

## Integration Principle

| Preserve | Extend |
|----------|--------|
| Clean architecture layers | New `marketplace_listings` collection |
| Auth, RBAC, payments, wallet | Listing-aware cart and orders |
| Seller data isolation | Seller listing CRUD per tab |
| Phase 0–10 foundation work | Category `visibleTabs[]` |
| Portal route namespaces | Delivery promise on listing + order snapshot |

**Do NOT:** Redesign auth, payments, admin RBAC, or delivery partner OTP flows from scratch.

---

## Supersedes / Amends

CR-001 **amends** (does not replace) these master plan sections:

- `00_Executive_Summary.md` — Commerce Flows section
- `02_Module_Definitions.md` — M09, M11, M12, M15, M20, M24, M33, M35
- `03_Database_Master_Plan.md` — `products` schema, new collection
- `04_API_Master_Plan.md` — Catalog, cart, order, seller product APIs
- `01_Implementation_Phases.md` — Phase 2, 3, 4, 5 sequencing

Implementation code **must not change** until CR-001 architecture docs are reviewed and phased rollout is approved.
