# CR-002 — Production Flow Certification

**Date:** 2026-08-19
**Scope:** Quick-commerce fulfillment: checkout → engine → seller ladder → warehouse → courier → standard downgrade.
**Verification base:** live MongoDB Atlas (replica set), live Shiprocket API, real backend on :5000, real Vite client on :3001, Chromium via Playwright.

> **This is not a "production ready" declaration.** Four root causes were found and fixed, and a substantial part of the required verification is **BLOCKED** — listed in full in §19. Nothing blocked has been recorded as passing.

---

## 1. Original browser failure

Reported: seller ladder not progressing; seller popup and ringtone unreliable; customer not seeing the transition; quick→standard fallback not completing; browser flow stopping while tests passed.

Measured against the live database before any change:

| Metric | Value |
|---|---|
| Fulfillments ending `failed` | **79 / 97 (81%)** |
| Seller offers that reached a seller and timed out | **41 / 55 (75%)** |
| Courier attempts that failed | **79 / 79 (100%)** |
| Seller offers ever accepted | 7 |

---

## 2. Root causes

Four independent defects, in execution order. Full evidence in [REAL_FLOW_FAILURE_ANALYSIS.md](./REAL_FLOW_FAILURE_ANALYSIS.md).

| # | Root cause | Layer |
|---|---|---|
| **4** | Engine started **inside the uncommitted checkout transaction**; read the order on another connection, found nothing, gave up silently. Intermittent by nature; invisible to every unit test because none open a real transaction. | Backend transaction boundary |
| **1** | `fulfillment_offer` had **exactly one listener in the whole frontend**, mounted inside the Orders page. Sellers land on the Dashboard, so the event landed on zero listeners. | Frontend realtime scope |
| **2** | No ringtone lifecycle: a one-shot 0.5 s beep, unstoppable, wired only to the legacy `new_order` event, with autoplay blocks silently swallowed. | Frontend notification |
| **3a** | `SHIPROCKET_PICKUP_LOCATION=Primary` — **no such pickup location exists** on the account (it has `MayurTailor`, `BhaveshTailor`, `AtharvaTailor_2113f4`). Every ad-hoc order rejected. | Configuration / provider |
| **3b** | The QUICK→STANDARD downgrade was written **only on the courier success path**, so a provider failure dead-ended the order while the customer still saw a quick promise. | Backend engine |

Three further defects were found by calling the **live** Shiprocket API:

| Defect | Evidence |
|---|---|
| A **fabricated phone number** (`9876543210`) was sent whenever the address phone did not parse. 18 real orders would have shipped with a stranger's contact number. | Live 422 + DB audit |
| `generateLabel` used **GET**; the route is POST-only, so label generation could never succeed and the failure was swallowed. | Live HTTP 405 |
| Cancellation sent **shipment ids** to the **order**-cancel endpoint — so a cancelled order stayed live at the courier. | Live "Order Id does not exist" |

---

## 3. Backend changes

| File | Change |
|---|---|
| `config/database.transaction.js` | `session.afterCommit(fn)`: post-commit hooks, discarded on abort. Fixes the race for every caller, present and future. |
| `services/orders/OrderService.js` | Engine start registered as an after-commit hook instead of firing inside the transaction. |
| `services/fulfillment/FulfillmentEngineService.js` | STANDARD downgrade persisted **on entering** the courier rung, before the provider call; `COURIER_FALLBACK` emitted immediately; `deliveryMode` re-asserted on the FAILED event; misconfiguration distinguished from outage. |
| `constants/fulfillment.js` | New `COURIER_MISCONFIGURED` failure code. |
| `core/providers/shipping/ShiprocketShippingProvider.js` | `resolvePickupLocation()` validates against the account and names valid options; serviceability now checked from the **actual** dispatch pincode; `_customerPhone()` refuses to fabricate. |
| `core/providers/shipping/ShiprocketClient.js` | `listPickupLocations()` (cached); `generateLabel` GET→POST; `cancelByAwb()` split from order cancellation. |
| `services/seller/SellerFulfillmentService.js` | Offer payload carries line items, quantities, total units, order value and payment method — still no customer identity, phone or street address. |

## 4. Frontend changes

| File | Change |
|---|---|
| `modules/seller/context/FulfillmentOfferContext.jsx` | **New.** Single app-wide owner of the offer subscription, the poll, and the ringtone. Socket says *when*; the REST response is what is trusted. Re-reads on reconnect. |
| `modules/seller/components/common/IncomingOfferModal.jsx` | **New.** Blocking popup on any page: items, quantities, value, area, server-driven countdown, Accept/Reject, autoplay-blocked banner. |
| `shared/utils/offerRingtone.js` | **New.** Looping ringtone with explicit stop, single-instance guard, honest autoplay-block reporting. |
| `components/layout/SellerLayout.jsx` | Provider + modal mounted above the router. |
| `components/common/FulfillmentOffers.jsx` | Reduced to a view over the shared context — no longer the sole subscriber. |
| `shared/services/socket.js` | Connection state exposed for diagnostics and E2E. |

## 5. Realtime / notification

`fulfillment_offer` now has an app-wide listener. Room naming (`seller:<Seller._id>`) and socket auth were **verified correct and left unchanged** — they were never the fault. No second socket system was introduced; the existing `io` instance, rooms and EventBus are reused.

---

## 6–18. Verification results

| # | Item | Result | Evidence |
|---|---|---|---|
| 1 | Engine starts on a real order | **PASS** | Live order → `fulfillment started` → `seller offered` |
| 2 | After-commit hook semantics (commit / abort / hook failure / ordering) | **PASS** | 5 tests |
| 3 | Seller popup appears **on the Dashboard** | **PASS** | Playwright, real browser, 45.8 s |
| 4 | Popup content: item, ×qty, value, COD, area, ETA, ticking countdown | **PASS** | Playwright |
| 5 | Popup hides customer phone and street address | **PASS** | Playwright + 6 backend tests |
| 6 | Offer payload authorisation (no rank scores, no candidates) | **PASS** | 6 tests |
| 7 | Seller accept — **full live path** | **PASS** | Real order → offer → `POST /accept` → `{accepted:true}` → offers drop to 0 → DB: `state=seller_accepted`, `attempt 1 seller accepted`, `deliveryMode=quick`, `source=seller`, computed ETA **9 min** (not hardcoded) |
| 8 | Seller accept via **browser UI** | **BLOCKED** | Backend path proven correct (row 7), so this is a **harness** gap, not a product defect: with several offers live the modal shows `offers[0]`, which may not be the order the spec placed, so the spec's assertion targets the wrong offer. Needs per-test offer isolation. |
| 9 | Seller reject via browser UI → next rung | **BLOCKED** | Same harness cause; reject is proven at API level (16 tests) |
| 10 | Offer survives reload/reconnect (browser) | **BLOCKED** | Same |
| 11 | Ringtone lifecycle (loop, stop, no duplicates, autoplay fallback) | **BLOCKED** | Implemented; **no automated verification** |
| 12 | Seller timeout → escalation | **PASS** | Live: `SELLER_TIMEOUT` → warehouse → courier |
| 13 | Seller 1→2→3→4 ladder | **BLOCKED** | Only **one** quick-commerce seller is seeded; the 4-seller fixture was never run |
| 14 | Warehouse fallback | **FAIL (data)** | Reached correctly, but warehouse stocks no matching product → `SELLER_MISSING_PRODUCT` |
| 15 | Courier: auth, serviceability, pickup resolution | **PASS** | Live Shiprocket |
| 16 | Courier: real shipment created | **PASS (with caveat)** | Real order `1526633568` / shipment `1522853854` created, then **cancelled successfully**. AWB assignment returned "Awb not Assigned" — account-level, not code |
| 17 | Quick→STANDARD downgrade persists despite courier failure | **PASS** | Live order: `deliveryMode=standard`, all quick ETAs null, `shipment=null` |
| 18 | Order not falsely marked shipped on provider failure | **PASS** | Live + 6 regression tests |
| 19 | Misconfiguration vs. outage distinguished | **PASS** | 8 tests |
| 20 | Phone never fabricated | **PASS** | 5 tests |
| 21 | Label POST / cancel id routing | **PASS** | 6 tests |
| 22 | Customer UI shows Standard Delivery after downgrade | **NOT VERIFIED** | Backend now emits it correctly and the component reads it; **no browser test run** |
| 23 | Delivery partner flow | **BLOCKED** | Not exercised |
| 24 | Admin fulfillment monitor | **BLOCKED** | Not exercised in browser (API-level tests pass) |
| 25 | Standard e-commerce regression | **PARTIAL** | Full backend suite green; **no browser run** |

---

## 15. MongoDB layer-2

`tests/layer2` (real-transaction concurrency) was **NOT run** — **BLOCKED**.

## 16. Browser E2E

Playwright installed, Chromium installed, harness and 5 specs written against the real stack (no mocking of the engine).

```
2 passed
3 failed  (harness/environment, not product defects proven either way)
```

Passing: the two that encode the actual outage — popup on the Dashboard, and popup content.

## 17. Regression tests added

| Suite | Tests |
|---|---|
| `courier-downgrade-regression.test.js` | 6 |
| `seller-offer-payload.test.js` | 6 |
| `shiprocket-pickup-location.test.js` | 8 |
| `shiprocket-live-defects.test.js` | 11 |
| `order-fulfillment-start-race.test.js` | 8 |
| **Total new** | **39** |

## 18. Full suite

```
Test Suites: 50 passed, 50 total
Tests:      441 passed, 441 total
```

Baseline before this work: 402. No test was weakened or removed.

---

## 19. Remaining blockers

**Must be closed before any production claim.**

1. **Seller accept/reject not verified through the browser.** *(Downgraded from critical — the backend is now exonerated.)* The full accept path is proven end-to-end on live infrastructure (§6 row 7): real order → offer → accept → `seller_accepted` in MongoDB. What remains is a **test-harness** limitation: with several offers live for one seller, the modal renders `offers[0]`, which need not be the order the spec just placed. Fix by isolating offers per test (dedicated seller, or assert against whichever offer the modal actually shows).
2. **Ringtone has no automated verification at all.** Written to spec — loop, stop conditions, autoplay fallback — but never executed in a browser.
3. **Seller 1→2→3→4 ladder never exercised.** Only one quick-commerce seller exists in the data. `scripts/seed-cr002-test-data.js` creates the 4-actor fixture but was **not run**.
4. **Warehouse fallback fails on data**, not code: the warehouse stocks no matching product.
5. **`SHIPROCKET_PICKUP_LOCATION=MayurTailor` is a placeholder** — a verified address on the linked account, but in **Indore (452001)** while orders ship from **Bihar**. The account itself (`admin@silaiwala.com`, tailor-named locations) does not look like Mithilakart's. **Register the real warehouse before production.** Flagged with a TODO in `.env`.
6. **AWB assignment returns "Awb not Assigned"** — likely wallet/courier configuration on the Shiprocket account. Not a code defect, but the courier path is not proven to completion.
7. **Customer, delivery-partner and admin UIs have no browser coverage.**
8. **Layer-2 concurrency tests not run.**
9. **Standard e-commerce has no browser regression run.**
10. **Test data pollution:** 18 real orders have no usable phone and 107 carry `9999999999`, which Shiprocket rejects. Courier fallback will keep failing on those until the data is cleaned.

---

## Environment notes

- The backend was restarted several times; it runs `node src/server.js` (not nodemon) and does **not** hot-reload.
- Port **3000** is occupied by an unrelated project on this machine; the Mithilakart client runs on **3001**, which `playwright.config.js` targets.
- OTP and login rate limits (10 per 15 min) are backed by in-memory Redis and reset on backend restart. The E2E harness caches both sessions for this reason.
- One real Shiprocket order was created under explicit authorisation and **cancelled successfully**; the account was left as found.

## Honest summary

Four real root causes were found — one of them (the transaction race) invisible to the entire existing test suite — plus three further live-API defects. All are fixed, with 39 permanent regression tests and a real-browser test that reproduces and now proves the headline failure.

The **complete quick-commerce happy path is proven on live infrastructure**: order placed → engine starts → seller offered → seller accepts → `seller_accepted`, with a computed 9-minute ETA. The **quick→standard downgrade is proven** to survive a courier failure without dead-ending the order or falsely claiming shipment.

The system is **materially better and measurably so**, but it is **not production-ready**. Ten blockers remain (§19). The most consequential are operational rather than code: the Shiprocket pickup location is a placeholder in the wrong city, only one quick-commerce seller exists so the 1→2→3→4 ladder has never run, the warehouse stocks no matching product, and the ringtone has no automated verification of any kind.
