# 23 — Backend Gap Analysis

## Integration Status by Feature

| Feature | Frontend Status | Backend Needed | Priority |
|---------|----------------|----------------|----------|
| Customer OTP Auth | Mock | Full auth service | P0 |
| Product catalog | Static images + dummy | Product service + search | P0 |
| Cart | localStorage | Cart API + sync | P0 |
| Checkout/Orders | Client-side mock | Order + Payment service | P0 |
| User profile | Zustand seed | User service | P0 |
| Addresses | Zustand seed | Address CRUD API | P0 |
| Wishlist | localStorage partial | Wishlist API | P1 |
| Wallet | UI only | Wallet ledger service | P1 |
| Coupons | Mock data | Coupon engine | P1 |
| Reviews/Q&A | UI only | UGC service | P1 |
| Seller portal | Full UI, mock API | Seller service | P0 |
| Admin panel | Full UI, mock data | Admin service | P0 |
| Delivery app | Full UI, mock data | Delivery service | P1 |
| CMS (banners/sections) | Admin UI | CMS service | P1 |
| Notifications | Mock | Notification service (push/email/SMS) | P2 |
| Reports | Charts with dummy data | Analytics/BI pipeline | P2 |
| RBAC | UI only | AuthZ middleware | P1 |
| File uploads | UI only | S3/storage service | P0 |
| Payment gateway | UI placeholders | Razorpay/Stripe integration | P0 |
| Real-time tracking | Static timeline | WebSocket/SSE + GPS | P2 |
| i18n | 4 locales frontend | Content translation API | P3 |

## API Client Gaps
- No axios instance for customer module
- No request/response interceptors for auth
- No error handling middleware
- No retry logic
- No API versioning
