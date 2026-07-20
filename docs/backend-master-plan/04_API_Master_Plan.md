# 04 — API Master Plan

## API Architecture Overview

| Portal | Base Path | Auth Header | Token Type |
|--------|-----------|-------------|------------|
| Customer | `/api/v1` | `Authorization: Bearer <token>` | JWT (customer) |
| Seller | `/api/v1/seller` | `Authorization: Bearer <token>` | JWT (seller) |
| Admin | `/api/v1/admin` | `Authorization: Bearer <token>` | JWT (admin) |
| Delivery | `/api/v1/delivery` | `Authorization: Bearer <token>` | JWT (delivery) |
| Webhooks | `/api/v1/webhooks` | Signature header | HMAC |
| Uploads | `/api/v1/uploads` | Bearer (any portal) | JWT |

---

## Standards

### Versioning
- URL path versioning: `/api/v1/...`
- Breaking changes → `/api/v2/...` with 6-month deprecation notice
- Version header optional: `X-API-Version: 1`

### Naming Conventions
- Resources: plural nouns (`/products`, `/orders`)
- Actions: verbs on sub-resources (`/orders/:id/cancel`, `/products/:id/approve`)
- Admin prefix: all admin routes under `/api/v1/admin/`
- Seller prefix: all seller routes under `/api/v1/seller/`

### Request Structure
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <jwt>",
  "X-Request-Id": "<uuid>",
  "Accept-Language": "en"
}
```

Query params for lists: `?page=1&limit=20&sort=-createdAt&search=&status=&from=&to=`

### Response Structure (Success)
```json
{
  "success": true,
  "data": { },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "requestId": "uuid"
}
```

### Response Structure (Error)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": [
      { "field": "phone", "message": "Must be 8-11 digits" }
    ]
  },
  "requestId": "uuid"
}
```

### Error Codes
| HTTP | Code | Usage |
|------|------|-------|
| 400 | BAD_REQUEST | Malformed request |
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Duplicate, out of stock |
| 410 | GONE | OTP expired |
| 422 | VALIDATION_ERROR | Field validation failed |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |

### Pagination
- Offset-based: `page` + `limit` (default limit=20, max=100)
- Cursor-based for infinite scroll: `cursor` + `limit`
- Response includes `meta.total`, `meta.totalPages`

### Filtering
- Exact match: `?status=active`
- Range: `?minPrice=100&maxPrice=5000`
- Date range: `?from=2026-01-01&to=2026-07-20`
- Multi-value: `?status=pending,approved`
- Commerce flow: `?commerceFlow=mithilak`

### Searching
- Full-text: `?search=keyword` (uses text index)
- Dedicated: `GET /products/search?q=keyword&filters=...`

### Sorting
- `?sort=createdAt` (asc), `?sort=-createdAt` (desc)
- Multi-sort: `?sort=-rating,price`

### Bulk Operations
- `POST /admin/products/bulk` body: `{ ids: [], action: 'approve'|'reject'|'delete' }`
- Max 100 IDs per bulk request

### Upload APIs
- `POST /uploads/presign` → returns S3 pre-signed POST URL + fields
- `POST /uploads/confirm` → confirms upload, returns CDN URL
- Multipart for admin banners: `POST /admin/banners` with `multipart/form-data`

### Download APIs
- `GET /admin/orders/:id/invoice` → PDF blob
- `GET /admin/users/export` → CSV blob
- `GET /admin/reports/:type/export` → CSV/XLSX blob

---

## Complete Endpoint Catalog

### Customer Auth (6 endpoints)
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | /auth/send-phone-otp | Public |
| POST | /auth/verify-phone-otp | Public |
| POST | /auth/send-email-otp | Public |
| POST | /auth/verify-email-otp | Public |
| POST | /auth/refresh | Refresh token |
| POST | /auth/logout | Bearer |

### User Profile (8 endpoints)
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | /users/me | Customer |
| PUT | /users/me | Customer |
| PUT | /users/me/avatar | Customer |
| GET/POST | /users/me/addresses | Customer |
| PUT/DELETE | /users/me/addresses/:id | Customer |
| PATCH | /users/me/addresses/:id/default | Customer |
| GET/POST/PUT/DELETE | /users/me/cards | Customer |
| GET/PUT | /users/me/notification-preferences | Customer |

### Catalog (8 endpoints)
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | /categories | Public |
| GET | /categories/:id/products | Public |
| GET | /products | Public |
| GET | /products/:id | Public |
| GET | /products/search | Public |
| GET | /storefront/home | Public |
| GET | /storefront/banners | Public |
| GET | /storefront/:flow/home | Public |

### Cart (5 endpoints)
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | /cart | Optional |
| POST | /cart/items | Optional |
| PATCH | /cart/items/:id | Optional |
| DELETE | /cart/items/:id | Optional |
| DELETE | /cart | Optional |

### Orders (6 endpoints)
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | /orders | Customer |
| GET | /orders | Customer |
| GET | /orders/:id | Customer |
| GET | /orders/:id/tracking | Customer |
| POST | /orders/:id/cancel | Customer |
| POST | /orders/:id/returns | Customer |

### Payments (3 endpoints)
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | /payments/initiate | Customer |
| POST | /payments/verify | Customer |
| POST | /webhooks/razorpay | Signature |

### Wallet (2 endpoints)
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | /users/me/wallet | Customer |
| GET | /users/me/wallet/transactions | Customer |

### Wishlist (3 endpoints)
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | /users/me/wishlist | Customer |
| POST | /users/me/wishlist | Customer |
| DELETE | /users/me/wishlist/:productId | Customer |

### Coupons & Deals (4 endpoints)
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | /users/me/coupons | Customer |
| POST | /coupons/validate | Customer |
| GET | /deals | Public |
| GET | /offers | Public |

### Reviews & Q&A (5 endpoints)
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | /products/:id/reviews | Customer |
| GET | /products/:id/reviews | Public |
| GET | /users/me/reviews | Customer |
| POST | /products/:id/questions | Customer |
| GET | /products/:id/questions | Public |

### CMS (2 endpoints)
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | /cms/:slug | Public |
| GET | /cms/legal/:type | Public |

### Notifications (3 endpoints)
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | /notifications | Customer |
| PATCH | /notifications/:id/read | Customer |
| PATCH | /notifications/read-all | Customer |

### Support (2 endpoints)
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | /support/tickets | Customer |
| GET | /support/tickets | Customer |

---

### Seller APIs (42 endpoints — matches sellerApi.js)

| Method | Endpoint |
|--------|----------|
| POST | /seller/auth/login |
| POST | /seller/auth/logout |
| POST | /seller/auth/refresh |
| GET | /seller/dashboard |
| GET | /seller/dashboard/stats |
| GET/POST | /seller/products |
| GET/PUT/DELETE | /seller/products/:id |
| POST | /seller/products/:id/duplicate |
| PATCH | /seller/products/:id/status |
| GET | /seller/orders |
| GET | /seller/orders/:id |
| PATCH | /seller/orders/:id/status |
| GET | /seller/returns |
| PATCH | /seller/returns/:id/approve |
| PATCH | /seller/returns/:id/reject |
| GET | /seller/customers |
| GET | /seller/customers/:id |
| GET | /seller/inventory |
| PATCH | /seller/inventory/:id/stock |
| GET | /seller/inventory/:id/history |
| GET | /seller/reviews |
| POST | /seller/reviews/:id/reply |
| POST | /seller/reviews/:id/report |
| GET/POST | /seller/coupons |
| PUT/DELETE | /seller/coupons/:id |
| GET | /seller/analytics/sales |
| GET | /seller/analytics/revenue |
| GET | /seller/analytics/products |
| GET | /seller/analytics/categories |
| GET | /seller/analytics/customers |
| GET | /seller/earnings |
| GET | /seller/earnings/transactions |
| GET | /seller/earnings/settlements |
| POST | /seller/earnings/payout |
| GET | /seller/notifications |
| PATCH | /seller/notifications/:id/read |
| PATCH | /seller/notifications/read-all |
| GET/PUT | /seller/settings/profile |
| PUT | /seller/settings/bank |
| PUT | /seller/settings/password |
| PUT | /seller/settings/notifications |

---

### Admin APIs (95 endpoints — matches api.js)

**Auth (4):** login, logout, profile, password  
**Dashboard (4):** stats, revenue chart, recent orders, activities  
**Users (10):** CRUD, block, unblock, suspend, orders, wallet, export  
**Sellers (10):** list, detail, approve, reject, suspend, activate, products, orders, earnings, documents  
**Products (6):** list, detail, approve, reject, delete, bulk  
**Orders (4):** list, detail, status, invoice  
**Returns (4):** list, detail, approve, reject  
**Refunds (5):** list, detail, process, approve, reject  
**Coupons (4):** CRUD  
**Banners (4):** CRUD (multipart)  
**Notifications (3):** list, send, templates  
**Reports (7):** sales, sellers, users, orders, inventory, refunds, export  
**Analytics (4):** sales, revenue, users, products  
**Settings (4):** get, update, commission get/update  
**Roles (5):** CRUD, permissions list  
**Audit (2):** logs, login history  
**CMS (2):** get page, update page  
**Categories (4):** CRUD  
**Chips (4):** CRUD  
**Home Sections (3):** list, update, reorder  
**Flash Sales (4):** CRUD  
**Featured (3):** list, add, remove  
**Delivery (6):** list, approve, reject, suspend, detail, add  
**Finance (8):** earnings, payouts, rules CRUD, tax CRUD, delivery charges CRUD  
**Support (4):** list, detail, reply, close  
**Inventory (3):** list, add, alerts  

---

### Delivery APIs (12 endpoints)

| Method | Endpoint |
|--------|----------|
| POST | /delivery/auth/send-otp |
| POST | /delivery/auth/verify-otp |
| POST | /delivery/auth/signup |
| POST | /delivery/auth/logout |
| GET | /delivery/dashboard |
| PATCH | /delivery/status |
| GET | /delivery/orders |
| POST | /delivery/orders/:id/accept |
| POST | /delivery/orders/:id/pickup |
| POST | /delivery/orders/:id/deliver |
| GET | /delivery/earnings |
| PATCH | /delivery/profile |

---

### Shared/Utility APIs (3 endpoints)

| Method | Endpoint |
|--------|----------|
| POST | /uploads/presign |
| POST | /uploads/confirm |
| GET | /health |

---

## API Count Summary

| Portal | Endpoints |
|--------|-----------|
| Customer (public + auth) | ~65 |
| Seller | 42 |
| Admin | 95 |
| Delivery | 12 |
| Shared/Utility | 3 |
| **Total** | **~217** |

---

## Authentication Strategy

| Portal | Method | Token Lifetime |
|--------|--------|----------------|
| Customer | OTP → JWT | Access 15min, Refresh 7d |
| Seller | Email/Password → JWT | Access 15min, Refresh 7d |
| Admin | Email/Password → JWT + permissions[] | Access 15min, Refresh 7d |
| Delivery | Phone OTP → JWT | Access 15min, Refresh 7d |
| Guest Cart | Session cookie | Session duration |

## Authorization Strategy

- Customer: resource ownership (`userId` match)
- Seller: seller scope (`sellerId` from JWT on all queries)
- Admin: RBAC permission check per endpoint
- Delivery: partner scope (`partnerId` from JWT)
- Public: catalog, CMS, search (read-only)
