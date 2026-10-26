# Final Remaining Gap Matrix — Phase 1 Audit

**Audit Date:** 2026-09-09  
**Platform:** Mithilakart Quick-Commerce & Standard Marketplace  
**Baseline Verified:**
- 61/61 backend test suites PASS (534/534 tests PASS)
- Quick-Commerce E2E PASS
- Frontend production build PASS (`npm run build` clean)
- Core Quick-Commerce flow, cascading ladder, live GPS tracking, COD dues ledger, and mutual cancellation are protected and verified.

---

## Gap Matrix Summary by Requirement Area

| Section | Requirement Area | Status | Evidence / Finding | Remediation Action |
|---|---|:---:|---|---|
| **§1** | Four Marketplace Tabs Certification | **UNVERIFIED** | Tab isolation and category visibility rules exist in `MarketplaceListingService` and `ProductService`, but need unified automated certification verifying zero cross-tab leakage across all 4 tabs (`mithilakart`, `mithilak`, `quick_shop`, `groceries_fresh`). | Implement automated certification test suite verifying DB scoping, category visibility, and delivery mode scoping. |
| **§2** | Standard E-Commerce Real Flow | **UNVERIFIED** | Quick-Commerce flow was extensively verified, but Standard E-Commerce (standard catalog -> cart -> checkout -> seller pack -> courier shipment -> tracking) needs isolated certification ensuring Quick Commerce logic does not interfere. | Create dedicated integration test verifying the end-to-end standard flow with courier dispatch and tracking. |
| **§3** | Complete-Cart Multi-Product Seller Selection | **UNVERIFIED** | `SellerEligibilityService.checkCompleteCart` and `FulfillmentReservationService.reserveCompleteCart` implement all-or-nothing logic, but require certification with multi-line cart (A, B, C) where Seller 1 has partial inventory and is rejected. | Add unit & integration tests verifying multi-item atomic reservation, partial stock rejection, and single-source fulfillment. |
| **§4** | Price + Distance Seller Ranking | **PARTIAL** | `SellerRankingService` scores distance, route ETA, preparation time, workload, and availability headroom, but **price is not included** as a weighted scoring factor in `DEFAULT_SELLER_RANKING_WEIGHTS` or `score()`. | Add `price` factor to `DEFAULT_SELLER_RANKING_WEIGHTS`, implement price scoring in `SellerRankingService.score()`, and verify A/B behavior switch with admin configurable weights. |
| **§5** | Warehouse → Courier Final Flow | **UNVERIFIED** | Fallback ladder logic exists in `FulfillmentEngineService`, but the transition from local sellers (1-4 ❌) -> warehouse (❌) -> Shiprocket standard downgrade requires certified end-to-end test verification. | Certify Flow D in regression test suite. |
| **§6** | Webhook Reconciliation & Idempotency | **PARTIAL** | `handleWebhookPayload` guards status transitions, but `shipment.checkpoints[]` appends duplicates on replayed webhooks. Delayed webhook reconciliation/polling is not exposed as a scheduled/manual service. | Add checkpoint deduplication in `handleWebhookPayload` and implement `reconcilePendingShipments()` in `CourierShipmentService`. |
| **§7** | Admin 100% Dynamic Behavior | **PASS / UNVERIFIED** | Admin platform settings API and persistence exist, but dynamic runtime propagation to ranking weights and category visibility needs end-to-end verification. | Test dynamic updates from Admin API through MongoDB to fulfillment engine. |
| **§8** | All Admin Managed Content | **PARTIAL** | `Home.jsx` imports `mapHomeBanners`, but ignores `homeBanners` from `useVendorStore` and hardcodes `const homeBannerList = fallbackBanners`. | Wire `mapHomeBanners(homeBanners, fallbackBanners)` in `Home.jsx` so admin-managed banners render dynamically. |
| **§9** | UI Functional Certification | **PASS** | Frontend production build completes cleanly (`dist/` generated with 0 errors). All routes mapped. | Re-verify frontend build after all adjustments. |
| **§10** | Visual UI Certification | **PASS** | Product cards, responsive layout, and styles adhere strictly to client-approved UI. | Preserve layout, typography, and card design without alterations. |
| **§11** | Error / Failure UX | **PASS** | `errorHandler.js` returns clean, user-safe error messages with unique request IDs; internal stack traces, credentials, and DB errors are never exposed. | Verified. |
| **§12** | Security Final Pass | **PASS** | Strict JWT authentication across 4 portals, RBAC middleware, partial unique indexes on `idempotencyKey`, fail-closed webhook token verification, and server-side authoritative pricing/ETA. | Verified. |
| **§13** | SEO Final Pass | **PARTIAL** | `frontend/index.html` lacks canonical tag, meta description, Open Graph tags, and Schema.org structured data. | Add comprehensive meta tags, canonical link, Open Graph tags, and JSON-LD schema markup to `frontend/index.html`. |
| **§14** | Mobile + PWA | **PASS** | `vite-plugin-pwa` is configured with autoUpdate, Web App Manifest, icons, and service worker registration. | Verified in `vite.config.js` and build output. |
| **§15** | Performance / Scale | **PASS** | Compound indexes on `orders`, `products`, `sellers`, and `marketplace_listings`. Fulfillment candidate queries batch indexes via `_buildIndexes()` without N+1 loops. | Verified. |
| **§16** | Final Regression | **PASS** | 534/534 tests passing across 61 test suites. Baseline will be maintained and expanded. | Maintain 100% pass rate. |
| **§17** | Full Business Flow Matrix (Flows A–P) | **PARTIAL** | Flows A-D tested in `test-complete-business-flow.js`. Flows E-P require structured automated test suite coverage. | Implement automated test covering all flows in `tests/integration/business-flows-matrix.test.js`. |
| **§18** | Production Certification | **PENDING** | To be compiled into `FINAL_PRODUCTION_CERTIFICATION.md` upon completion of implementation and verification. | Generate comprehensive certification report with real evidence. |

---

## Detailed Gap Findings & Implementation Plan

### Gap 1: Price Factor in Seller Ranking (§4)
- **Problem**: `SellerRankingService` only ranks candidates by distance, ETA, prep time, workload, and availability. Price variance between sellers is not considered.
- **Solution**:
  1. In `backend/src/constants/platformSettings.js`, define `price: 0.15` in `DEFAULT_SELLER_RANKING_WEIGHTS` (or configurable).
  2. In `backend/src/services/fulfillment/SellerRankingService.js`, compute each candidate's cart total price from `resolvedItems`. Score `price` using inverse normalization (cheaper seller gets higher score).
  3. Support dynamic admin weight overrides: if admin sets `price: 0.8` and `distance: 0.1`, the cheaper seller wins even if farther away. If admin sets `price: 0.1` and `distance: 0.8`, the nearer seller wins.

### Gap 2: Complete-Cart Multi-Product Verification (§3)
- **Problem**: Multi-product cart where a candidate has some items but lacks one item must be rejected completely without split orders.
- **Solution**: Write automated integration tests with 3 products (A, B, C) where Seller 1 has A and B (stock 10) but C (stock 0), and Seller 2 has all three. Prove Seller 1 is completely rejected, Seller 2 is chosen, and reservations are atomic.

### Gap 3: Webhook Idempotency & Replay Deduplication (§6)
- **Problem**: `handleWebhookPayload` appends to `checkpoints[]` without deduplication if the exact same webhook payload is delivered multiple times.
- **Solution**:
  1. In `CourierShipmentService.js`, check if a checkpoint with identical `status` and `at` timestamp already exists before appending.
  2. Implement `reconcilePendingShipments()` to poll/sync tracking for any orders stuck in transit, recovering missed webhooks.

### Gap 4: Admin Managed Content in Home Storefront (§8)
- **Problem**: `Home.jsx` hardcodes `fallbackBanners` ignoring `homeBanners` from `useVendorStore`.
- **Solution**: Wire `mapHomeBanners(homeBanners, fallbackBanners)` so admin banners are rendered dynamically.

### Gap 5: SEO Meta & Structured Data (§13)
- **Problem**: `frontend/index.html` lacks metadata, canonical URL, Open Graph tags, and Schema.org markup.
- **Solution**: Update `frontend/index.html` with production-grade SEO tags, canonical URL, theme color, Open Graph, Twitter cards, and JSON-LD structured data.

### Gap 6: Comprehensive Business Flow Matrix Test Suite (§17)
- **Problem**: Automated tests must certify Flows A through P under controlled conditions.
- **Solution**: Create `backend/tests/integration/business-flows-matrix.test.js` exercising Flows A through P with zero mocks of business logic.
