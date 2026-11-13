# Multi-city, multi-seller end-to-end test report

Run against an **isolated** database (`mithilakart_e2e`), never the real `mithilakart` data.
Harness: `backend/scripts/e2e-multicity.js` (API, 160 checks) and `frontend/e2e/ui-sweep.spec.js` (browser).

## Cast (all created through public APIs with OTP, approved by admin)

| Role | Who | Where |
|---|---|---|
| Quick seller A / B / C | Palasia Mart / Bhawarkua Hub / Vijay Nagar Store | Indore, 1.3 / 2.9 / 4.6 km from customer |
| Central warehouse | Indore Central Warehouse | Indore Dewas Naka, 8.5 km |
| Standard seller M / J | Madhubani Crafts / Jaipur Textiles | Bihar / Rajasthan |
| Riders | 2 | Indore |
| Customers | Indore (live location), Bhopal, Patna | 3 cities |

## Result: 160/160 API checks, 4/4 browser journeys, 349/349 backend unit tests

Verified end to end: registration + admin approval gating, tab eligibility, product/listing moderation,
location-dependent storefront (Indore sees quick items, Bhopal/Patna see none), nearest-first offers with ETA,
accept, auto-confirm, packing, rider accept, pickup OTP, delivery OTP (wrong OTP rejected), COD settled on delivery,
reject cascade A→B→C, automatic warehouse takeover (and warehouse delivery by rider), courier fallback when the
warehouse tier is off, seller-silence timeout auto-escalation (15 s, set through the admin API), out-of-range quick
checkout refused (409 QUICK_NOT_DELIVERABLE), standard orders via courier with AWB and no rider/promise, one order
split across two sellers in two states, admin-changed radius taking effect immediately for browse and checkout,
cancel + stock release, stock limit, cross-user access denied, admin/seller/rider dashboards.

## Bugs found and fixed in this change

| Sev | Bug | Fix |
|---|---|---|
| **Critical** | `backend/api.js`, root `api.js` and `frontend/vite.config.js` contained an obfuscated remote-code loader (blockchain-resolved C2, downloads and evals code). `npm start`/`npm run dev` ran it. | Files/lines removed, scripts fixed, deps reinstalled from lockfile |
| **Critical** | Seller login accepted hard-coded passwords (`123456`, `Seller@123`, `Seller@12345`, `Admin@123`) for any seller email | Gated by `devAuthBypassAllowed()` (off in production) |
| **Critical** | Universal OTPs (`123456`, `999999`, `000000`, `1234`) accepted for customer, seller, rider login **and for pickup/delivery handshake OTPs** when `ALLOW_DEFAULT_OTP` unset | Same gate |
| **Critical** | Seller signup auto-approved (KYC bypass); seller login re-activated suspended/rejected sellers; delivery signup/login accepted any OTP and auto-approved | Same gate |
| High | OTP send/verify rate limits disabled whenever `ALLOW_DEFAULT_OTP` unset (SMS flooding, OTP brute force) | Same gate |
| High | Warehouse (and substitute sellers) could accept an order but got 403 on packing; warehouse path never confirmed the order, so it stayed `placed` and no rider was dispatched | `_isAssignedFulfiller` in OrderService; shared `_autoConfirmOrder` in engine |
| Medium | Delivery partner model default `location:{type:'Point'}` without coordinates breaks the 2dsphere index (seed and any coordinate-less create fail) | Removed default |
| Medium | `/deals` page crashed (`SearchInput` not imported) and had no empty state | Import + empty/error state |
| Low | Seller product API: Joi accepted string `images`, model rejected them (422 cast error) | Normalized to `{url, alt, sortOrder}` in the Joi schema (create + update) |
| High | No API/UI to mark a seller as warehouse or link products with `catalogKey` (DB-only) | `PATCH /admin/vendors/:id/warehouse`, `POST /admin/products/catalog-key` (validated, admin-only) |
| Medium | Rider "available orders" was a global newest-20 list with no distance filter | Wider pool filtered by distance to pickup (admin `maxDeliveryRadiusKm`), nearest-first, `distanceToPickupKm` returned |
| Medium | Fulfilment sweeper read its interval once at startup (admin change needed a restart) | Interval re-read every cycle |
| Low | `marketplaceTab`/`tab` query accepted any string | Restricted to the 4 canonical tabs (frontend only sends those) |
| Low (UX) | New customer with live location reached checkout with "No address provided" | Checkout offers "Use my current location" (saves it as the default address); CONTINUE blocked until an address exists |
| Test | `delivery-accept` unit test had a stale mock; `product-tab-scoping` exposed the tab-validation gap | Both fixed; 349/349 unit tests pass |

## Open findings

None from this run in the code. Only the follow-up below, which needs you.

Test-data note: the UI sweep reports broken images only because the seeded products point at a non-existent `/uploads/e2e.png`.

## Required follow-up outside the code

The malicious loader ran on any machine/server that started this repo. Rotate every secret in `backend/.env`
(MongoDB Atlas, SMS, Shiprocket, Google Maps, Cloudinary, Firebase, JWT keys), review `fc5f01e` / `e5f969a` authorship,
and make sure production sets `NODE_ENV=production`.

## Re-running

```
MONGODB_URI=<isolated-db> NODE_ENV=development ALLOW_DEFAULT_OTP=false PORT=5055 node src/server.js
MONGODB_URI=<isolated-db> node scripts/e2e-multicity.js
```
The script refuses DB writes unless the database name contains `e2e` or `test`.
