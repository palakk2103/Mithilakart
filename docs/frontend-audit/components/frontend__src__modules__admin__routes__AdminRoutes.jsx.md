# File Audit: frontend/src/modules/admin/routes/AdminRoutes.jsx

| Property | Value |
|----------|-------|
| Lines | 157 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (49)

- `react`
- `react-router-dom`
- `../layouts/AdminLayout`
- `../pages/Auth`
- `../pages/Dashboard`
- `../products/ProductModeration`
- `../vendors/VendorList`
- `../vendors/VendorApproval`
- `../../vendor/dashboard/Dashboard`
- `../../vendor/inventory/InventoryList`
- `../catalog/CategoryManager`
- `../catalog/BannerManager`
- `../catalog/CategoryChipsManager`
- `../catalog/HomeSectionsManager`
- `../pages/Analytics`
- `../pages/inventory/StockAlerts`
- `../pages/Orders`
- `../pages/AddProduct`
- `../pages/finance/PlatformEarnings`
- `../pages/Payouts`
- `../pages/Rules`
- `../pages/finance/TaxConfig`
- `../pages/finance/DeliveryCharges`
- `../pages/delivery/AllDeliveries`
- `../pages/delivery/DeliveryApproval`
- `../pages/Settings`
- `../pages/Users`
- `../pages/users/CustomerDetail`
- `../pages/system/SubAdmins`
- `../pages/promotions/Coupons`
- `../pages/promotions/FlashSale`
- `../pages/promotions/FeaturedProducts`
- `../pages/comms/Notifications`
- `../pages/content/ReviewModeration`
- `../pages/content/QnAModeration`
- `../pages/content/LegalPolicies`
- `../pages/operations/Returns`
- `../pages/operations/OrderDetail`
- `../pages/operations/Refunds`
- `../pages/support/Tickets`
- `../pages/reports/SalesReport`
- `../pages/reports/SellerReport`
- `../pages/reports/UserReport`
- `../pages/reports/OrderReport`
- `../pages/reports/InventoryReport`
- `../pages/reports/RefundReport`
- `../pages/system/AuditLogs`
- `../pages/system/RoleManagement`
- `../pages/vendors/SellerDetail`

## Routes Defined

| Path | Component |
|------|----------|
| `auth` | Auth |
| `dashboard` | Dashboard |
| `analytics` | Analytics |
| `users` | Users |
| `users/:userId` | CustomerDetail |
| `products/moderation` | ProductModeration |
| `categories` | CategoryManager |
| `storefront/banners` | BannerManager |
| `storefront/chips` | CategoryChipsManager |
| `storefront/sections/:section` | HomeSectionsManager |
| `inventory/all` | InventoryList |
| `inventory/add` | AddProduct |
| `inventory/alerts` | StockAlerts |
| `orders` | Orders |
| `orders/:orderId` | OrderDetail |
| `operations/returns` | Returns |
| `operations/refunds` | Refunds |
| `support/tickets` | Tickets |
| `promotions/coupons` | Coupons |
| `promotions/flash-sale` | FlashSale |
| `promotions/featured` | FeaturedProducts |
| `comms/notifications` | Notifications |
| `content/reviews` | ReviewModeration |
| `content/qna` | QnAModeration |
| `content/legal` | LegalPolicies |
| `vendors/all` | VendorList |
| `vendors/:vendorId` | SellerDetail |
| `vendors/approval` | VendorApproval |
| `delivery/all` | AllDeliveries |
| `delivery/approval` | DeliveryApproval |
| `finance/earnings` | PlatformEarnings |
| `payouts` | Payouts |
| `finance/rules` | Rules |
| `finance/tax` | TaxConfig |
| `finance/delivery-charges` | DeliveryCharges |
| `reports/sales` | SalesReport |
| `reports/sellers` | SellerReport |
| `reports/users` | UserReport |
| `reports/orders` | OrderReport |
| `reports/inventory` | InventoryReport |
| `reports/refunds` | RefundReport |
| `system/sub-admins` | SubAdmins |
| `system/audit-logs` | AuditLogs |
| `system/roles` | RoleManagement |
| `settings` | Settings |
| `` | Navigate |

## localStorage Keys

- `isAdminAuthenticated`

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
