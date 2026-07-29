#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'docs', 'frontend-audit', 'routes', 'detailed');
fs.mkdirSync(OUT, { recursive: true });

const ROUTES = [
  // Customer Marketplace
  { path: '/login', module: 'customer', layout: 'None', access: 'Public', component: 'Login.jsx', purpose: 'OTP-based authentication via phone or email' },
  { path: '/signup', module: 'customer', layout: 'None', access: 'Public', component: 'Signup.jsx', purpose: 'New user registration with OTP verification' },
  { path: '/forgot-password', module: 'customer', layout: 'None', access: 'Public', component: 'ForgotPassword.jsx', purpose: 'Account recovery flow' },
  { path: '/checkout', module: 'customer', layout: 'None', access: 'Auth (localStorage)', component: 'Checkout.jsx', purpose: '3-step checkout: address, summary, payment' },
  { path: '/home', module: 'customer', layout: 'VendorLayout', access: 'Public', component: 'Home.jsx', purpose: 'Main storefront with CMS-driven home sections' },
  { path: '/products', module: 'customer', layout: 'VendorLayout', access: 'Public', component: 'Products.jsx', purpose: 'Product listing grid' },
  { path: '/product-detail', module: 'customer', layout: 'VendorLayout', access: 'Public', component: 'ProductDetail.jsx', purpose: 'Single product view with add to cart/buy now' },
  { path: '/cart', module: 'customer', layout: 'VendorLayout', access: 'Public', component: 'Cart.jsx', purpose: 'Shopping cart with address modal and checkout CTA' },
  { path: '/bag', module: 'customer', layout: 'VendorLayout', access: 'Public', component: 'Bag.jsx', purpose: 'Alternative bag view' },
  { path: '/wishlist', module: 'customer', layout: 'VendorLayout', access: 'Public', component: 'Wishlist.jsx', purpose: 'Saved products list' },
  { path: '/profile', module: 'customer', layout: 'VendorLayout', access: 'Public (no guard)', component: 'Profile.jsx', purpose: 'User profile hub with menu links' },
  { path: '/profile/edit', module: 'customer', layout: 'VendorLayout', access: 'Implicit auth', component: 'EditProfile.jsx', purpose: 'Edit user profile fields' },
  { path: '/profile/orders', module: 'customer', layout: 'VendorLayout', access: 'Implicit auth', component: 'MyOrders.jsx', purpose: 'Order history list' },
  { path: '/profile/orders/:orderId', module: 'customer', layout: 'VendorLayout', access: 'Implicit auth', component: 'OrderDetail.jsx', purpose: 'Order tracking and actions' },
  { path: '/profile/coupons', module: 'customer', layout: 'VendorLayout', access: 'Implicit auth', component: 'Coupons.jsx', purpose: 'User coupon wallet' },
  { path: '/profile/help-center', module: 'customer', layout: 'VendorLayout', access: 'Public', component: 'HelpCenter.jsx', purpose: 'FAQ and support' },
  { path: '/profile/addresses', module: 'customer', layout: 'VendorLayout', access: 'Implicit auth', component: 'SavedAddresses.jsx', purpose: 'Address CRUD' },
  { path: '/profile/cards', module: 'customer', layout: 'VendorLayout', access: 'Implicit auth', component: 'SavedCards.jsx', purpose: 'Saved payment methods' },
  { path: '/profile/notifications', module: 'customer', layout: 'VendorLayout', access: 'Implicit auth', component: 'NotificationSettings.jsx', purpose: 'Notification preferences' },
  { path: '/profile/reviews', module: 'customer', layout: 'VendorLayout', access: 'Implicit auth', component: 'MyReviews.jsx', purpose: 'User product reviews' },
  { path: '/profile/questions', module: 'customer', layout: 'VendorLayout', access: 'Implicit auth', component: 'QuestionsAnswers.jsx', purpose: 'Product Q&A history' },
  { path: '/wallet', module: 'customer', layout: 'VendorLayout', access: 'Implicit auth', component: 'Wallet.jsx', purpose: 'Wallet balance and transactions' },
  { path: '/menu', module: 'customer', layout: 'VendorLayout', access: 'Public', component: 'Menu.jsx', purpose: 'Category menu grid' },
  { path: '/deals', module: 'customer', layout: 'VendorLayout', access: 'Public', component: 'DealsPage.jsx', purpose: 'Deals and offers listing' },
  { path: '/search', module: 'customer', layout: 'VendorLayout', access: 'Public', component: 'Search.jsx', purpose: 'Search results page' },
  { path: '/category-products', module: 'customer', layout: 'VendorLayout', access: 'Public', component: 'CategoryProducts.jsx', purpose: 'Filtered products by category' },
  { path: '/categories', module: 'customer', layout: 'VendorLayout', access: 'Public', component: 'Categories.jsx', purpose: 'All categories browse' },
  { path: '/toys', module: 'customer', layout: 'VendorLayout', access: 'Public', component: 'ToysLanding.jsx', purpose: 'Toys category landing' },
  { path: '/beauty', module: 'customer', layout: 'VendorLayout', access: 'Public', component: 'BeautyLanding.jsx', purpose: 'Beauty category landing' },
  { path: '/continue-shopping/:productId', module: 'customer', layout: 'VendorLayout', access: 'Public', component: 'ContinueShopping.jsx', purpose: 'Post-product-view recommendations' },
  { path: '/all-offers', module: 'customer', layout: 'VendorLayout', access: 'Public', component: 'AllOffers.jsx', purpose: 'All promotional offers' },
  { path: '/quick-shop', module: 'customer', layout: 'VendorLayout', access: 'Public', component: 'QuickShop.jsx', purpose: 'Quick commerce vertical entry' },
  { path: '/quick-shop/category', module: 'customer', layout: 'VendorLayout', access: 'Public', component: 'QuickShopSubcategory.jsx', purpose: 'Quick shop subcategory products' },
  { path: '/mithilak', module: 'customer', layout: 'VendorLayout', access: 'Public', component: 'Mithilak.jsx', purpose: 'Mithila art specialty store' },
  { path: '/mithilak/category', module: 'customer', layout: 'VendorLayout', access: 'Public', component: 'QuickShopSubcategory.jsx', purpose: 'Mithilak subcategory products' },
  { path: '/fresh-grocery', module: 'customer', layout: 'VendorLayout', access: 'Public', component: 'QuickShop.jsx', purpose: 'Fresh grocery vertical entry' },
  { path: '/fresh-grocery/category', module: 'customer', layout: 'VendorLayout', access: 'Public', component: 'QuickShopSubcategory.jsx', purpose: 'Grocery subcategory products' },
  { path: '/terms', module: 'customer', layout: 'None', access: 'Public', component: 'TermsOfUse.jsx', purpose: 'Terms of use legal page' },
  { path: '/privacy', module: 'customer', layout: 'None', access: 'Public', component: 'PrivacyPolicy.jsx', purpose: 'Privacy policy legal page' },
  { path: '/cancellation-returns', module: 'customer', layout: 'None', access: 'Public', component: 'CancellationReturns.jsx', purpose: 'Cancellation and returns policy' },
  { path: '/shipping', module: 'customer', layout: 'None', access: 'Public', component: 'ShippingPolicy.jsx', purpose: 'Shipping policy' },
  // Seller
  { path: '/seller/login', module: 'seller', layout: 'None', access: 'Public', component: 'SellerLogin.jsx', purpose: 'Seller email/password login' },
  { path: '/seller/dashboard', module: 'seller', layout: 'SellerLayout', access: 'ProtectedRoute', component: 'Dashboard.jsx', purpose: 'Seller KPI dashboard' },
  { path: '/seller/products', module: 'seller', layout: 'SellerLayout', access: 'ProtectedRoute', component: 'ProductList.jsx', purpose: 'Product inventory list' },
  { path: '/seller/products/add', module: 'seller', layout: 'SellerLayout', access: 'ProtectedRoute', component: 'AddProduct.jsx', purpose: 'Create new product' },
  { path: '/seller/products/edit/:id', module: 'seller', layout: 'SellerLayout', access: 'ProtectedRoute', component: 'AddProduct.jsx', purpose: 'Edit existing product' },
  { path: '/seller/orders', module: 'seller', layout: 'SellerLayout', access: 'ProtectedRoute', component: 'OrderList.jsx', purpose: 'Seller order management' },
  { path: '/seller/orders/:id', module: 'seller', layout: 'SellerLayout', access: 'ProtectedRoute', component: 'OrderDetail.jsx', purpose: 'Single order fulfillment' },
  { path: '/seller/returns', module: 'seller', layout: 'SellerLayout', access: 'ProtectedRoute', component: 'ReturnList.jsx', purpose: 'Return request management' },
  { path: '/seller/customers', module: 'seller', layout: 'SellerLayout', access: 'ProtectedRoute', component: 'CustomerList.jsx', purpose: 'Customer list for seller' },
  { path: '/seller/inventory', module: 'seller', layout: 'SellerLayout', access: 'ProtectedRoute', component: 'InventoryManager.jsx', purpose: 'Stock management' },
  { path: '/seller/reviews', module: 'seller', layout: 'SellerLayout', access: 'ProtectedRoute', component: 'ReviewList.jsx', purpose: 'Product review management' },
  { path: '/seller/coupons', module: 'seller', layout: 'SellerLayout', access: 'ProtectedRoute', component: 'CouponList.jsx', purpose: 'Seller coupon management' },
  { path: '/seller/analytics', module: 'seller', layout: 'SellerLayout', access: 'ProtectedRoute', component: 'Analytics.jsx', purpose: 'Sales analytics charts' },
  { path: '/seller/earnings', module: 'seller', layout: 'SellerLayout', access: 'ProtectedRoute', component: 'Earnings.jsx', purpose: 'Earnings and settlements' },
  { path: '/seller/notifications', module: 'seller', layout: 'SellerLayout', access: 'ProtectedRoute', component: 'Notifications.jsx', purpose: 'Seller notifications' },
  { path: '/seller/settings', module: 'seller', layout: 'SellerLayout', access: 'ProtectedRoute', component: 'Settings.jsx', purpose: 'Seller profile and bank settings' },
  // Admin
  { path: '/admin/auth', module: 'admin', layout: 'None', access: 'Public', component: 'Auth.jsx', purpose: 'Admin login' },
  { path: '/admin/dashboard', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'Dashboard.jsx', purpose: 'Platform overview dashboard' },
  { path: '/admin/analytics', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'Analytics.jsx', purpose: 'Platform analytics' },
  { path: '/admin/users', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'Users.jsx', purpose: 'Customer database' },
  { path: '/admin/users/:userId', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'CustomerDetail.jsx', purpose: 'Customer detail view' },
  { path: '/admin/orders', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'Orders.jsx', purpose: 'All platform orders' },
  { path: '/admin/orders/:orderId', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'OrderDetail.jsx', purpose: 'Admin order detail' },
  { path: '/admin/vendors/all', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'VendorList.jsx', purpose: 'Active vendor list' },
  { path: '/admin/vendors/approval', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'VendorApproval.jsx', purpose: 'Vendor onboarding approval' },
  { path: '/admin/vendors/:vendorId', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'SellerDetail.jsx', purpose: 'Vendor detail and KYC' },
  { path: '/admin/storefront/banners', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'BannerManager.jsx', purpose: 'CMS banner management' },
  { path: '/admin/storefront/chips', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'CategoryChipsManager.jsx', purpose: 'Category chip CMS' },
  { path: '/admin/storefront/sections/:section', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'HomeSectionsManager.jsx', purpose: 'Home page section curation' },
  { path: '/admin/categories', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'CategoryManager.jsx', purpose: 'Category tree management' },
  { path: '/admin/products/moderation', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'ProductModeration.jsx', purpose: 'Product approval queue' },
  { path: '/admin/inventory/all', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'InventoryList.jsx', purpose: 'Platform inventory overview' },
  { path: '/admin/inventory/add', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'AddProduct.jsx', purpose: 'Admin add product' },
  { path: '/admin/inventory/alerts', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'StockAlerts.jsx', purpose: 'Low stock alerts' },
  { path: '/admin/operations/returns', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'Returns.jsx', purpose: 'Return claims management' },
  { path: '/admin/operations/refunds', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'Refunds.jsx', purpose: 'Refund processing hub' },
  { path: '/admin/support/tickets', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'Tickets.jsx', purpose: 'Support ticket desk' },
  { path: '/admin/promotions/coupons', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'Coupons.jsx', purpose: 'Platform coupon management' },
  { path: '/admin/promotions/flash-sale', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'FlashSale.jsx', purpose: 'Flash sale scheduling' },
  { path: '/admin/promotions/featured', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'FeaturedProducts.jsx', purpose: 'Featured/trending curation' },
  { path: '/admin/comms/notifications', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'Notifications.jsx', purpose: 'Broadcast notifications' },
  { path: '/admin/content/reviews', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'ReviewModeration.jsx', purpose: 'Review moderation queue' },
  { path: '/admin/content/qna', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'QnAModeration.jsx', purpose: 'Q&A moderation' },
  { path: '/admin/content/legal', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'LegalPolicies.jsx', purpose: 'Legal policy CMS' },
  { path: '/admin/delivery/all', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'AllDeliveries.jsx', purpose: 'Delivery partner list' },
  { path: '/admin/delivery/approval', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'DeliveryApproval.jsx', purpose: 'Delivery partner onboarding' },
  { path: '/admin/finance/earnings', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'PlatformEarnings.jsx', purpose: 'Platform revenue dashboard' },
  { path: '/admin/payouts', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'Payouts.jsx', purpose: 'Vendor payout processing' },
  { path: '/admin/finance/rules', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'Rules.jsx', purpose: 'Commission rules config' },
  { path: '/admin/finance/tax', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'TaxConfig.jsx', purpose: 'GST/tax slab configuration' },
  { path: '/admin/finance/delivery-charges', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'DeliveryCharges.jsx', purpose: 'Zone-based delivery charges' },
  { path: '/admin/reports/sales', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'SalesReport.jsx', purpose: 'Sales analytics report' },
  { path: '/admin/reports/sellers', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'SellerReport.jsx', purpose: 'Seller performance report' },
  { path: '/admin/reports/users', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'UserReport.jsx', purpose: 'User growth report' },
  { path: '/admin/reports/orders', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'OrderReport.jsx', purpose: 'Order volume report' },
  { path: '/admin/reports/inventory', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'InventoryReport.jsx', purpose: 'Inventory health report' },
  { path: '/admin/reports/refunds', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'RefundReport.jsx', purpose: 'Refund analytics report' },
  { path: '/admin/system/sub-admins', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'SubAdmins.jsx', purpose: 'Sub-admin user management' },
  { path: '/admin/system/roles', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'RoleManagement.jsx', purpose: 'RBAC role configuration' },
  { path: '/admin/system/audit-logs', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'AuditLogs.jsx', purpose: 'Admin activity audit trail' },
  { path: '/admin/settings', module: 'admin', layout: 'AdminLayout', access: 'AdminProtectedRoute', component: 'Settings.jsx', purpose: 'Platform settings' },
  // Delivery
  { path: '/delivery/auth', module: 'delivery', layout: 'None', access: 'Public', component: 'Auth.jsx', purpose: 'Delivery partner login' },
  { path: '/delivery/signup', module: 'delivery', layout: 'None', access: 'Public', component: 'Signup.jsx', purpose: 'Delivery partner registration' },
  { path: '/delivery/dashboard', module: 'delivery', layout: 'DeliveryLayout', access: 'DeliveryProtectedRoute', component: 'Dashboard.jsx', purpose: 'Delivery agent home' },
  { path: '/delivery/orders', module: 'delivery', layout: 'DeliveryLayout', access: 'DeliveryProtectedRoute', component: 'Orders.jsx', purpose: 'Order queue (available/active/completed)' },
  { path: '/delivery/orders/:orderId', module: 'delivery', layout: 'DeliveryLayout', access: 'DeliveryProtectedRoute', component: 'OrderDetail.jsx', purpose: 'Order pickup and delivery with OTP' },
  { path: '/delivery/earnings', module: 'delivery', layout: 'DeliveryLayout', access: 'DeliveryProtectedRoute', component: 'Earnings.jsx', purpose: 'Earnings summary' },
  { path: '/delivery/profile', module: 'delivery', layout: 'DeliveryLayout', access: 'DeliveryProtectedRoute', component: 'Profile.jsx', purpose: 'Partner profile' },
  { path: '/delivery/profile/edit', module: 'delivery', layout: 'DeliveryLayout', access: 'DeliveryProtectedRoute', component: 'PersonalInfo.jsx', purpose: 'Edit personal info' },
  { path: '/delivery/settings', module: 'delivery', layout: 'DeliveryLayout', access: 'DeliveryProtectedRoute', component: 'Settings.jsx', purpose: 'App settings' },
  { path: '/delivery/support', module: 'delivery', layout: 'DeliveryLayout', access: 'DeliveryProtectedRoute', component: 'Support.jsx', purpose: 'Partner support' },
  { path: '/delivery/about', module: 'delivery', layout: 'DeliveryLayout', access: 'DeliveryProtectedRoute', component: 'About.jsx', purpose: 'About the delivery program' },
];

function routeDoc(r) {
  const slug = r.path.replace(/[/:]/g, '_').replace(/^_/, '') || 'root';
  const apis = {
    customer: ['GET /api/v1/products', 'GET /api/v1/categories', 'POST /api/v1/cart', 'POST /api/v1/orders', 'GET /api/v1/users/me'],
    seller: ['GET /api/v1/seller/dashboard', 'CRUD /api/v1/seller/products', 'GET /api/v1/seller/orders'],
    admin: ['GET /api/v1/admin/dashboard', 'CRUD /api/v1/admin/*'],
    delivery: ['GET /api/v1/delivery/orders', 'POST /api/v1/delivery/orders/:id/deliver'],
  };
  return `# Route: \`${r.path}\`

## Route
- **Path:** \`${r.path}\`
- **Module:** ${r.module}
- **Component File:** \`frontend/src/modules/${r.module === 'customer' ? 'user' : r.module}/pages/${r.component}\`

## Layout
${r.layout}

## Access
${r.access}

## Permission
${r.module === 'admin' ? 'Requires admin JWT + RBAC permissions (not enforced in frontend)' : r.module === 'seller' ? 'Requires seller JWT' : r.module === 'delivery' ? 'Requires delivery partner JWT' : 'Public or customer JWT for checkout/profile actions'}

## Navigation
Reachable via ${r.module} portal navigation. See [05_Navigation.md](../../05_Navigation.md).

## Purpose
${r.purpose}

## Components
Primary page component: **${r.component}**
See per-file audit: [files/](../../files/) — search for ${r.component}

## Business Flow
1. User navigates to \`${r.path}\`
2. Route guard checks: ${r.access}
3. Page component mounts and loads data (currently mock/localStorage)
4. User interacts with page-specific UI elements
5. Actions trigger API calls (when backend integrated) or local state updates

## Expected Backend
${apis[r.module].map(a => `- ${a}`).join('\n')}

## Required APIs
Route-specific endpoints inferred from page component. See component file audit for extracted API references.

## Required Database
Depends on domain: users, products, orders, sellers, delivery_partners tables. See [20_Database_Requirements.md](../../20_Database_Requirements.md).

## Possible Errors
| Error | Cause | UI Handling |
|-------|-------|-------------|
| 401 Unauthorized | Invalid/expired token | Redirect to login |
| 403 Forbidden | Insufficient permissions | Error toast / access denied |
| 404 Not Found | Invalid resource ID | Empty state component |
| 422 Validation | Invalid form data | Inline field errors |
| 500 Server Error | Backend failure | ErrorState / toast |
| Network offline | No connectivity | OfflineOverlay component |
`;
}

let index = '# Detailed Route Documentation Index\n\n';
for (const r of ROUTES) {
  const slug = r.path.replace(/[/:]/g, '_').replace(/^_/, '') || 'root';
  const fname = `${r.module}__${slug}.md`;
  fs.writeFileSync(path.join(OUT, fname), routeDoc(r));
  index += `- [${r.path}](./detailed/${fname})\n`;
}
fs.writeFileSync(path.join(OUT, '..', 'ROUTE_INDEX.md'), index);
console.log(`Generated ${ROUTES.length} detailed route documents`);
