# 04 — Routes


## Application Root (App.jsx)

| Mount Path | Module | Router File |
|------------|--------|-------------|
| `/*` | Customer Marketplace | MarketRoutes.jsx |
| `/vendor/*` | Customer Marketplace (alias) | MarketRoutes.jsx |
| `/seller/*` | Seller Portal | seller/SellerRoutes.jsx |
| `/admin/*` | Admin Panel | admin/AdminRoutes.jsx |
| `/delivery/*` | Delivery Agent Portal | delivery/DeliveryRoutes.jsx |

---

## Customer Marketplace Routes (MarketRoutes.jsx)

### Public — No VendorLayout

| Route | Component | Access | Layout |
|-------|-----------|--------|--------|
| `/login` | Login | Public | None |
| `/signup` | Signup | Public | None |
| `/forgot-password` | ForgotPassword | Public | None |
| `/checkout` | Checkout | Auth required (localStorage) | None |
| `/terms` | TermsOfUse | Public | None |
| `/privacy` | PrivacyPolicy | Public | None |
| `/cancellation-returns` | CancellationReturns | Public | None |
| `/shipping` | ShippingPolicy | Public | None |

### Protected by VendorLayout

| Route | Component | Params |
|-------|-----------|--------|
| `/home` | Home | — |
| `/products` | Products | — |
| `/product-detail` | ProductDetail | — |
| `/cart` | Cart | — |
| `/bag` | Bag | — |
| `/wishlist` | Wishlist | — |
| `/profile` | Profile | — |
| `/profile/edit` | EditProfile | — |
| `/profile/orders` | MyOrders | — |
| `/profile/orders/:orderId` | OrderDetail | orderId |
| `/profile/wishlist` | Wishlist | — |
| `/profile/coupons` | Coupons | — |
| `/profile/help-center` | HelpCenter | — |
| `/profile/addresses` | SavedAddresses | — |
| `/profile/cards` | SavedCards | — |
| `/profile/notifications` | NotificationSettings | — |
| `/profile/reviews` | MyReviews | — |
| `/profile/questions` | QuestionsAnswers | — |
| `/wallet` | Wallet | — |
| `/menu` | Menu | — |
| `/deals` | DealsPage | — |
| `/search` | Search | — |
| `/category-products` | CategoryProducts | — |
| `/categories` | Categories | — |
| `/toys` | ToysLanding | — |
| `/beauty` | BeautyLanding | — |
| `/continue-shopping/:productId` | ContinueShopping | productId |
| `/all-offers` | AllOffers | — |
| `/quick-shop` | QuickShop | — |
| `/quick-shop/category` | QuickShopSubcategory | — |
| `/mithilak` | Mithilak | — |
| `/mithilak/category` | QuickShopSubcategory | — |
| `/fresh-grocery` | QuickShop | — |
| `/fresh-grocery/category` | QuickShopSubcategory | — |
| `/` | Navigate → home | — |

**Note:** VendorRoutes.jsx is a legacy duplicate of MarketRoutes without forgot-password and quick-shop/mithilak/fresh-grocery routes. Not mounted in App.jsx.

---

## Seller Portal Routes (`/seller/*`)

| Route | Component | Access | Layout |
|-------|-----------|--------|--------|
| `/seller/login` | SellerLogin | Public | None |
| `/seller/dashboard` | Dashboard | ProtectedRoute | SellerLayout |
| `/seller/products` | ProductList | Protected | SellerLayout |
| `/seller/products/add` | AddProduct | Protected | SellerLayout |
| `/seller/products/edit/:id` | AddProduct | Protected | SellerLayout |
| `/seller/orders` | OrderList | Protected | SellerLayout |
| `/seller/orders/:id` | OrderDetail | Protected | SellerLayout |
| `/seller/returns` | ReturnList | Protected | SellerLayout |
| `/seller/customers` | CustomerList | Protected | SellerLayout |
| `/seller/inventory` | InventoryManager | Protected | SellerLayout |
| `/seller/reviews` | ReviewList | Protected | SellerLayout |
| `/seller/coupons` | CouponList | Protected | SellerLayout |
| `/seller/analytics` | Analytics | Protected | SellerLayout |
| `/seller/earnings` | Earnings | Protected | SellerLayout |
| `/seller/notifications` | Notifications | Protected | SellerLayout |
| `/seller/settings` | SettingsPage | Protected | SellerLayout |

**Auth:** SellerAuthContext + ProtectedRoute. Lazy-loaded pages with Suspense.

---

## Admin Panel Routes (`/admin/*`)

| Route | Component | Access |
|-------|-----------|--------|
| `/admin/auth` | Auth | Public |
| `/admin/dashboard` | Dashboard | AdminProtectedRoute |
| `/admin/analytics` | Analytics | Protected |
| `/admin/users` | Users | Protected |
| `/admin/users/:userId` | CustomerDetail | Protected |
| `/admin/products/moderation` | ProductModeration | Protected |
| `/admin/categories` | CategoryManager | Protected |
| `/admin/storefront/banners` | BannerManager | Protected |
| `/admin/storefront/chips` | CategoryChipsManager | Protected |
| `/admin/storefront/sections/:section` | HomeSectionsManager | Protected |
| `/admin/inventory/all` | InventoryList (vendor) | Protected |
| `/admin/inventory/add` | AddProduct | Protected |
| `/admin/inventory/alerts` | StockAlerts | Protected |
| `/admin/orders` | Orders | Protected |
| `/admin/orders/:orderId` | OrderDetail | Protected |
| `/admin/operations/returns` | Returns | Protected |
| `/admin/operations/refunds` | Refunds | Protected |
| `/admin/support/tickets` | Tickets | Protected |
| `/admin/promotions/coupons` | Coupons | Protected |
| `/admin/promotions/flash-sale` | FlashSale | Protected |
| `/admin/promotions/featured` | FeaturedProducts | Protected |
| `/admin/comms/notifications` | Notifications | Protected |
| `/admin/content/reviews` | ReviewModeration | Protected |
| `/admin/content/qna` | QnAModeration | Protected |
| `/admin/content/legal` | LegalPolicies | Protected |
| `/admin/vendors/all` | VendorList | Protected |
| `/admin/vendors/:vendorId` | SellerDetail | Protected |
| `/admin/vendors/approval` | VendorApproval | Protected |
| `/admin/delivery/all` | AllDeliveries | Protected |
| `/admin/delivery/approval` | DeliveryApproval | Protected |
| `/admin/finance/earnings` | PlatformEarnings | Protected |
| `/admin/payouts` | Payouts | Protected |
| `/admin/finance/rules` | Rules | Protected |
| `/admin/finance/tax` | TaxConfig | Protected |
| `/admin/finance/delivery-charges` | DeliveryCharges | Protected |
| `/admin/reports/sales` | SalesReport | Protected |
| `/admin/reports/sellers` | SellerReport | Protected |
| `/admin/reports/users` | UserReport | Protected |
| `/admin/reports/orders` | OrderReport | Protected |
| `/admin/reports/inventory` | InventoryReport | Protected |
| `/admin/reports/refunds` | RefundReport | Protected |
| `/admin/system/sub-admins` | SubAdmins | Protected |
| `/admin/system/audit-logs` | AuditLogs | Protected |
| `/admin/system/roles` | RoleManagement | Protected |
| `/admin/settings` | Settings | Protected |

**Auth:** `localStorage.isAdminAuthenticated === 'true'`

---

## Delivery Agent Routes (`/delivery/*`)

| Route | Component | Access |
|-------|-----------|--------|
| `/delivery/auth` | DeliveryAuth | Public |
| `/delivery/signup` | DeliverySignup | Public |
| `/delivery/dashboard` | DeliveryDashboard | DeliveryProtectedRoute |
| `/delivery/orders` | DeliveryOrders | Protected |
| `/delivery/orders/:orderId` | DeliveryOrderDetail | Protected |
| `/delivery/earnings` | DeliveryEarnings | Protected |
| `/delivery/profile` | DeliveryProfile | Protected |
| `/delivery/profile/edit` | PersonalInfo | Protected |
| `/delivery/settings` | Settings | Protected |
| `/delivery/support` | Support | Protected |
| `/delivery/about` | About | Protected |

**Auth:** `localStorage.isDeliveryAuthenticated === 'true'`

---

## Legacy Vendor Module Routes (modules/vendor — partially used)

Admin reuses `vendor/dashboard/Dashboard` and `vendor/inventory/InventoryList` inside admin routes.
Standalone `modules/vendor/routes/SellerRoutes.jsx` exists but is NOT mounted in App.jsx.


## Per-Route Documentation

Detailed per-route audits are in [routes/](./routes/) directory.

## Route Guard Summary

| Guard | Mechanism | Redirect Target |
|-------|-----------|-----------------|
| AdminProtectedRoute | localStorage.isAdminAuthenticated | /admin/auth |
| DeliveryProtectedRoute | localStorage.isDeliveryAuthenticated | /delivery/auth |
| ProtectedRoute (seller) | SellerAuthContext.isAuthenticated | /seller/login |
| Checkout auth | localStorage.isAuthenticated | /login |
| Seller fallback | * wildcard | /seller/login |

## Customer Route Access Notes

- **No global auth guard** on marketplace routes — most pages are public
- Profile, orders, wallet assume logged-in user but do not enforce redirect
- Checkout enforces `isAuthenticated` client-side only

## Dynamic Route Parameters

| Param | Routes | Expected Backend Entity |
|-------|--------|------------------------|
| orderId | /profile/orders/:orderId, /admin/orders/:orderId, /delivery/orders/:orderId | Order |
| productId | /continue-shopping/:productId | Product |
| id | /seller/products/edit/:id, /seller/orders/:id | Product / Order |
| userId | /admin/users/:userId | User/Customer |
| vendorId | /admin/vendors/:vendorId | Seller/Vendor |
| section | /admin/storefront/sections/:section | CMS Home Section |

## Flow Flags (localStorage — affect routing UX)

| Key | Values | Effect |
|-----|--------|--------|
| isMithilakFlow | true/false | Mithilak branding on checkout |
| isQuickShopFlow | true/false | Quick Shop branding |
| isFreshGroceryFlow | true/false | Fresh Grocery branding |
