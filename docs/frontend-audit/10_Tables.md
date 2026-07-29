# 10 — Tables

## Summary
32 files contain data tables.

## Files With Tables

- frontend/src/modules/admin/components/ui/DataTable.jsx
- frontend/src/modules/admin/components/ui/index.js
- frontend/src/modules/admin/pages/comms/Notifications.jsx
- frontend/src/modules/admin/pages/delivery/AllDeliveries.jsx
- frontend/src/modules/admin/pages/finance/PlatformEarnings.jsx
- frontend/src/modules/admin/pages/finance/TaxConfig.jsx
- frontend/src/modules/admin/pages/inventory/StockAlerts.jsx
- frontend/src/modules/admin/pages/operations/Refunds.jsx
- frontend/src/modules/admin/pages/operations/Returns.jsx
- frontend/src/modules/admin/pages/Orders.jsx
- frontend/src/modules/admin/pages/Payouts.jsx
- frontend/src/modules/admin/pages/Products.jsx
- frontend/src/modules/admin/pages/promotions/Coupons.jsx
- frontend/src/modules/admin/pages/promotions/FlashSale.jsx
- frontend/src/modules/admin/pages/reports/InventoryReport.jsx
- frontend/src/modules/admin/pages/reports/OrderReport.jsx
- frontend/src/modules/admin/pages/reports/RefundReport.jsx
- frontend/src/modules/admin/pages/reports/SalesReport.jsx
- frontend/src/modules/admin/pages/reports/SellerReport.jsx
- frontend/src/modules/admin/pages/reports/UserReport.jsx
- frontend/src/modules/admin/pages/system/AuditLogs.jsx
- frontend/src/modules/admin/pages/system/SubAdmins.jsx
- frontend/src/modules/admin/pages/Users.jsx
- frontend/src/modules/admin/vendors/VendorList.jsx
- frontend/src/modules/seller/components/common/DataTable.jsx
- frontend/src/modules/seller/components/common/index.js
- frontend/src/modules/seller/pages/customers/CustomerList.jsx
- frontend/src/modules/seller/pages/earnings/Earnings.jsx
- frontend/src/modules/seller/pages/inventory/InventoryManager.jsx
- frontend/src/modules/seller/pages/orders/OrderList.jsx
- frontend/src/modules/seller/pages/products/ProductList.jsx
- frontend/src/modules/vendor/inventory/InventoryList.jsx

## Reusable Table Components

### admin/components/ui/DataTable.jsx
- Props: columns, data, onRowClick, loading, emptyMessage
- Supports sort indicators, row actions, pagination integration

### seller/components/common/DataTable.jsx
- Similar API with mobile-responsive card fallback

## Key Table Implementations

| Page | Columns | Actions | Filters | Pagination |
|------|---------|---------|---------|------------|
| admin/Users.jsx | Name, Email, Orders, Status, Joined | View, Block | Search, Status | Client-side |
| admin/Orders.jsx | Order ID, Customer, Amount, Status, Date | View | Status, Date range | Client-side |
| seller/ProductList.jsx | Image, Title, Price, Stock, Status | Edit, Delete, Duplicate | Search, Category, Status | usePagination hook |
| seller/OrderList.jsx | Order ID, Customer, Items, Total, Status | View, Update Status | Status filter | usePagination |
| admin/reports/* | Varies per report | Export button (UI) | Date range | N/A (charts) |

## Backend Query Requirements (All Tables)

Every table requires:
- Paginated API: `?page=&limit=&sort=&order=`
- Filter params matching UI filters
- Search: full-text or field-specific
- Role-based row visibility
- Export endpoint for report tables
