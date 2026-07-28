# Phase 3 — Automated Test Suite (Mock Shipping, No Shiprocket API)

**Project:** Mithilakart MERN Marketplace  
**Date:** 2026-07-22  
**Scope:** Backend integration + order-flow tests using **mock courier** (`SHIPPING_PROVIDER=mock`) — no live Shiprocket credentials required  
**Resolves Phase 0 blocker:** **B5 — No automated E2E test suite**

---

## Executive Summary

Phase 3 adds automated **order-flow integration tests** and a single **`npm run test:e2e`** command. All courier/shipping tests run against the **Mithilakart Courier mock** — no external Shiprocket API calls. Shiprocket adapter code from Phase 2 remains in place for when credentials are available.

| Layer | Status |
|-------|--------|
| Unit tests | **54 total** (unchanged + new) |
| Order-flow integration (QC + e-commerce mock) | **Done** |
| Shipping HTTP integration (serviceability + webhook) | **Done** |
| Playwright/Cypress frontend E2E | **Not added** (needs running stack + browser) |
| Live Shiprocket sandbox | **Skipped** (no API keys) |

---

## Test Commands

```bash
# All backend tests (unit + integration)
cd backend; npm test

# Integration / flow tests only
cd backend; npm run test:integration

# E2E-style flow tests (mock shipping, JSON report)
cd backend; npm run test:e2e

# From repo root
npm test
npm run test:e2e
```

**Latest run:** `npm test` → **25 suites / 54 tests PASS**

Report output: `backend/test-reports/e2e-results.json` (after `npm run test:e2e`)

---

## What Was Added

### Test files

| File | Coverage |
|------|----------|
| `backend/tests/integration/orders/order-flow.test.js` | E-commerce mock AWB, quick commerce local delivery, seller accept, mock serviceability, webhook status sync |
| `backend/tests/integration/shipping/serviceability.test.js` | `GET /shipping/serviceability`, webhook endpoint |
| `backend/tests/helpers/integrationHarness.js` | Shared app bootstrap with mock providers |

### Config

| File | Change |
|------|--------|
| `backend/tests/setup.js` | Forces `SHIPPING_PROVIDER=mock`, `PAYMENT_PROVIDER=mock` |
| `backend/package.json` | `test:integration`, `test:e2e` scripts |
| `package.json` (root) | Delegates `test` / `test:e2e` to backend |

### Production fixes (found during testing)

| File | Fix |
|------|-----|
| `backend/src/controllers/shipping/ShippingController.js` | `this.ok` → `this.sendSuccess` (was causing 500 on serviceability) |
| `backend/src/core/providers/shipping/createShippingProvider.js` | Config import path `../../../config` |
| `backend/src/core/providers/MockCourierShippingProvider.js` | Added `checkServiceability()` + mock `labelUrl` |

---

## Flows Verified (Mock Mode)

### E-commerce (`standard`)
1. Payment confirm → order status `placed`
2. Mock courier creates AWB (`MKC…`) + label URL
3. `fulfilmentType: courier`
4. Seller can accept `placed` → `confirmed`
5. Webhook payload updates status to `shipped`

### Quick commerce (`quick_shop`)
1. Payment confirm → `placed`
2. `fulfilmentType: local_delivery` — **no** courier shipment

### Shipping API
1. `GET /api/v1/shipping/serviceability?pincode=110001` → `{ serviceable: true, provider: 'courier_mock' }`
2. Invalid pincode → 422 validation error
3. Webhook endpoint returns 200 (handler tested at service layer)

---

## Not In Scope (Deferred)

- **Playwright/Cypress** browser E2E (customer checkout UI, seller panel clicks)
- **Live MongoDB** full-stack HTTP order placement (existing `scripts/e2e-live-test.js` still manual)
- **Shiprocket sandbox** — enable later with `SHIPPING_PROVIDER=shiprocket` + credentials

---

## Enabling Shiprocket Later

When API keys are available:

```env
SHIPPING_PROVIDER=shiprocket
SHIPROCKET_EMAIL=...
SHIPROCKET_PASSWORD=...
SHIPROCKET_PICKUP_PINCODE=...
```

Until then, **mock mode is the default** and all tests pass without external APIs.

---

## Next: Phase 4

Production readiness checklist with justification per item.
