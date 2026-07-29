# 02 — Module Definitions

Each module follows: Purpose → Responsibilities → Business Logic → Dependencies → Data → Layers → Security → Events → Integrations → APIs → Failure/Recovery/Performance.

---

## M01 — Core Platform

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Shared infrastructure bootstrap |
| **Responsibilities** | Config, DB connection, Redis, logging, health checks, global error handling |
| **Dependencies** | None |
| **Collections** | None (uses `system_health` optional) |
| **Controllers** | `HealthController` |
| **Services** | `ConfigService`, `LoggerService` |
| **Middleware** | `requestId`, `errorHandler`, `notFound` |
| **Routes** | `GET /health`, `GET /ready` |
| **Failure Handling** | Graceful shutdown on SIGTERM; connection retry with exponential backoff |

---

## M02 — Customer Auth

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | OTP-based customer authentication |
| **Business Logic** | Send OTP → verify → issue JWT; new user auto-register on first verify; merge guest cart on login |
| **Dependencies** | M01, M12 (Cart merge) |
| **Collections** | `users`, `otp_sessions`, `refresh_tokens`, `user_devices` |
| **Controllers** | `CustomerAuthController` |
| **Services** | `OtpService`, `TokenService`, `CustomerAuthService` |
| **Repositories** | `UserRepository`, `OtpSessionRepository`, `RefreshTokenRepository` |
| **Validators** | `sendPhoneOtpSchema`, `verifyPhoneOtpSchema`, `sendEmailOtpSchema`, `verifyEmailOtpSchema` |
| **Middleware** | `authenticateCustomer`, `optionalAuth` |
| **RBAC** | N/A (customer role implicit) |
| **Events** | `user.registered`, `user.logged_in` |
| **Queues** | `otp-send` (SMS/email dispatch) |
| **Integrations** | MSG91/Twilio (SMS), SendGrid (email OTP) |
| **APIs** | `POST /auth/send-phone-otp`, `POST /auth/verify-phone-otp`, `POST /auth/send-email-otp`, `POST /auth/verify-email-otp`, `POST /auth/refresh`, `POST /auth/logout` |
| **Frontend** | `/login`, `/signup`, `/forgot-password` |
| **Validation Rules** | countryCode `/^\+?\d{1,4}$/`, phone 8–11 digits, email format, OTP 6 digits |
| **Failure** | OTP expired → 410; rate exceeded → 429; invalid OTP → 401 with attempts remaining |
| **Performance** | OTP stored in Redis (5-min TTL); rate limit in Redis sliding window |

---

## M03 — Seller Auth

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Email/password seller authentication |
| **Business Logic** | Login only if seller status=active and kycStatus=approved; lock account after 5 failed attempts (15 min) |
| **Collections** | `sellers`, `refresh_tokens` |
| **Controllers** | `SellerAuthController` |
| **Services** | `SellerAuthService`, `TokenService` |
| **Middleware** | `authenticateSeller`, `requireActiveSeller` |
| **APIs** | `POST /seller/auth/login`, `POST /seller/auth/logout`, `POST /seller/auth/refresh` |
| **Frontend** | `/seller/login` |
| **Validation** | Email format, password min 8 chars |
| **Security** | bcrypt cost 12; sellerId embedded in JWT claims |

---

## M04 — Admin Auth

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Admin/sub-admin authentication with permission payload |
| **Business Logic** | Login returns JWT + permissions[] from role; Super Admin gets `['all']` |
| **Collections** | `admin_users`, `roles`, `refresh_tokens`, `audit_logs` |
| **Controllers** | `AdminAuthController` |
| **Services** | `AdminAuthService`, `PermissionService` |
| **Middleware** | `authenticateAdmin`, `requirePermission(permission)` |
| **APIs** | `POST /admin/auth/login`, `POST /admin/auth/logout`, `GET /admin/auth/profile`, `PUT /admin/auth/password` |
| **Frontend** | `/admin/auth` |
| **Audit** | Log all login attempts (success/failure) |
| **Sensitive Ops** | Password change requires current password verification |

---

## M05 — Delivery Auth

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Phone OTP auth for delivery partners |
| **Business Logic** | Signup creates pending partner; login only if status=approved |
| **Collections** | `delivery_partners`, `otp_sessions`, `refresh_tokens` |
| **Controllers** | `DeliveryAuthController` |
| **Services** | `DeliveryAuthService`, `OtpService` |
| **Middleware** | `authenticateDelivery`, `requireApprovedPartner` |
| **APIs** | `POST /delivery/auth/send-otp`, `POST /delivery/auth/verify-otp`, `POST /delivery/auth/signup`, `POST /delivery/auth/logout` |
| **Frontend** | `/delivery/auth`, `/delivery/signup` |
| **Validation** | 10-digit Indian mobile, vehicle type enum, required docs on signup |

---

## M06 — User Profile

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Customer profile management |
| **Business Logic** | Profile update; avatar upload; notification preferences |
| **Collections** | `users`, `notification_preferences` |
| **Controllers** | `UserProfileController` |
| **Services** | `UserProfileService` |
| **Repositories** | `UserRepository` |
| **APIs** | `GET /users/me`, `PUT /users/me`, `PUT /users/me/avatar`, `GET/PUT /users/me/notification-preferences` |
| **Frontend** | `/profile`, `/profile/edit`, `/profile/notifications` |
| **File Storage** | Avatar → S3 `avatars/{userId}/` |
| **Events** | `user.profile_updated` |

---

## M07 — Address Management

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | CRUD for delivery addresses |
| **Business Logic** | Max 10 addresses; one default; pincode validation (6-digit); geocode optional |
| **Collections** | `user_addresses` |
| **Controllers** | `AddressController` |
| **Services** | `AddressService` |
| **APIs** | `GET/POST /users/me/addresses`, `PUT/DELETE /users/me/addresses/:id`, `PATCH /users/me/addresses/:id/default` |
| **Frontend** | `/profile/addresses`, `/cart` (address modal), `/checkout` step 1 |
| **Validation** | type enum HOME/WORK/OTHER, pincode 6 digits, phone 10 digits |
| **Transactions** | Set default: unset previous default + set new in single transaction |

---

## M08 — Payment Methods

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Saved card/UPI token management |
| **Business Logic** | Tokenize via payment gateway; never store raw card numbers; max 5 methods |
| **Collections** | `user_payment_methods` |
| **Controllers** | `PaymentMethodController` |
| **Services** | `PaymentMethodService` |
| **APIs** | `GET/POST /users/me/cards`, `PUT/DELETE /users/me/cards/:id`, `PATCH /users/me/cards/:id/default` |
| **Frontend** | `/profile/cards`, `/checkout` step 3 |
| **Integrations** | Razorpay tokenization API |
| **Security** | PCI-DSS via gateway; store only gatewayToken + last4 |

---

## M09 — Catalog (Categories & Products)

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Product catalog with categories, variants, commerce flows |
| **Business Logic** | Products require moderation approval; variants inherit parent category; soft delete; commerceFlow[] tagging |
| **Collections** | `categories`, `products`, `product_variants`, `product_images` |
| **Controllers** | `CategoryController`, `ProductController` |
| **Services** | `CategoryService`, `ProductService`, `VariantService` |
| **Repositories** | `CategoryRepository`, `ProductRepository` |
| **APIs (Customer)** | `GET /categories`, `GET /categories/:id/products`, `GET /products`, `GET /products/:id`, `GET /products/search` |
| **APIs (Admin)** | CRUD categories; moderation approve/reject; bulk actions |
| **Frontend** | All browsing routes, `/product-detail`, admin categories/moderation |
| **Indexes** | `{ categoryId, status }`, `{ sellerId, status }`, text index on title+description |
| **Events** | `product.created`, `product.approved`, `product.updated` → search index sync |
| **Caching** | Categories: Redis 1hr; Product detail: Redis 5min |
| **Performance** | Cursor-based pagination; projection for list views |

---

## M10 — CMS (Storefront Content)

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Banners, category chips, home sections, legal pages |
| **Business Logic** | Section keys: `still-looking`, `top-selection`, `spotlight`, `best-quality`, `keep-shopping`; banner scheduling with start/end dates |
| **Collections** | `banners`, `category_chips`, `home_sections`, `legal_pages`, `cms_pages` |
| **Controllers** | `BannerController`, `ChipController`, `HomeSectionController`, `LegalController` |
| **Services** | `CmsService`, `HomeSectionService` |
| **APIs (Customer)** | `GET /storefront/home`, `GET /storefront/banners`, `GET /cms/:slug` |
| **APIs (Admin)** | CRUD banners/chips/sections; `PUT /admin/cms/:slug` |
| **Frontend** | `/home`, admin storefront routes, legal pages |
| **File Storage** | Banner/chip images → S3 `cms/` |
| **Caching** | Home sections: Redis 15min |

---

## M11 — Cart

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Server-side shopping cart |
| **Business Logic** | Guest cart via sessionId cookie; merge on login; validate stock on add/update; recalculate totals |
| **Collections** | `carts`, `cart_items` |
| **Controllers** | `CartController` |
| **Services** | `CartService`, `CartMergeService` |
| **APIs** | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id`, `DELETE /cart` |
| **Frontend** | `/cart`, `/bag`, VendorLayout cart badge |
| **Events** | `cart.updated` |
| **Performance** | Cart in Redis for active sessions; persist to MongoDB on checkout |
| **Failure** | Out of stock on add → 409 with available quantity |

---

## M12 — Orders

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Order lifecycle management |
| **Business Logic** | Status machine: `pending → confirmed → packed → shipped → out_for_delivery → delivered → cancelled`; multi-seller order splits into sub-orders per seller |
| **Collections** | `orders`, `order_items`, `order_tracking`, `order_status_history` |
| **Controllers** | `OrderController` (customer), `AdminOrderController`, `SellerOrderController` |
| **Services** | `OrderService`, `OrderStatusService`, `OrderSplitService` |
| **APIs (Customer)** | `POST /orders`, `GET /orders`, `GET /orders/:id`, `GET /orders/:id/tracking`, `POST /orders/:id/cancel` |
| **APIs (Seller)** | `GET /seller/orders`, `GET /seller/orders/:id`, `PATCH /seller/orders/:id/status` |
| **APIs (Admin)** | `GET /admin/orders`, `PATCH /admin/orders/:id/status`, `GET /admin/orders/:id/invoice` |
| **Frontend** | Checkout, profile orders, seller orders, admin orders, delivery orders |
| **Transactions** | Order creation + inventory deduction + payment initiation in MongoDB transaction |
| **Events** | `order.placed`, `order.status_changed`, `order.cancelled`, `order.delivered` |
| **Scheduled Jobs** | Auto-cancel unpaid orders after 30min; auto-complete delivered after 7 days |
| **Notifications** | Status change → push/SMS to customer |

---

## M13 — Payments

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Payment processing and verification |
| **Business Logic** | Initiate → redirect/UPI deeplink → webhook verify → update order paymentStatus; COD skips gateway; Wallet debit internal |
| **Collections** | `payment_transactions`, `payment_webhooks` |
| **Controllers** | `PaymentController` |
| **Services** | `PaymentService`, `WebhookService`, `WalletPaymentService` |
| **APIs** | `POST /payments/initiate`, `POST /payments/verify`, `POST /webhooks/razorpay` |
| **Frontend** | `/checkout` step 3 |
| **Integrations** | Razorpay (UPI: Paytm/PhonePe/GPay, Cards, COD flag) |
| **Security** | Webhook signature verification; idempotency key on initiate |
| **Failure** | Payment failed → order stays pending; retry allowed; webhook retry with dedup |

---

## M14 — Wallet

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Internal wallet ledger |
| **Business Logic** | Double-entry ledger; credit from refunds/promotions; debit at checkout; balance never negative |
| **Collections** | `wallets`, `wallet_transactions` |
| **Controllers** | `WalletController` |
| **Services** | `WalletService`, `WalletLedgerService` |
| **APIs** | `GET /users/me/wallet`, `GET /users/me/wallet/transactions` |
| **Frontend** | `/wallet`, `/checkout` (wallet payment), admin user wallet view |
| **Transactions** | All wallet ops in MongoDB transaction with balance check |
| **Audit** | Every transaction logged with reference (orderId/refundId) |

---

## M15 — Coupons & Promotions

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Discount engine — coupons, flash sales, featured products |
| **Business Logic** | Coupon types: percent/fixed; min order, max discount, usage limit; seller-scoped or platform; flash sale time-window pricing |
| **Collections** | `coupons`, `coupon_usages`, `flash_sales`, `flash_sale_products`, `featured_products` |
| **Controllers** | `CouponController`, `PromotionController` |
| **Services** | `CouponValidationService`, `FlashSaleService`, `PricingService` |
| **APIs (Customer)** | `GET /users/me/coupons`, `POST /coupons/validate`, `GET /deals`, `GET /offers` |
| **APIs (Seller)** | CRUD `/seller/coupons` |
| **APIs (Admin)** | CRUD `/admin/coupons`, `/admin/promotions/flash-sale`, `/admin/promotions/featured` |
| **Frontend** | `/profile/coupons`, `/deals`, `/all-offers`, checkout, seller/admin coupon pages |
| **Scheduled Jobs** | Activate/deactivate flash sales on schedule |

---

## M16 — Wishlist

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Saved products per user |
| **Collections** | `wishlists` |
| **Controllers** | `WishlistController` |
| **Services** | `WishlistService` |
| **APIs** | `GET /users/me/wishlist`, `POST /users/me/wishlist`, `DELETE /users/me/wishlist/:productId` |
| **Frontend** | `/wishlist`, `/profile/wishlist`, ProductDetail heart icon |
| **Performance** | Max 200 items; paginated list |

---

## M17 — Reviews

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Product reviews with moderation |
| **Business Logic** | Verified purchase required; 1 review per product per order; moderation queue; seller reply |
| **Collections** | `reviews` |
| **Controllers** | `ReviewController` |
| **Services** | `ReviewService`, `ReviewModerationService` |
| **APIs (Customer)** | `POST /products/:id/reviews`, `GET /users/me/reviews` |
| **APIs (Seller)** | `GET /seller/reviews`, `POST /seller/reviews/:id/reply`, `POST /seller/reviews/:id/report` |
| **APIs (Admin)** | `GET /admin/content/reviews`, approve/reject/hide |
| **Frontend** | ProductDetail, profile reviews, seller reviews, admin moderation |
| **Security** | XSS sanitize review body; image upload scan |
| **Events** | `review.submitted` → update product rating aggregate |

---

## M18 — Q&A

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Product questions and answers |
| **Business Logic** | Customer asks; seller or admin answers; moderation for public display |
| **Collections** | `product_qna` |
| **Controllers** | `QnaController` |
| **Services** | `QnaService` |
| **APIs** | `POST /products/:id/questions`, `GET /products/:id/questions`, `POST /questions/:id/answer` |
| **Frontend** | ProductDetail, `/profile/questions`, admin Q&A moderation |

---

## M19 — Seller Dashboard & Analytics

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Seller KPIs and analytics |
| **Collections** | Reads from `orders`, `order_items`, `products`, `reviews` |
| **Controllers** | `SellerDashboardController`, `SellerAnalyticsController` |
| **Services** | `SellerDashboardService`, `SellerAnalyticsService` |
| **APIs** | `GET /seller/dashboard`, `GET /seller/dashboard/stats`, `GET /seller/analytics/sales`, `/revenue`, `/products`, `/categories`, `/customers` |
| **Frontend** | `/seller/dashboard`, `/seller/analytics` |
| **Performance** | Pre-aggregated daily stats; cache 5min |
| **Scheduled Jobs** | Nightly seller stats aggregation |

---

## M20 — Seller Inventory

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Stock management with history |
| **Business Logic** | Stock update logs reason (manual, order, return); low stock alerts at threshold |
| **Collections** | `inventory_history`, `stock_alerts` |
| **Controllers** | `SellerInventoryController`, `AdminInventoryController` |
| **Services** | `InventoryService`, `StockAlertService` |
| **APIs (Seller)** | `GET /seller/inventory`, `PATCH /seller/inventory/:id/stock`, `GET /seller/inventory/:id/history` |
| **APIs (Admin)** | `GET /admin/inventory/all`, `POST /admin/inventory/add`, `GET /admin/inventory/alerts` |
| **Frontend** | `/seller/inventory`, admin inventory routes |
| **Events** | `inventory.low_stock` → alert notification |

---

## M21 — Seller Earnings & Payouts

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Seller financial ledger and payout requests |
| **Business Logic** | Earning = order item total - commission; settlement cycles; payout request with min threshold |
| **Collections** | `seller_earnings`, `seller_payouts`, `seller_settlements` |
| **Controllers** | `SellerEarningsController`, `AdminPayoutController` |
| **Services** | `EarningsService`, `PayoutService`, `CommissionService` |
| **APIs (Seller)** | `GET /seller/earnings`, `/earnings/transactions`, `/earnings/settlements`, `POST /seller/earnings/payout` |
| **APIs (Admin)** | `GET /admin/payouts`, `PATCH /admin/payouts/:id/process` |
| **Frontend** | `/seller/earnings`, `/admin/payouts`, `/admin/finance/earnings` |
| **Sensitive Ops** | Payout processing requires `finance.payout` permission + audit log |
| **Transactions** | Payout debit from seller balance atomically |

---

## M22 — Seller Settings

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Seller profile, bank, password, notification prefs |
| **Collections** | `sellers`, `seller_documents` |
| **Controllers** | `SellerSettingsController` |
| **Services** | `SellerSettingsService` |
| **APIs** | `GET/PUT /seller/settings/profile`, `/bank`, `/password`, `/notifications` |
| **Frontend** | `/seller/settings` |
| **Validation** | GSTIN, PAN, IFSC formats per seller validators |

---

## M23 — Seller Customers

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | List customers who ordered from seller |
| **Collections** | Aggregated from `order_items` + `users` |
| **APIs** | `GET /seller/customers`, `GET /seller/customers/:id` |
| **Frontend** | `/seller/customers` |
| **Security** | Only customers with orders from this seller; no PII beyond name/email/phone |

---

## M24 — Delivery Operations

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Order pickup, delivery, earnings |
| **Business Logic** | Partner goes online → sees available orders → accept → navigate → pickup OTP → delivery OTP → earning credited |
| **Collections** | `delivery_partners`, `delivery_assignments`, `delivery_earnings`, `delivery_locations` |
| **Controllers** | `DeliveryOrderController`, `DeliveryProfileController`, `DeliveryEarningsController` |
| **Services** | `AssignmentService`, `DeliveryOtpService`, `DeliveryEarningsService` |
| **APIs** | `GET /delivery/orders`, `POST /delivery/orders/:id/accept`, `/pickup`, `/deliver`, `GET /delivery/earnings`, `PATCH /delivery/profile`, `PATCH /delivery/status` |
| **Frontend** | All `/delivery/*` routes |
| **Security** | Pickup/delivery OTP: crypto-random 4-digit, single-use, 10-min expiry |
| **Events** | `delivery.completed` → credit earning, update order status |

---

## M25 — Returns & Refunds

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Return request and refund processing |
| **Business Logic** | Customer initiates → seller reviews → admin approves refund → wallet or source refund |
| **Collections** | `returns`, `refunds` |
| **Controllers** | `ReturnController`, `RefundController` |
| **Services** | `ReturnService`, `RefundService` |
| **APIs (Customer)** | `POST /orders/:id/returns` |
| **APIs (Seller)** | `GET /seller/returns`, `PATCH approve/reject` |
| **APIs (Admin)** | `GET /admin/returns`, `/admin/refunds`, process/approve/reject |
| **Frontend** | Order detail return, seller returns, admin operations |
| **File Storage** | Return images → S3 `returns/{returnId}/` |
| **Transactions** | Refund approval + wallet credit + order item status in single transaction |

---

## M26 — Admin User Management

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Customer user CRUD, block, suspend |
| **Collections** | `users` |
| **Controllers** | `AdminUserController` |
| **Services** | `AdminUserService` |
| **APIs** | Full CRUD per `usersApi` in api.js including block/unblock/suspend/export |
| **Frontend** | `/admin/users`, `/admin/users/:userId` |
| **RBAC** | `users.view`, `users.edit`, `users.block`, `users.delete` |
| **Audit** | All user status changes logged |

---

## M27 — Admin Vendor Management

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Seller onboarding, KYC, approval |
| **Collections** | `sellers`, `seller_documents` |
| **Controllers** | `AdminVendorController` |
| **Services** | `VendorApprovalService`, `KycService` |
| **APIs** | Per `sellersApi`: list, approve, reject, suspend, documents, earnings |
| **Frontend** | `/admin/vendors/all`, `/approval`, `/:vendorId` |
| **RBAC** | `sellers.view`, `sellers.approve`, `sellers.suspend` |
| **Sensitive Ops** | KYC approval requires `sellers.approve` + audit |

---

## M28 — Admin Finance

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Commission rules, tax, delivery charges, platform earnings |
| **Collections** | `commission_rules`, `tax_configs`, `delivery_charge_rules`, `platform_earnings` |
| **Controllers** | `AdminFinanceController` |
| **Services** | `CommissionService`, `TaxService`, `DeliveryChargeService` |
| **APIs** | Settings commission, tax CRUD, delivery charge rules, platform earnings dashboard |
| **Frontend** | `/admin/finance/*`, `/admin/payouts` |
| **RBAC** | `finance.view`, `finance.edit`, `finance.payout` |

---

## M29 — Admin Reports & Analytics

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Business intelligence and exportable reports |
| **Collections** | `report_snapshots` (pre-aggregated) |
| **Controllers** | `AdminReportController`, `AdminAnalyticsController` |
| **Services** | `ReportService`, `AnalyticsService`, `ExportService` |
| **APIs** | Per `reportsApi` and `analyticsApi`; export as blob |
| **Frontend** | `/admin/reports/*`, `/admin/analytics`, `/admin/dashboard` |
| **Scheduled Jobs** | Nightly report snapshot generation |
| **Performance** | Read from snapshots; live queries for dashboard with 5min cache |

---

## M30 — Admin RBAC & Audit

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Role/permission management, sub-admins, audit trail |
| **Collections** | `roles`, `admin_users`, `audit_logs`, `login_history` |
| **Controllers** | `RoleController`, `SubAdminController`, `AuditController` |
| **Services** | `RoleService`, `AuditService` |
| **APIs** | Per `rolesApi`, `auditApi`; sub-admin CRUD |
| **Frontend** | `/admin/system/roles`, `/sub-admins`, `/audit-logs` |
| **RBAC** | `system.admins`, `system.roles`, `system.audit` |
| **Audit** | Immutable audit_logs; 90-day online retention, archive to cold storage |

---

## M31 — Support Tickets

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Customer support ticket system |
| **Collections** | `support_tickets`, `ticket_messages` |
| **Controllers** | `SupportTicketController` |
| **Services** | `TicketService` |
| **APIs** | `GET/POST /admin/support/tickets`, reply, close, assign |
| **Frontend** | `/admin/support/tickets`, `/profile/help-center` |
| **RBAC** | `tickets.view`, `tickets.edit`, `tickets.close` |
| **Notifications** | New ticket → notify support agents |

---

## M32 — Notifications

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Multi-channel notification delivery |
| **Collections** | `notifications`, `notification_templates`, `notification_preferences`, `device_tokens` |
| **Controllers** | `NotificationController` |
| **Services** | `NotificationService`, `TemplateService`, `PushService`, `SmsService`, `EmailService` |
| **APIs** | Portal-specific notification feeds; admin broadcast; mark read |
| **Frontend** | All portal notification pages, admin comms |
| **Queues** | `notification-send`, `notification-broadcast` |
| **Integrations** | FCM, MSG91, SendGrid |
| **i18n** | Templates per locale (en, hi, bn, mai) |

---

## M33 — Search Service

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Full-text product search with filters |
| **Business Logic** | Index on product CRUD; filters: category, price range, rating, brand, commerceFlow |
| **Collections** | `search_index` (or Atlas Search on products) |
| **Services** | `SearchService`, `SearchIndexSyncService` |
| **APIs** | `GET /products/search?q=&category=&minPrice=&maxPrice=&rating=&sort=&page=` |
| **Frontend** | `/search`, `/category-products` filter drawer, admin global search |
| **Performance** | Results cached 2min; debounced queries |
| **Events** | `product.*` → reindex job |

---

## M34 — File Storage

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Centralized file upload/management |
| **Services** | `UploadService`, `ImageProcessingService` |
| **Integrations** | AWS S3 + CloudFront |
| **Security** | MIME whitelist (jpg,png,webp,pdf); max 5MB images, 10MB docs; virus scan via ClamAV optional |
| **APIs** | `POST /uploads/presign`, `POST /uploads/confirm` |
| **Scheduled Jobs** | Orphan file cleanup (unreferenced after 24hr) |

---

## M35 — Commerce Flow Engine

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Multi-brand storefront logic (You Buy, Mithilak, Quick Shop, Fresh Grocery) |
| **Business Logic** | Filter products/categories/banners by commerceFlow; checkout theming is frontend-only |
| **Collections** | `commerce_flows` (config), tags on products/categories/banners |
| **APIs** | `GET /storefront/:flow/home`, `GET /storefront/:flow/categories` |
| **Frontend** | `/mithilak`, `/quick-shop`, `/fresh-grocery` and category subroutes |

---

## Module Dependency Summary

```
M01 → all modules
M02–M05 (Auth) → all authenticated modules
M09 (Catalog) → M11, M12, M16, M17, M18, M33
M11 (Cart) → M12
M12 (Orders) → M13, M14, M21, M24, M25
M13 (Payments) → M14
M04 (Admin Auth) + M30 (RBAC) → all admin modules
M32 (Notifications) → triggered by M12, M25, M31 events
M34 (File Storage) → M09, M10, M17, M25, M06
```
