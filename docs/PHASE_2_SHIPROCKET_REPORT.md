# Phase 2 — Shiprocket / E-commerce Courier Integration

**Project:** Mithilakart MERN Marketplace  
**Date:** 2026-07-22  
**Scope:** Real Shiprocket adapter for pan-India e-commerce orders (`standard`, `mithilak` → `fulfilmentType: courier`)  
**Resolves Phase 0 blocker:** **B1 — Shiprocket stub-only**

**Test baseline:** `cd backend; npm test` → **23 suites / 46 tests PASS**

---

## Executive Summary

Phase 2 replaces the empty Shiprocket stub with a **full courier integration path**: serviceability check, adhoc order creation, AWB assignment, pickup scheduling, label URL, webhook status sync, tracking poll, and cancellation. The default provider remains **`mock`** for local dev; set `SHIPPING_PROVIDER=shiprocket` with credentials for live API calls.

| Area | Status |
|------|--------|
| Shiprocket auth + token cache | **Done** |
| Serviceability API | **Done** |
| Shipment creation on e-commerce order confirm | **Done** |
| Webhook → order status sync | **Done** |
| Tracking poll on customer `GET /orders/:id/tracking` | **Done** |
| Cancel courier shipment on customer cancel | **Done** |
| Checkout pincode serviceability (frontend) | **Done** |
| Customer AWB / timeline / label UI | **Done** |
| Seller shipping label download | **Done** |
| Live Shiprocket sandbox E2E (needs credentials) | **Not run** |
| Admin shipping label UI | **Not added** (API exists) |

---

## Architecture

```
E-commerce order paid → placed
       ↓
OrderService._afterOrderConfirmed (fulfilmentType === courier)
       ↓
CourierShipmentService.createForOrder
       ↓
ShiprocketShippingProvider.createShipment
  1. checkServiceability(pickup → delivery pincode)
  2. POST adhoc order
  3. assign AWB
  4. generate pickup
  5. fetch label URL
       ↓
order.shipment persisted { awb, courierName, labelUrl, shipmentId, ... }

Webhook POST /api/v1/shipping/webhooks/shiprocket
       ↓
CourierShipmentService.handleWebhookPayload → order status + checkpoints

Customer GET /orders/:id/tracking
       ↓
CourierShipmentService.syncTrackingForOrder (poll Shiprocket)
```

---

## Backend Changes

### New files

| File | Purpose |
|------|---------|
| `backend/src/core/providers/shipping/ShiprocketClient.js` | Auth, serviceability, create order, AWB, pickup, track, cancel, label |
| `backend/src/core/providers/shipping/ShiprocketShippingProvider.js` | Full provider orchestrating Shiprocket flow |
| `backend/src/core/providers/shipping/shiprocketStatusMap.js` | Shiprocket status → internal order status (incl. RTO) |
| `backend/src/services/shipping/CourierShipmentService.js` | Payload builder, webhook handler, tracking sync, cancel |
| `backend/src/controllers/shipping/ShippingController.js` | Serviceability, webhook, label endpoints |
| `backend/src/routes/v1/shipping.routes.js` | Route definitions |

### Modified files

| File | Change |
|------|--------|
| `backend/src/config/index.js` | `shiprocket` + `shipping.provider` config |
| `backend/.env.example` | `SHIPROCKET_*`, `SHIPPING_PROVIDER` vars |
| `backend/src/core/providers/shipping/createShippingProvider.js` | Shiprocket factory with config |
| `backend/src/core/providers/bootstrapProviders.js` | Reads `SHIPPING_PROVIDER` |
| `backend/src/services/orders/OrderService.js` | Uses `CourierShipmentService`; sync on tracking; cancel on customer cancel |
| `backend/src/bootstrap/container.js` | Wires shipping service, controller, routes |
| `backend/src/routes/v1/index.js` | Mounts `/shipping` |

### API routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/shipping/serviceability?pincode=` | Public | Check courier serviceability |
| POST | `/api/v1/shipping/webhooks/shiprocket` | Optional `x-api-key` | Shiprocket status webhooks |
| GET | `/api/v1/shipping/orders/:orderId/label` | Seller | Shipping label URL |
| GET | `/api/v1/shipping/orders/:orderId/label/customer` | Customer | Shipping label URL |

---

## Frontend Changes

| File | Change |
|------|--------|
| `frontend/src/modules/user/services/shippingApi.js` | **New** — serviceability API helper |
| `frontend/src/modules/user/pages/Checkout.jsx` | Pincode serviceability check for e-commerce; blocks checkout if unserviceable |
| `frontend/src/modules/user/utils/mappers.js` | Maps `shipment` on order detail |
| `frontend/src/modules/user/pages/profile/OrderDetail.jsx` | AWB, courier name, checkpoint timeline, label download |
| `frontend/src/modules/seller/services/sellerApi.js` | `getShipmentLabel()` |
| `frontend/src/modules/seller/pages/orders/OrderDetail.jsx` | AWB/courier display + shipping label button |

---

## Configuration

```env
SHIPPING_PROVIDER=mock          # or shiprocket
SHIPROCKET_EMAIL=
SHIPROCKET_PASSWORD=
SHIPROCKET_API_BASE_URL=https://apiv2.shiprocket.in
SHIPROCKET_PICKUP_LOCATION=
SHIPROCKET_PICKUP_PINCODE=
SHIPROCKET_CHANNEL_ID=
SHIPROCKET_WEBHOOK_SECRET=
SHIPROCKET_DEFAULT_WEIGHT_KG=0.5
```

**Local dev:** `SHIPPING_PROVIDER=mock` (default) — mock AWB, no external API.  
**Staging/production:** Set `shiprocket` + credentials; configure webhook URL in Shiprocket dashboard.

---

## Tests Added

| Test file | Coverage |
|-----------|----------|
| `backend/tests/unit/providers/shiprocket-status-map.test.js` | Status mapping + RTO detection |
| `backend/tests/unit/providers/shiprocket-client.test.js` | Auth token caching |
| `backend/tests/unit/services/courier-shipment.service.test.js` | Webhook payload → order update |

---

## Known Gaps / Phase 3+ Items

1. **No live Shiprocket sandbox test** — requires merchant credentials; mock provider used in CI.
2. **Admin label UI** — route exists; admin panel button not added.
3. **COD vs prepaid edge cases** — serviceability respects `cod` flag; full COD reconciliation with Shiprocket not E2E tested.
4. **Cancellation after AWB assigned** — cancel API called; RTO refund flow not automated.
5. **Multi-seller cart** — single seller pickup pincode per order assumed.
6. **Weight/dimensions** — defaults to 0.5 kg / 10×10×10 cm when product attrs missing.

---

## Changelog (Phase 2)

### Added
- Shiprocket client with 9-day token cache
- Full e-commerce shipment lifecycle (create → AWB → pickup → label → track → cancel)
- Webhook handler with optional secret verification
- Public serviceability endpoint
- Checkout pincode validation for e-commerce
- Customer + seller shipping label access

### Fixed
- Phase 0 **B1**: Shiprocket no longer stub-only; real adapter available via env
- `AppError.internal()` call in provider (removed invalid second argument)

### Unchanged
- Quick commerce (`local_delivery`) still uses delivery boy flow — Shiprocket not involved
- Default provider remains `mock` unless explicitly configured

---

## Verification Checklist

- [x] `npm test` — 46/46 pass
- [x] Serviceability route registered at `/api/v1/shipping/serviceability`
- [x] E-commerce orders trigger `CourierShipmentService.createForOrder`
- [x] Customer order detail shows AWB + courier timeline when `shipment` present
- [x] Seller can download label when `shipment.labelUrl` exists
- [ ] Manual test with Shiprocket sandbox credentials (pending merchant setup)

---

## Next: Phase 3

Automated integration + Playwright/Cypress E2E for full QC and e-commerce journeys; single `npm run test:e2e` command.
