# 19 — API Requirements

## API Base URLs (Recommended)

| Service | Base Path |
|---------|-----------|
| Customer API | /api/v1 |
| Seller API | /api/v1/seller |
| Admin API | /api/v1/admin |
| Delivery API | /api/v1/delivery |

## Authentication APIs

| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | /auth/send-phone-otp | { countryCode, phone } | { success, expiresIn } |
| POST | /auth/verify-phone-otp | { countryCode, phone, otp } | { token, refreshToken, user } |
| POST | /auth/send-email-otp | { email } | { success, expiresIn } |
| POST | /auth/verify-email-otp | { email, otp } | { token, refreshToken, user } |
| POST | /auth/refresh | { refreshToken } | { token, refreshToken } |
| POST | /auth/logout | — | { success } |
| POST | /seller/auth/login | { email, password } | { token, seller } |
| POST | /admin/auth/login | { email, password } | { token, admin, permissions } |
| POST | /delivery/auth/login | { phone, otp } | { token, partner } |

## Product APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /products | List with pagination, filters, search |
| GET | /products/:id | Product detail with variants, reviews |
| GET | /products/search | Full-text search |
| GET | /categories | Category tree |
| GET | /categories/:id/products | Category products |

## Cart & Order APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /cart | Get user cart |
| POST | /cart/items | Add item |
| PATCH | /cart/items/:id | Update quantity |
| DELETE | /cart/items/:id | Remove item |
| POST | /orders | Place order |
| GET | /orders | User order list |
| GET | /orders/:id | Order detail + tracking |
| POST | /orders/:id/cancel | Cancel order |
| POST | /orders/:id/returns | Initiate return |

## User Profile APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /users/me | Profile |
| PUT | /users/me | Update profile |
| CRUD | /users/me/addresses | Address management |
| CRUD | /users/me/cards | Saved payment methods |
| GET | /users/me/wishlist | Wishlist |
| POST | /users/me/wishlist | Add to wishlist |
| DELETE | /users/me/wishlist/:id | Remove |
| GET | /users/me/coupons | Available coupons |
| GET | /users/me/wallet | Wallet balance & transactions |

## Seller APIs (from sellerApi.js)

Complete list of 40+ stubbed endpoints — see [27_TODOs.md](./27_TODOs.md)

## Admin APIs

| Domain | Endpoints |
|--------|-----------|
| Users | GET/PUT/DELETE /admin/users, block, unblock |
| Vendors | GET/POST /admin/vendors, approve, suspend, KYC review |
| Products | GET /admin/products/moderation, approve, reject |
| Orders | GET /admin/orders, update status, assign delivery |
| Returns | GET /admin/returns, approve, reject |
| Refunds | GET /admin/refunds, process, reject |
| CMS | CRUD /admin/banners, /admin/chips, /admin/sections |
| Promotions | CRUD /admin/coupons, /admin/flash-sales |
| Finance | GET /admin/earnings, POST /admin/payouts, tax config |
| Reports | GET /admin/reports/{type}?range= |
| System | CRUD /admin/roles, /admin/sub-admins, GET /admin/audit-logs |
| Notifications | POST /admin/notifications/broadcast |

## Delivery APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /delivery/orders | Available & active orders |
| POST | /delivery/orders/:id/accept | Accept order |
| POST | /delivery/orders/:id/pickup | Confirm pickup |
| POST | /delivery/orders/:id/deliver | OTP-verified delivery |
| GET | /delivery/earnings | Earnings summary |
| PATCH | /delivery/profile | Update profile |

## Payment Integration (Placeholder in Checkout)

- UPI: Paytm, PhonePe, GPay redirect/deeplink
- Card: Tokenized via payment gateway
- COD: Cash on delivery flag
- Wallet: Internal wallet debit

Required: POST /payments/initiate, POST /payments/verify (webhook)
