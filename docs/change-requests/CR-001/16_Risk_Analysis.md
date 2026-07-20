# CR-001 — Risk Analysis

**Change Request:** CR-001  
**Date:** 2026-07-20  

---

## 1. Risk Matrix

| ID | Risk | Likelihood | Impact | Severity | Mitigation |
|----|------|------------|--------|----------|------------|
| R01 | Breaking existing customer checkout during cutover | Medium | High | **High** | Dual-read period; feature flag per tab |
| R02 | Migration creates incorrect listing prices | Low | High | **High** | Validation queries; staging dry-run |
| R03 | Quick commerce listings migrated with wrong default promise | Medium | Medium | **Medium** | Flag for seller review; admin queue |
| R04 | Cart tab mismatch confuses customers | Medium | Medium | **Medium** | Clear UX messaging; API 409 with helpful message |
| R05 | Search index lag after listing model | Medium | Medium | **Medium** | Event-driven reindex; cache warming |
| R06 | Seller confusion with two-step product flow | High | Medium | **Medium** | Seller portal UX guide; wizard flow |
| R07 | Performance regression on listing joins | Medium | Medium | **Medium** | Compound indexes; Redis cache per listing |
| R08 | Frontend not ready for listing APIs | High | High | **High** | CR-2 blocked on frontend readiness; API versioning |
| R09 | Historical orders lack listing snapshots | Certain | Low | **Low** | Best-effort backfill; display gracefully |
| R10 | Mithilak eligibility not set for existing sellers | Medium | Low | **Low** | Default false; admin bulk grant |
| R11 | Dual moderation slows product go-live | Medium | Medium | **Medium** | Parallel queues; SLA targets for moderation |
| R12 | SLA breach on quick commerce damages trust | Medium | High | **High** | Serviceability gate; ops escalation; grace period |
| R13 | Rollback complexity after CR-3 | Low | High | **Medium** | Archive listings; maintain rollback script until stable |
| R14 | Test coverage gaps on tab matrix | Medium | Medium | **Medium** | 80-case validator matrix; per-tab E2E |
| R15 | Commission/report discrepancies during dual-write | Low | Medium | **Low** | Single source: listing price at order time |

---

## 2. Technical Risks

### R01 — Checkout Breakage

**Scenario:** Customer cart has productId references; CR-2 switches to listingId.

**Mitigation:**
- Cart migration script before code deploy
- Dual-read: if listingId missing, resolve from productId + tab
- Canary deploy: enable listing cart for `quick_shop` first, then others

### R07 — Query Performance

**Scenario:** Product list requires join with listings per tab.

**Mitigation:**
- Primary query on `marketplace_listings` filtered by tab (not product join)
- Denormalize title/image on listing for list views (optional)
- Cache: `cache:products:tab:{tab}:cat:{catId}:p:{page}`

### R05 — Search Index

**Scenario:** Reindex 10K+ listings causes search downtime.

**Mitigation:**
- Blue/green index rebuild
- Incremental sync via `listing.approved` events
- Fallback to product text search during rebuild (degraded mode)

---

## 3. Business Risks

### R06 — Seller Adoption

**Scenario:** Sellers don't configure per-tab listings; products invisible on quick commerce.

**Mitigation:**
- Migration auto-creates listings from existing commerceFlows
- Seller dashboard shows "Action required: confirm delivery promise"
- Email notification post-migration

### R12 — SLA Breach

**Scenario:** 20-min promise not met; customer complaints.

**Mitigation:**
- Serviceability gate prevents over-promising
- Ops dashboard for SLA compliance
- Grace period (5 min) before breach flag
- Start with 30-min promise default; sellers opt into faster

---

## 4. Project Risks

### R08 — Frontend Dependency

**Scenario:** Backend ready but frontend still uses productId cart.

**Mitigation:**
- CR-2 go-live coordinated with frontend sprint
- API backward compatibility during transition
- Contract tests against OpenAPI spec

### R11 — Moderation Backlog

**Scenario:** Doubled moderation (master + listing) overwhelms admin team.

**Mitigation:**
- Auto-approve listing if master approved + price unchanged + standard tab
- Bulk approve tool
- Moderation SLA: 24h for listing queue

---

## 5. Data Risks

### R02 — Migration Data Integrity

**Mitigation:**
- Idempotent migration scripts
- Pre/post count validation
- Staging full clone test
- Manual spot-check 50 products across all tabs

### R09 — Historical Orders

**Mitigation:**
- Best-effort snapshot backfill
- Order display falls back to product fields for pre-CR orders
- No financial recalculation on historical data

---

## 6. Security Risks

| Risk | Mitigation |
|------|------------|
| Cross-seller listing access | sellerId on listing + repository scope |
| Price manipulation via listingId | Server-side price from listing, never client |
| Unauthorized tab listing creation | Seller eligibility check |
| Admin permission bypass | New permissions in RBAC matrix tests |

---

## 7. Rollback Triggers

| Trigger | Action |
|---------|--------|
| Error rate > 2% on checkout post CR-2 | Rollback CR-2 deploy |
| Migration validation fails | Stop migration; do not deploy CR-2 |
| SLA breach rate > 20% on quick tab | Pause quick tab orders; investigate |
| Search completely broken > 30 min | Revert to product search index |

---

## 8. Risk Acceptance

| Risk | Accepted By | Condition |
|------|-------------|-----------|
| R09 Historical order snapshots | Product Owner | Display-only impact |
| R10 Mithilak sellers need manual grant | Product Owner | Exclusive marketplace by design |
| R03 Default 30-min promise on migration | Product Owner | Sellers must confirm |

---

## 9. Pre-Implementation Checklist

- [ ] CR-001 architecture docs reviewed and approved
- [ ] Staging environment available for migration dry-run
- [ ] Frontend team aligned on CR-2 timeline
- [ ] Seller communication drafted
- [ ] Rollback script tested
- [ ] New RBAC permissions seeded on staging
- [ ] k6 baseline recorded for tab-scoped endpoints

---

## 10. Post-Implementation Monitoring

| Metric | Alert Threshold |
|--------|----------------|
| CART_TAB_MISMATCH rate | > 5% of cart adds |
| Listing-not-found on checkout | > 0.1% |
| Quick commerce SLA breach | > 15% of quick orders |
| Listing moderation queue age | > 48h p95 |
| Search p95 with tab filter | > 300ms |
