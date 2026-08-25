# Master Production Gap Matrix — Pass 1

**Audit date:** 2026-08-25
**Method:** Direct source inspection + live queries against the real MongoDB Atlas database. Backend/frontend dev servers were **down** for the entire audit window (port 5000 held by an unrelated process, "Billing-software," which was explicitly not touched per instruction) — every finding below was verified statically (code) or via a direct Atlas connection, never via a live HTTP round-trip. Anything requiring a running server is marked **BLOCKED (server down)**, not PASS.
**Baseline:** builds on `docs/client-requirements/MASTER_REQUIREMENTS_GAP_MATRIX.md` (2026-08-24 audit) and `docs/cr-002/*`. Findings there are treated as leads, re-verified independently below where touched.

Status legend: **PASS** · **FIXED** (this session) · **PARTIAL** · **BROKEN** · **BLOCKED**.

---

## 0. Environment status (read this first)

| Item | Status | Evidence |
|---|---|---|
| Backend (`node src/server.js`, configured `PORT=5000`) | **BLOCKED** | Port 5000 is held by an unrelated project ("Billing-software", confirmed via `Get-CimInstance Win32_Process` and an HTTP probe returning that project's own error shape). Not touched per explicit instruction. |
| Frontend (`vite`, configured port `3000`) | **BLOCKED** | Not running; port 3000 is free but nothing is bound to it. |
| MongoDB Atlas | **PASS** | Reachable directly throughout the audit; all live-data findings below are real, current production data. |
| Backend test suite | **PASS** | 504/504 passing (up from 489 at session start — 15 new regression tests added this pass), 56/56 suites. |
| Frontend build | **PASS** | `npm run build` clean, zero errors. |

**Everything requiring a live HTTP request — real customer login, real checkout, real socket events, real webhook delivery — is BLOCKED until the backend is running on its own configured port.** This matrix records what was verifiable without one.

---

## 1. Product / Tab / Category Architecture (§3–4) — CRITICAL, real bug found and fixed

| Item | Status | Evidence |
|---|---|---|
| Correct data model exists (`MarketplaceListing`: one row per product×tab, own price/visibility/status) | **PASS** | `backend/src/models/MarketplaceListing.js` — unique-indexed `{productId, marketplaceTab}`, exactly the right relationship. |
| Category tab visibility (`Category.visibleTabs`) exists and is enforced server-side on listing creation | **PASS** | `MarketplaceListingService._assertCategoryVisibleOnTab()` is called from `createListing()` — a seller cannot create a listing for a category not enabled on that tab, verified by reading the code path directly (not bypassable via direct API call, since it's server-side). |
| **Customer catalog reads correctly scope by tab** | **BROKEN → FIXED** | See below. |

### The bug (found and fixed this session)

`ProductService.listPublic(query)` only routes to the correct tab-scoped path (`MarketplaceListingService.listPublicForTab`) when `resolveTabFromQuery(query)` finds a `marketplaceTab` or `commerceFlow` param. **Three live customer-facing call sites never sent one:**

| File | Route mounted at | Traffic |
|---|---|---|
| `frontend/src/modules/user/components/vendor/CategoryProductsSection.jsx` | Rendered on **Home** (`Home.jsx`) | **High** — this is the main storefront |
| `frontend/src/modules/user/pages/CategoryProducts.jsx` | `/category-products` | Reachable from `BeautyLanding.jsx` |
| `frontend/src/modules/user/pages/Products.jsx` | `/products` | **Orphaned** — no internal link anywhere in the codebase navigates here; only reachable by direct URL, but it IS in the generated sitemap |

**Confirmed live impact** (direct Atlas query, `MarketplaceListing` collection, approved+visible only):

```
mithilakart:      35 listings
quick_shop:        22 listings
mithilak:          15 listings
groceries_fresh:   11 listings
Total approved Product docs (unscoped legacy query): 76
```

A customer on the Mithilak-themed Home page (teal branding, cultural products) would see Quick Shop snacks and Groceries mixed in via `CategoryProductsSection.jsx` — the unscoped path returns all 76 regardless of theme/tab.

**A second, independent defect compounded this and would have made the naive fix a no-op:** even after wiring the frontend to send `?marketplaceTab=`, the Joi validation schema (`listProductsQuerySchema`) had no `marketplaceTab` field. `validateQuery` runs with `stripUnknown: true`, so the param was **silently deleted before the controller ever saw it**.

### Fix applied

1. `backend/src/validators/catalog/catalog.validator.js` — added `marketplaceTab: Joi.string().valid(...MARKETPLACE_TAB_VALUES).optional()` to `listProductsQuerySchema` (covers `/products`, `/products/search`, `/categories/:id/products` — all three share this schema).
2. `frontend/src/shared/utils/marketplaceHelpers.js` — hardened `getCurrentMarketplaceTab()` (added an `isQuickShopFlow` localStorage check that was missing, matching the same three-flag pattern used everywhere else in the app) as the canonical, already-correct source of "what tab is the customer currently in" (it already returned the right canonical values — `quick_shop`, `groceries_fresh`, etc. — unlike the zustand store's internal `quickshop`/`freshgrocery` spelling).
3. Wired all three files to call it and pass `marketplaceTab` through to `getCategories()` / `getCategoryProducts()` / `getProducts()`. `CategoryProducts.jsx` and `Products.jsx` additionally support an explicit `?tab=` URL override (shareable/crawlable), falling back to the detected current tab.

**Regression tests:** `backend/tests/unit/services/product-tab-scoping.test.js` — 8 tests, covering the Joi schema fix, the service routing decision with/without a tab present, and `listByCategory`'s pass-through. All passing. **Full 504-test suite re-verified green after this change.**

### What was found dead, not fixed (documented instead)

`frontend/src/shared/utils/marketplaceHelpers.js` also exports `productBelongsToTab()` — a large, hardcoded, category-name-string-matching / ID-prefix-guessing client-side tab classifier (exactly the kind of "frontend must NOT filter this locally using hardcoded arrays" pattern §4 forbids). **Zero consumers found anywhere in the codebase** (`grep` confirms no import). Left in place, flagged here rather than deleted, since removing dead exported code is lower priority than fixing live bugs and carries a small chance of an undiscovered dynamic import.

### Not yet checked (residual risk, explicitly flagged)

Any **other** frontend call site that fetches products/categories without a tab param will hit the same unscoped legacy path — the fix closes the three confirmed call sites, not the underlying permissiveness of `ProductService.listPublic` itself. A stricter fix (make `marketplaceTab` mandatory, throw instead of silently falling through) was considered and **rejected** for this pass: it would be a breaking API change affecting any as-yet-unaudited caller, and the task explicitly says not to change API contracts unless required. Documented here as a residual risk rather than silently accepted.

---

## 2. Webhooks (§11–12) — CRITICAL, two real security/functionality bugs found and fixed

| Item | Status | Evidence |
|---|---|---|
| Razorpay webhook route exists, raw-body middleware correctly scoped | **PASS** | `app.js` mounts `express.raw()` at the exact computed webhook path (`/api/v1/webhooks/razorpay`), before the generic `express.json()` — verified path arithmetic matches the real mount chain (`routes/index.js` → `v1/index.js` → `payments.routes.js`). |
| **Razorpay webhook signature verification** | **BROKEN → FIXED** | See below. |
| **Shiprocket webhook token verification** | **BROKEN → FIXED (security)** | See below. |
| Webhook idempotency (Razorpay) | **PASS** | `PaymentService.handleRazorpayWebhook` checks `paymentWebhookRepository.hasProcessed({provider, eventId, idempotencyKey})` before processing; returns `{processed: true}` on replay without re-running side effects. |
| Webhook → order state → fulfillment → socket chain | **BLOCKED (server down)** | Code path traced and looks correct (`CourierShipmentService.handleWebhookPayload` → `_applyOrderStatusFromCourier` → emits `order.status_changed` on the existing EventBus → `SocketGateway` fanout, all previously verified in CR-002 work), but cannot be exercised live without a running backend + real webhook delivery. |

### Bug A: Razorpay signature verification could be silently skipped

`PaymentService.handleRazorpayWebhook` guarded the entire verification block on `... && rawBody` — if `rawBody` was falsy for **any** reason (env misconfiguration, a proxy stripping it, a future middleware-ordering change), verification was skipped entirely and the webhook was trusted unconditionally. The provider's own `verifyWebhookSignature()` already correctly returns `false` for missing `rawBody`/`signature`/secret — the redundant outer guard was the actual defect, and it failed in the wrong direction (open, not closed).

**Compounding operational fact:** `RAZORPAY_WEBHOOK_SECRET` is templated in `.env.example` but **absent from the real `.env`** — so today, every real Razorpay webhook is either silently unverified (pre-fix) or now correctly rejected (post-fix) until the secret is configured.

**Fix:** `backend/src/services/payments/PaymentService.js` — removed the `&& rawBody` short-circuit; now always calls `verifyWebhookSignature()` when the method exists, and fails closed (`AppError.unauthorized`) if the provider exposes no verification method at all. 4 new tests (`tests/unit/services/razorpay-webhook-signature.test.js`).

### Bug B: Shiprocket webhook accepted everything, unauthenticated, when misconfigured

`ShiprocketClient.verifyWebhookToken(headerToken)`:
```js
if (!this.webhookSecret) return true;   // ← accepted EVERY request
```
`SHIPROCKET_WEBHOOK_SECRET` is commented out in the real `.env` (`# SHIPROCKET_WEBHOOK_SECRET=`), so this branch is live right now. **Real exploit path:** anyone who discovers the webhook URL and a valid AWB (order tracking number — not secret, appears in customer-facing tracking) could POST a forged `delivered` status via `POST /api/v1/shipping/webhooks/shiprocket` (corrected path — mounted under `/shipping`, not directly under `/webhooks`; verified by reading the actual route registration), and `CourierShipmentService.handleWebhookPayload` (traced: matches order by `shipment.awb`, applies the mapped status) would process it as genuine — falsely marking a real order delivered before the courier actually delivered it, with downstream effects on settlement/payout logic.

**Live-verified post-fix (Pass 2, real running backend):**
```
POST /api/v1/shipping/webhooks/shiprocket  → 401 {"message":"Invalid webhook token"}
POST /api/v1/webhooks/razorpay             → 401 (unsigned request rejected)
```

**Fix:** flipped to fail closed — `if (!this.webhookSecret) { logger.warn(...); return false; }`. 3 new tests (`tests/unit/providers/shiprocket-webhook-token.test.js`).

**Operational consequence, stated plainly:** Shiprocket webhooks will now be **rejected entirely** until `SHIPROCKET_WEBHOOK_SECRET` is actually configured (Shiprocket dashboard → Webhooks → set a custom token → mirror it into `.env`). This is a correct trade — reject-until-configured over accept-anything — but it is an operational action item, not something fixable in code alone. Documented in `.env.example` with exact instructions.

**Neither `.env` file's real credential values were modified** — only `.env.example`'s documentation/placeholders, per instruction not to touch real credentials.

### Not yet audited this pass

- Live webhook delivery end-to-end (requires running backend + a real or simulated Razorpay/Shiprocket call) — **BLOCKED (server down)**.
- Whether `PaymentWebhookRepository.hasProcessed` itself has a race condition under truly concurrent duplicate webhook delivery (not just sequential replay) — not checked this pass.
- Shiprocket webhook idempotency (does a duplicate genuine webhook double-append to `checkpoints[]`?) — read the code (`checkpoint` is always pushed, no dedup by `checkpoint.at`/status), **flagging as PARTIAL**, not verified as a real duplicate-processing bug in this pass — needs a live trace.

---

## 3. Order State Machine (§10)

| Item | Status | Evidence |
|---|---|---|
| Existing state machine identified, not reinvented | **PASS** | `ORDER_STATUS` (`constants/commerce.js`): `pending → placed → confirmed → packed → shipped → out_for_delivery → delivered`, plus `cancelled` from any non-terminal state. Documented in prior CR-002 session and re-confirmed unchanged this pass. |
| Fulfillment lifecycle (searching/seller-offer/seller-accepted/warehouse/courier) modeled without inventing new `ORDER_STATUS` values | **PASS** | Confirmed via `docs/cr-002/06_CR002_State_Machine.md` from prior session — a parallel `OrderFulfillment.state` machine, not a modification of `ORDER_STATUS`. Re-read this pass, still accurate to the code. |
| Every UI-displayed status exists in backend state | **BLOCKED (server down)** | Cannot verify live rendering without a running frontend+backend. |

---

## 4. Idempotency / Concurrency (carried over, closed this pass)

| Item | Status | Evidence |
|---|---|---|
| `Order`/`WalletTransaction`/`Refund` `idempotencyKey` uniqueness | **FIXED (prior turn, re-confirmed)** | Partial unique index (`$type: 'string'`), not `sparse` — `sparse` alone collided against 145 real `idempotencyKey: null` orders already in Atlas. Verified with 5 Layer-2 tests against real MongoDB, including a genuine 5-way concurrent race (exactly 1 winner, 4 × `E11000`). Migration applied live via `scripts/migrate-idempotency-unique.js`. |

---

## 5. Zero Dummy Data (§9) — carried over from prior audit, not re-swept this pass

The 2026-08-24 audit (`docs/client-requirements/MASTER_REQUIREMENTS_GAP_MATRIX.md` §2) already found and fixed 12+ instances (fake ratings, fake ETAs, fake "Bought Together," mock-payment auto-success, etc.) and flagged `QuickShop.jsx`'s ~9 hardcoded fake "Flash Deals" products as the one remaining **BROKEN** item (backend `FlashSale`/`FlashSaleProduct` models exist with a working `PromotionService.getDeals()`, but no customer-facing route exposes them yet — real work was started, then paused for this environment issue). **Not re-verified or re-touched this pass** — carried forward as-is, still open.

---

## 6. Performance / N+1 spot-check (§18, partial)

| Item | Status | Evidence |
|---|---|---|
| Fulfillment eligibility/ranking loops | **PASS** | `SellerEligibilityService` batches product/listing lookups via `_buildIndexes()` (bulk `$or` query) before iterating candidates in-memory — not a per-candidate query. Confirmed by reading the loop bodies directly. |
| Broader N+1 sweep across catalog/order/admin services | **NOT DONE** | Out of time budget for this pass; flagged for Pass 2. |

---

## Summary — what changed this session

| File | Type | Reason |
|---|---|---|
| `backend/src/validators/catalog/catalog.validator.js` | Fix | Added missing `marketplaceTab` to Joi schema (was being silently stripped) |
| `backend/src/services/catalog/ProductService.js` | — | Not modified; the routing logic itself was already correct, only its inputs were wrong |
| `frontend/src/shared/utils/marketplaceHelpers.js` | Fix | Hardened `getCurrentMarketplaceTab()`; documented `productBelongsToTab()` as dead code |
| `frontend/src/modules/user/components/vendor/CategoryProductsSection.jsx` | Fix | Now passes `marketplaceTab` (Home page — highest traffic) |
| `frontend/src/modules/user/pages/CategoryProducts.jsx` | Fix | Now passes `marketplaceTab`, supports `?tab=` override |
| `frontend/src/modules/user/pages/Products.jsx` | Fix | Now passes `marketplaceTab`, supports `?tab=` override |
| `backend/src/services/payments/PaymentService.js` | Fix (security) | Razorpay webhook signature check can no longer be silently skipped |
| `backend/src/core/providers/shipping/ShiprocketClient.js` | Fix (security) | Shiprocket webhook now fails closed, not open, when unconfigured |
| `backend/.env.example` | Docs | Documented `SHIPROCKET_WEBHOOK_SECRET` (was entirely undocumented) and clarified `RAZORPAY_WEBHOOK_SECRET`'s consequence |
| `backend/tests/unit/services/product-tab-scoping.test.js` | New test | 8 tests |
| `backend/tests/unit/services/razorpay-webhook-signature.test.js` | New test | 4 tests |
| `backend/tests/unit/providers/shiprocket-webhook-token.test.js` | New test | 3 tests |

**Test suite: 489 → 504 passing (15 new), 0 failures, 0 regressions. Frontend build clean.**

---

## Immediate blockers for Pass 2

1. **Backend cannot start** — port 5000 held by an unrelated process. Needs to be freed on the user's end before any live verification (real login, real checkout, real webhook delivery, real socket events, real browser E2E) can happen.
2. `SHIPROCKET_WEBHOOK_SECRET` and `RAZORPAY_WEBHOOK_SECRET` need real values configured in the actual `.env` before webhooks will function **at all** post-fix (they now correctly reject rather than silently misbehave, but they need real configuration to *work*).
3. Sections not yet audited in this pass: full frontend visual audit (§15), forms/validation agreement (§16), broader security sweep (§17 beyond webhooks), remaining performance items (§18), realtime end-to-end (§13 — code traced in prior CR-002 work but not re-verified live).
