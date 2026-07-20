# Frontend Integration Guide

This guide explains how to connect the Mithilakart frontend portals to the live backend API (Phase 10).

## Base URLs

| Portal | Frontend env var | Backend prefix |
|--------|------------------|----------------|
| Customer | `VITE_API_BASE_URL=http://localhost:3000/api/v1` | `/api/v1` |
| Seller | `VITE_SELLER_API_BASE_URL=http://localhost:3000/api/v1/seller` | `/api/v1/seller` |
| Admin | `VITE_ADMIN_API_BASE_URL=http://localhost:3000/api/v1/admin` | `/api/v1/admin` |
| Delivery | `VITE_DELIVERY_API_BASE_URL=http://localhost:3000/api/v1/delivery` | `/api/v1/delivery` |

Set `CORS_ORIGIN` in backend `.env` to your frontend origin (e.g. `http://localhost:5173`).

## Authentication

1. **Customer** — `POST /api/v1/auth/send-phone-otp` → `POST /api/v1/auth/verify-phone-otp`
2. **Seller / Admin / Delivery** — `POST /{portal}/auth/login` with email + password
3. Attach `Authorization: Bearer <accessToken>` on authenticated requests
4. Refresh tokens via portal-specific refresh endpoints when implemented

## Replacing mocks

| Module | Current mock location | Live endpoints |
|--------|----------------------|----------------|
| Admin | `frontend/src/modules/admin/constants/dummyData.js`, `services/api.js` | `/api/v1/admin/*` |
| Seller | `frontend/src/modules/seller/services/axiosInstance.js` (`baseURL: '/api/seller'`) | `/api/v1/seller/*` |
| Customer home | Hardcoded images in vendor home components | `/api/v1/storefront/home`, `/api/v1/catalog/*` |
| Notifications | Admin layout mock notifications | `/api/v1/notifications` |

### Recommended migration order

1. Wire axios/fetch clients with env-based `baseURL`
2. Replace catalog/storefront reads (categories, products, home sections)
3. Connect auth flows and persist tokens
4. Connect cart, checkout, orders
5. Connect seller and admin portals module-by-module

## Response envelope

All API responses use:

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "requestId": "uuid"
}
```

Errors:

```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] },
  "requestId": "uuid"
}
```

## Real-time order tracking

Subscribe to SSE at `GET /api/v1/realtime/orders/:orderId/stream` with customer auth token.

## Search

`GET /api/v1/search?q=<term>&page=1&limit=20`

## OpenAPI

Interactive docs: `http://localhost:3000/api/docs`

## Production checklist

See [PRODUCTION_RUNBOOK.md](./PRODUCTION_RUNBOOK.md) before go-live.
