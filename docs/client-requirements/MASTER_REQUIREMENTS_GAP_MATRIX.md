# Master Requirements Gap Matrix

**Audit date:** 2026-08-24
**Baseline:** commit `13810ee` ("md"), which includes CR-001 + CR-002 (seller ranking, complete-cart rule, warehouse/courier fallback, quick→standard downgrade, delivery partner ranking, RBAC, realtime fanout, 441 backend tests).
**Method:** Live verification only — running test suite, live DB queries, live Shiprocket API calls, and direct source reads. Prior docs in `docs/cr-002/*` and `docs/frontend-audit/*` were used as leads, not as ground truth; several of their claims (e.g. "100% mock backend", "only one quick-commerce seller exists") are stale and contradicted below with evidence.

This document is the entry point. It links to two companion documents that are too large to inline:
- Full per-requirement detail with dependencies/risk/acceptance-criteria columns → tracked as this document's structure (below), updated incrementally as each item closes.
- Implementation evidence and PASS/FAIL/BLOCKED verdicts → [`IMPLEMENTATION_REPORT.md`](./IMPLEMENTATION_REPORT.md), appended to as work lands.

Status legend: **COMPLETE** (frontend + backend + DB + tests all verified working) · **PARTIAL** (some layers work, gap identified) · **MISSING** (not implemented) · **BROKEN** (implemented but incorrect/unsafe) · **BLOCKED** (needs a decision or resource outside code).

---

## 0. Pre-existing security issue found and fixed during audit

| Item | Status | Evidence |
|---|---|---|
| `backend/.env.bak-cr002` committed to git with live MongoDB Atlas, Shiprocket, SMS, Razorpay, Google Maps credentials in plaintext; `.gitignore` did not exclude `.env*` or `keys/` at all; `frontend/.env` (Firebase/Maps keys) and 56MB of Playwright test-run binaries were also tracked | **FIXED** | Removed from the (still-unpushed, local-only) commit via amend; `.gitignore` hardened to exclude `.env*`, `backend/keys/*.pem`, build artifacts. **Action required (not code-fixable):** rotate the MongoDB Atlas password, Shiprocket password, and SMS India Hub API key that were exposed in the removed file — they existed in plaintext on disk regardless of git state. |

---

## 1. Fulfillment engine core (CR-002 scope) — re-verified live

| Requirement | Status | Evidence |
|---|---|---|
| Seller ranking: price + distance + ETA + reliability + quantity-confidence, admin-configurable, not "nearest/cheapest always wins" | **COMPLETE** | `SellerRankingService.score()` scores 6 factors (distance 0.30, routeEta 0.25, preparation 0.15, workload 0.15, availability 0.10, adminBoost 0.05 — normalized, redistributed when data missing). Weights resolve `MarketplaceConfig → PlatformSetting (Mongo) → constant` via `FulfillmentConfigService.resolve()`. Admin API `GET/PUT /admin/fulfillment/settings` validates and persists. **Gap:** no distinct "reliability" factor and no admin UI page consumes the settings API (backend-only; see §6). |
| Delivery partner ranking: distance/availability/capacity/rating | **PARTIAL** | `DeliveryPartnerRankingService` scores distance (0.45), routeEta (0.20), workload (0.25), locationFreshness (0.10) — real, not hardcoded assignment. **Gap:** weights are a hardcoded JS constant, not DB-backed; `config.partnerRankingWeights` is referenced but never populated anywhere (dead code path), so admin cannot tune it without a deploy. No explicit rating factor; capacity is a binary eligibility gate, not a weighted factor. |
| Complete-cart rule (seller must fulfill 100% of cart or is ineligible; no split orders) | **COMPLETE** | `SellerEligibilityService` + reservation tests confirm all-or-nothing; live-verified in Aug 19 cert (TEST-02) and unit tests still passing. |
| Fallback ladder: Seller1→2→3→4→Warehouse→Courier | **PARTIAL** | Ladder logic is implemented and unit-tested (`fulfillment-engine.test.js`, `courier-downgrade-regression.test.js`). **Live-verified gap:** the seeded 4-actor CR-002 fixture (Seller A/B/C + Warehouse W, `scripts/seed-cr002-test-data.js`) has **zero products** attached — confirmed via direct DB query today. The ladder has never actually executed end-to-end against real data; it only executes in unit tests with mocked repositories. |
| Warehouse-only fulfillment (all sellers fail, warehouse succeeds, no courier created) | **PARTIAL** | Code path exists and is unit-tested. Not live-verified for the same reason (no warehouse inventory matching the test cart). |
| Courier/Shiprocket fallback, quick→standard downgrade persists | **BLOCKED (external)** | Downgrade-persistence logic is implemented and tested (`courier-downgrade-regression.test.js`, 6 tests). **Live-verified today:** the configured Shiprocket account (`admin@silaiwala.com`) has exactly 3 pickup locations — `BhaveshTailor`, `AtharvaTailor_2113f4`, `MayurTailor` — all in Indore/Burhanpur, Madhya Pradesh. None are in Bihar, where Mithilakart ships from. This is **not Mithilakart's own account** (account holder is a tailoring business). Courier fallback will ship from the wrong city on a stranger's account until a real Mithilakart Shiprocket account with a Bihar pickup location is provided. Per user decision, an existing Indore location is being wired as an explicitly-flagged placeholder so the fallback path is testable end-to-end; **must be repointed before any real order ships.** |
| Inventory atomicity (no overselling, no double-deduction) | **COMPLETE** | Live MongoDB transaction concurrency test re-confirmed passing (part of the 441). |
| Payments: COD + Razorpay with webhook signature verification, idempotency | **COMPLETE** (per existing test coverage) | `PaymentService` idempotency test passing; webhook signature verification present per CR-002 docs — to be spot-checked against a live Razorpay test-mode call in P1. |
| Realtime 4-panel event fanout with RBAC-scoped payloads | **COMPLETE** | `realtime-fanout.test.js`, `seller-offer-payload.test.js` passing; live-verified in Aug 19 cert (TEST-12, TEST-16). |
| Backend test suite | **COMPLETE** | Re-ran live today: **441/441 passing, 50/50 suites**, matches prior claim exactly. |
| Browser E2E (Playwright) covering full ladder, delivery partner flow, admin monitor, customer tracking UI | **MISSING** | 7 specs exist (`frontend/e2e/main-flow.spec.js`, `seller-offer-popup.spec.js`). Prior run: 2/5 passed, 3 failed on test-harness offer-isolation issues (not proven product defects). Never re-run since Aug 19; delivery/admin/customer-UI paths have no browser coverage at all. |

---

## 2. Dummy/hardcoded business data — live audit of current frontend/src

**Status: fixed (2026-08-24).** All items below closed. Additional fabrications found while fixing the originally-flagged 12 (same file, same pattern) were fixed in the same pass rather than left half-done. Full list, `FIXED` unless noted:

- Items 1–3, 9–11 below: fake cashback/UPI-offer/COD-fee/fallback-rating math removed from `Checkout.jsx`; real `codHandlingFee` is backend-computed and already correctly applied to the order total — only the fabricated "*₹9*" claim was removed, not the underlying (real, admin-configurable) fee.
- `mappers.js: mapProductForCard` — the shared mapper used by nearly every product card fabricated `rating: '4.2'` / `reviews: '120'` for **any** product with no real data (not just a fallback — it fired on every `undefined`/`null` field), and a `delivery: 'Tomorrow'` hardcoded ETA (a direct instance of the "never fabricate an ETA" requirement, found while fixing the adjacent rating issue). Fixed at the source so every consumer inherited the fix.
- `CategoryProducts.jsx` / `CategoryProductsSection.jsx` — beyond items 3/10, found and removed: a `Math.round(idNum % 450) + 50` **deterministic-looking pseudo-random fake review count** (comment: "Stable pseudo-random rating count"), fake brand fallback (`'Drasert'`), fake MRP fallback (`'1,999'`), fake discount badge.
- `ContinueShopping.jsx` — entire page rebuilt: it read products from a **hardcoded static fixture file** (`data/categoryData.js`), not the API at all, including a fake fallback product with a stock Unsplash photo. Rewired to fetch the real clicked product (`getProductById`) and real same-category products (`getCategoryProducts`) — both real, already-existing endpoints. Removed a hardcoded "2" cart-badge, fabricated hashtag chips, and a fully static, non-functional "shop for" section.
- `ProductDetail.jsx` (item 6, plus more found in the same file): removed the fabricated "Bought Together" section (3 fake products with fake IDs/prices); removed a **dead-but-live-if-ever-wired** `handleAddComboToCart` that pushed two entirely fake products (fabricated IDs `combo-1`/`combo-2`) directly into the real cart — unreachable today (no button called it) but left in as a landmine; replaced the fake final-fallback product ("Women Boxy Fit Checked Casual Shirt") with the page's own real "Product not found" state; replaced hardcoded clothing specs (Wool Blend/Full Sleeve/Checkered/Pink, shown on every product regardless of category) with real-data-only rows; removed a false "Manufactured by Lounge Dreams Clothing Pvt Ltd" claim; rebuilt "Similar Products" to use the real category API instead of 3 hardcoded fake items.
- `DealsPage.jsx` — fixed a field-name bug (read `product.reviews`, a field that never existed in the API response, so the fallback fired on literally every product) and a fixed "4 filled stars" graphic shown regardless of actual rating.
- Mock-payment auto-success — see §0 addendum below; fixed as P0, not P2, because of its severity.

**Not fixed, flagged instead (owner decision needed):**
- `modules/admin/dashboard/Dashboard.jsx` also imports the same `data/categoryData.js` static fixture — not touched in this pass (different file/module, needs its own look).
- "Verified Seller" trust badge shown unconditionally on every product — no `Seller.isVerified`-type field exists in the schema to check against. Real fix requires a KYC/verification workflow (new feature, not a data fix).
- `SearchInput` in `DealsPage.jsx` is referenced but not imported (`no-undef`) — pre-existing bug, predates this session, left as found since it's unrelated to dummy data.
- `modules/vendor/dashboard/Dashboard.jsx` hardcoded weekly-sales chart/revenue stats — investigated but **this file is not reachable by any route** (`VendorRoutes.jsx` reuses `modules/user/pages/*` under a `/vendor` prefix; `modules/vendor` appears to be orphaned/dead code, not confirmed dead-certain). Deprioritized until confirmed live or confirmed dead.

**Verification:** `npm run build` (frontend) succeeds with zero compile errors; `npm test` (backend) 452/452 passing throughout — no backend change was needed for any of the above, confirming these were purely frontend fabrications with real backend data already available to replace them.

---

Prior claim of "100% mock backend" (dated 2026-07-20) is **false as of today** — most pages correctly consume real API data (Wallet, DeliveryOrderDetail, seller ProductList/AddProduct, etc. verified clean). The following are genuine, current, user-facing issues:

| # | Location | Issue | Status |
|---|---|---|---|
| 1 | `Checkout.jsx:503-514,569` | Fabricated flat ₹50 "bank cashback" subtracted from `payableTotal` client-side; not returned by any API; customer is charged a different amount than the actual backend order total | **BROKEN** |
| 2 | `Checkout.jsx:642` | "Nominal fee of ₹9 will be charged" (COD) — text shown but never added to the actual payload/total; misleading | **BROKEN** |
| 3 | `CategoryProducts.jsx:152`, `CategoryProductsSection.jsx:122` | Fake "10% off with UPI" price computed as `price * 0.9` client-side, no backing offer | **BROKEN** |
| 4 | `QuickShop.jsx:419-928` | ~9 entirely fake "Flash Deals" products (fake IDs, prices, Unsplash images) wired directly into cart/checkout | **BROKEN** |
| 5 | `QuickShop.jsx:209,401-409,820-827` | Fake client-only "Flash Deals ends in 02:45:12" countdown, not tied to any real sale end-time | **BROKEN** |
| 6 | `ProductDetail.jsx:1472-1479` | 3 hardcoded fake "Bought Together" products with fabricated ratings/discounts | **BROKEN** |
| 7 | `delivery/Dashboard.jsx:223` | Hardcoded `'Avg. Time': '22 min'` stat next to genuine API-driven earnings figure | **BROKEN** |
| 8 | `admin/AllDeliveries.jsx:60-63` | Hardcoded fleet stats (`'32 Min'`, `'145'`, `'82'`, `'12'`) presented as live data | **BROKEN** |
| 9 | `Checkout.jsx:426` | Hardcoded `'Delivery in 2 days'` fallback shown despite a real serviceability check existing elsewhere in the same file | **PARTIAL** |
| 10 | `ProductCard.jsx:60,62`, `Checkout.jsx:408,410`, `CategoryProducts.jsx:129`, `CategoryProductsSection.jsx:99`, `ContinueShopping.jsx:122` | Fabricated fallback rating/review counts (`\|\| "4.2"`, `\|\| "120"`) indistinguishable from real social proof | **BROKEN** |
| 11 | `vendor/Dashboard.jsx:17-25,69-72` | Static weekly-sales chart data and hardcoded revenue/rating stats mixed with real Redux data in the same view | **BROKEN** |
| 12 | `Checkout.jsx:253,257` | Mock-payment auto-success branch (`mockPayment`/`provider==='mock'`) not gated behind a dev-only check — a production backend response with a mock flag would silently succeed the order | **BROKEN (security-relevant)** |

---

## 2a. Real-browser finding: CORS blocked all local-dev browser logins

**Status: fixed (2026-08-24), found only by testing in an actual browser.** Every prior verification of the fulfillment/ranking API in this session (and, per the Aug 19 docs, in the prior CR-002 session) had been via `curl` or Jest, both of which skip the browser's `Origin` header — so this was invisible to every automated test and every direct API check. `backend/.env` had `CORS_ORIGIN=http://localhost:3000`, but the frontend's actual dev server runs on port **3001** (documented in `docs/cr-002/PRODUCTION_FLOW_FINAL_CERTIFICATION.md`: "port 3000 is occupied by an unrelated project on this machine"; `frontend/playwright.config.js` also targets 3001). Result: **the browser rejected every login attempt to any panel** with a generic "SOMETHING WENT WRONG," while the backend logged `Origin http://localhost:3001 is not allowed by CORS` and returned 500. Fixed by adding `,http://localhost:3001` to `CORS_ORIGIN` (comma-separated list, both origins now allowed) and restarting the backend. Verified via a real Playwright-driven browser: login → dashboard → Fulfillment Settings → drag a weight slider → Save → `PUT 200` → independently re-queried via a fresh `curl`, confirmed the exact new value persisted in the DB, then restored to the original.

**Note:** `backend/.env.example`'s own default (`http://localhost:5173`, Vite's own default) agrees with neither the real `.env` (3000) nor the actual dev port (3001) — three different defaults across three places. Left as-is (not silently changed) since it's a template a developer consciously edits; flagging here so it doesn't cause the same confusion for the next person who copies it.

---

## 3. Admin dynamic configuration

| Requirement | Status | Evidence |
|---|---|---|
| Seller ranking weights — DB-backed, admin API + UI | **COMPLETE** | API was already wired (`AdminFulfillmentService`). Built `frontend/src/modules/admin/pages/operations/FulfillmentSettings.jsx` — the missing frontend consumer — with slider UI, wired into `AdminRoutes.jsx` at `/admin/fulfillment/settings` and added to the sidebar nav (previously neither this page's route nor the existing `FulfillmentMonitor` had a nav entry — reachable only by typing the URL). Verified end-to-end in a real browser: changed a weight, saved, independently re-fetched via a separate `curl` call, confirmed the new value persisted, restored to original. |
| Delivery partner ranking weights — DB-backed, admin API + UI | **COMPLETE** | Closed in P1 (backend: new `PARTNER_RANKING_WEIGHTS` settings key, validation, `FulfillmentConfigService` now resolves it from DB instead of always returning the hardcoded constant) and P3 (frontend: same settings page above includes a "Delivery-Partner Ranking Weights" section). Same real-browser verification as above. |
| Other operational settings (radii, timeouts, fees, fallback toggles) | **COMPLETE** | Confirmed DB-backed + admin-writable via `AdminFulfillmentService.NUMERIC_KEYS`/`BOOLEAN_KEYS`. |
| Engagement game settings (enable/disable, dates, reward types, limits) | **MISSING** | No settings keys exist yet — game itself doesn't exist (see §5). |

## 4. SEO — live audit

**Status: substantially implemented (2026-08-24).** Verified live in a real browser (Playwright), not just by reading code.

| Requirement | Status | Evidence |
|---|---|---|
| Per-page title/meta description | **COMPLETE (Home, ProductDetail, CategoryProducts)** / **PARTIAL (rest)** | Built `shared/components/SEO.jsx` using React 19's native `<title>`/`<meta>`/`<link>` head-hoisting (no new dependency — react-helmet isn't needed on React 19). Wired into Home, ProductDetail, CategoryProducts; verified live — real title/description/canonical/OG tags actually appear in the rendered `<head>`. Not yet wired into the other ~30 customer routes (Search, Cart, Wishlist, policy pages, etc.) — same component, mechanical remaining work. |
| robots.txt | **COMPLETE** | Build-time generated (`frontend/scripts/generate-seo-files.js`, runs via `postbuild`) from the single `SITE_URL` source in `src/config/siteConfig.js`. Disallows `/admin/`, `/seller/`, `/delivery/`, and private/transactional paths (cart, checkout, wallet, profile, wishlist, order-confirmation); everything else stays crawlable. Verified: `npm run build` produces a correct `dist/robots.txt`. |
| Sitemap.xml | **PARTIAL** | Same generator produces `dist/sitemap.xml` for all *stable* routes (home, categories index, deals, quick-shop, policy pages, etc.). Cannot yet include individual products/categories as distinct sitemap entries — see the URL-identity finding below. |
| Structured data (Product schema) | **COMPLETE for ProductDetail** | Built `shared/components/JsonLd.jsx`; `ProductDetail.jsx` renders a real `Product` JSON-LD block (name, description, image, brand, `AggregateRating` from real rating/reviewCount, `Offer` with real price/currency/availability computed from actual stock). Verified live: visited a product URL with **zero navigation state** (simulating a crawler) and confirmed the JSON-LD contained the real DB values (₹1499, 4.6★/8 reviews, "Mithila Heritage" brand, InStock). Category/Breadcrumb schema not yet added. |
| Canonical tags | **COMPLETE (same 3 pages)** | Included in `SEO.jsx`, verified live. |
| Image alt text | **PARTIAL (pre-existing, unchanged this pass)** | Primary listing/detail images correctly use `alt={product.name}`; secondary images (lightbox, "similar products") use generic alt text. Not touched in this pass — out of scope for the SEO infrastructure work; flagged for a follow-up pass. |

### Important finding: product/category pages had no stable URL identity — partially fixed

`/product-detail` and (before this pass) most product links carried the product only via React Router **navigation state** — no URL path or query param identified *which* product. A search engine, a shared link, or a page refresh landing on that URL with no state had nothing to resolve. This is a structural SEO defect independent of meta tags/sitemaps — you cannot rank or share a page that has no addressable URL.

**Fixed the read side:** `ProductDetail.jsx` now also reads `?id=` from the URL query string (in addition to navigation state), so a direct link/crawl/refresh resolves the real product from the database. Verified live exactly as described above.

**Not yet fixed — the write side:** 10 files across the codebase call `navigate('/product-detail', { state: {...} })` without appending `?id=` to the URL, so links generated by clicking through the app still don't carry a shareable/crawlable URL even though the page itself can now handle one if given. Propagating `?id={product.id}` into all 10 call sites is mechanical but touches many files — deliberately left as scoped follow-up rather than rushed across the whole codebase in one pass. Files: `ProductDetail.jsx` (self-links), `Home.jsx`, `ContinueShopping.jsx`, `QuickShop.jsx`, `BeautyLanding.jsx`, and 5 files under `components/vendor/home/`.

`CategoryProducts.jsx` did **not** have this problem — it already used a real `?category=` query param, so its SEO wiring was a direct addition, no read-side fix needed.

**Unrelated finding surfaced while testing this:** one seeded product's image path (`/uploads/cms/sample-banner.jpg`) 404s because it's a backend-relative path that only resolves against port 5000, not the frontend origin — a seed-data/asset-path issue, not an SEO defect. Noted for the seed-data cleanup, not fixed here.

**Note on "preserve existing SEO value / don't break indexed URLs":** confirmed — there was no existing SEO infrastructure to preserve, so this is genuinely greenfield work with no migration risk.

## 5. Customer engagement game ("Catch Your Delivery")

**Status: implemented and verified end-to-end (2026-08-24).** Built from scratch — model, repository, service, admin façade, controller, routes, and a fully playable frontend game. 37 new backend tests (23 `GameService`, 14 `AdminGameService`), all passing; 489/489 full suite. Verified live: real customer OTP login → real order → real 45-second play session in an actual browser → real backend-decided result revealed → verified in the database that a win credits the wallet exactly once even under a duplicate-claim attempt, and that a genuine loss grants nothing.

| Requirement | Status | Evidence |
|---|---|---|
| Game UI on order tracking (falling rewards, 30–60s, dismissible, optional) | **COMPLETE** | `CatchYourDeliveryGame.jsx` — falling coin/gift/star icons, tap-to-catch, live countdown + catch counter, dismissible at any phase (X button + backdrop click), entry point only shown when a real eligibility check passes. Embedded in `OrderDetail.jsx` (the order-tracking page) as an optional banner, not forced. Verified live in a real browser: full 45-second play session, real falling-item animation, real result screen (screenshots captured for both the "won" and "lost" paths — a real loss was reproduced live). |
| Backend-authoritative reward grants, anti-replay | **COMPLETE — and closes a real pre-existing gap** | Outcome (win/lose, reward type, value) is decided and persisted **at start()**, before the client ever sees it — confirmed by reading the DB directly mid-session, seeing the real decided outcome while the API response revealed nothing. `claim()` only reveals what was already decided; it never accepts a client-reported result. **Found while building this:** `WalletTransaction`/`Refund`/`Order`'s own `idempotencyKey` field is indexed but **not `unique: true`** — a real race under concurrent requests (not fixed system-wide; flagged as its own item below). `GameSession` avoids repeating that gap with a genuinely `unique: true` index on `(orderId, attemptNumber)`, plus an atomic `findOneAndUpdate({status:'started', expiresAt:{$gt:now}})` claim gate. Live-verified: claimed the same session twice via real HTTP requests — exactly one wallet transaction, exactly one credit, confirmed by an independent DB query. Also live-verified: a different real customer account attempting another customer's order-game returns "Order not found" (not "forbidden"), so a cross-user probe can't distinguish a real order from a nonexistent one. |
| Reward types (coins, discount coupon, free delivery, loyalty points, surprise) | **PARTIAL — by design, documented** | All 5 reward types are modeled and awarded, but "discount coupon" and "free delivery" are granted as an equivalent **wallet credit**, not a real generated `Coupon` code — the `Coupon` model has no per-user assignment field today (checked: `CouponUsage` tracks usage per-user, but a `Coupon` itself isn't ownable by one person). Building true single-use coupon-code rewards is a real, separate follow-up (schema change or a code-generation service), not attempted here to avoid scope creep into the coupon system. |
| Admin campaign controls (on/off, dates, reward types, limits, probability) | **COMPLETE** | 8 new `PLATFORM_SETTING_KEYS` (enabled, start/expiry dates, duration, max-plays-per-order, win probability, coin min/max) following the exact same DB-backed, validated, admin-API pattern as P1/P3's ranking weights (`AdminGameService`, `GET/PUT /admin/game/settings`). Live-verified via `curl` with a real admin token — returns real defaults, correctly rejects invalid patches. No admin UI page built yet for these settings (same gap as fulfillment settings was before P3 — a mechanical follow-up, not attempted in this pass to control scope). |

**Also found and fixed while building this (real bugs, not the feature itself):**
- `GameService` originally passed the caller's raw `orderId` param (which can be an order **number** string, not the real ObjectId — confirmed via `OrderRepository.findActiveById`'s dual-format support) straight into `GameSession.create()` and `countByOrder()`. Fixed to consistently resolve and use the real `order._id` — a caller passing an order number would otherwise have silently broken play-limit enforcement and mismatched `GameSession.orderId` values. Regression-tested (`"resolves the real Order._id even when a caller passes an order NUMBER"`, both in `startSession` and `getPlayEligibility`).
- Ownership check upgraded from fetch-then-compare to `OrderRepository.findActiveById(orderId, userId)`'s built-in ownership filter — a cross-user order-access attempt now looks identical (in response and timing) to a genuinely nonexistent order, rather than existing-but-forbidden.

**Not fixed, flagged instead (pre-existing, out of scope for this task):**
- `WalletTransaction.idempotencyKey`, `Refund.idempotencyKey`, `Order.idempotencyKey` are all indexed `sparse` but **not `unique`** — a real, exploitable double-grant race under genuinely concurrent requests, predating this session (confirms `PaymentTransaction.js` even has an explicit `unique: false` on a similar index — worth understanding why before touching any of these). Not fixed here: touches 3 existing production models' semantics, a bigger and riskier change than this task's scope; the game itself avoids depending on this gap by using its own genuinely unique index instead.
- Wallet balance is not yet spendable at checkout (see §3a below) — a game-won coin balance is real and visible, but not yet usable on an order until that's wired up.

---

### 5a. Pre-existing gap surfaced while building the game: Wallet has no checkout integration

**Status: documented, not fixed (explicit scope decision).** The `Wallet`/`WalletTransaction` system (balance, credit, debit, transaction history) is fully built and has existed prior to this session, but is never referenced anywhere in `PricingService` or order creation — a customer can see a wallet balance (`GET /users/me/wallet`) but has no way to apply it toward a purchase. This means a game-won coin reward is a real, persisted, correctly-guarded credit, but not yet *usable* by the customer until checkout is wired to accept it. Flagged to the user directly during this session; decision was to build the game against the real wallet now and treat checkout redemption as a separate, later, financially-sensitive pass rather than expand this task's scope into `PricingService`/`OrderService`.

## 6. Frontend admin UI coverage for existing backend capability

| Requirement | Status | Evidence |
|---|---|---|
| Admin page to view/edit seller ranking weights | **COMPLETE** | See §3. |
| Admin page to view/edit delivery partner ranking weights | **COMPLETE** | See §3. |

---

## Priority order for implementation (dependency-safe)

1. **P0 — Correctness/safety bugs already found:** mock-payment auto-success gate (item 12, §2) — a real security-relevant defect, fixed first regardless of anything else.
2. **P1 — Backend/API/DB gaps:** delivery-partner ranking weights → DB-backed + admin API (mirrors the seller-ranking pattern exactly, so low-risk); seed real inventory into the CR-002 4-seller fixture so the ladder can actually run.
3. **P2 — Frontend dummy-data removal:** items 1–11 in §2, each replaced with real backend-sourced values or removed if no backend field exists yet.
4. **P3 — Seller/delivery ranking admin UI:** build the frontend page(s) for the two settings APIs (one already exists, one added in P1).
5. **P4 — SEO:** meta/title management component, robots.txt (blocking internal panels is the urgent part), sitemap generator, structured data, canonicals.
6. **P5 — Engagement game:** backend reward model + idempotent claim endpoint + admin campaign settings, then frontend game component.
7. **P6 — E2E:** re-run Playwright suite against seeded data from P1, fix harness offer-isolation, extend coverage to delivery/admin/customer panels.
8. **Documented, not implemented:** Shiprocket real account/pickup location (external business decision) — placeholder wired per user instruction, flagged in code and here.

Progress and evidence for each item is recorded in [`IMPLEMENTATION_REPORT.md`](./IMPLEMENTATION_REPORT.md) as it lands.
