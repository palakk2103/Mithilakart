# 26 — Mock Data

## Centralized Mock Files

| File | Used By | Contents |
|------|---------|----------|
| seller/utils/dummyData.js | All seller pages | sellerProfile, products, orders, returns, customers, reviews, coupons, notifications, earnings, analytics, inventory |
| admin/constants/dummyData.js | Admin reports, roles, audit, refunds, seller detail | DASHBOARD_STATS, report arrays, MOCK_ROLES, ALL_PERMISSIONS, MOCK_AUDIT_LOGS |
| store/slices/*.js | Redux store | Seed arrays for products, orders, finance, analytics |
| store/useAccountStore.js | Customer profile pages | userProfile, addresses, cards, orders, coupons |
| data/categoryData.js | Category pages | Category hierarchy |

## Inline Mock Data (per-page)

| File | Variable |
|------|----------|
| admin/Users.jsx | MOCK_USERS |
| admin/Orders.jsx | MOCK_ORDERS |
| admin/Payouts.jsx | MOCK_PAYOUTS |
| admin/pages/promotions/Coupons.jsx | MOCK_COUPONS |
| admin/pages/promotions/FlashSale.jsx | MOCK_SALES |
| admin/pages/promotions/FeaturedProducts.jsx | MOCK_FEATURED, MOCK_TRENDING |
| admin/pages/operations/Returns.jsx | MOCK_RETURNS |
| admin/pages/inventory/StockAlerts.jsx | MOCK_ALERTS |
| admin/pages/finance/TaxConfig.jsx | MOCK_TAX_SLABS |
| admin/pages/finance/DeliveryCharges.jsx | MOCK_ZONES |
| admin/pages/delivery/AllDeliveries.jsx | MOCK_PARTNERS |
| admin/pages/delivery/DeliveryApproval.jsx | MOCK_APPLICATIONS |
| admin/pages/content/ReviewModeration.jsx | MOCK_REVIEWS |
| admin/pages/content/QnAModeration.jsx | MOCK_QNA |
| admin/pages/support/Tickets.jsx | MOCK_TICKETS |
| admin/pages/system/SubAdmins.jsx | MOCK_ADMINS |
| admin/layouts/AdminLayout.jsx | mockNotifications |
| delivery/pages/Orders.jsx | MOCK_ORDERS |
| delivery/pages/OrderDetail.jsx | MOCK_ORDER |
| user/pages/Products.jsx | dummyProducts |
