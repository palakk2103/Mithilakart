# Route: `/seller/inventory`

## Route
- **Path:** `/seller/inventory`
- **Module:** seller
- **Component File:** `frontend/src/modules/seller/pages/InventoryManager.jsx`

## Layout
SellerLayout

## Access
ProtectedRoute

## Permission
Requires seller JWT

## Navigation
Reachable via seller portal navigation. See [05_Navigation.md](../../05_Navigation.md).

## Purpose
Stock management

## Components
Primary page component: **InventoryManager.jsx**
See per-file audit: [files/](../../files/) — search for InventoryManager.jsx

## Business Flow
1. User navigates to `/seller/inventory`
2. Route guard checks: ProtectedRoute
3. Page component mounts and loads data (currently mock/localStorage)
4. User interacts with page-specific UI elements
5. Actions trigger API calls (when backend integrated) or local state updates

## Expected Backend
- GET /api/v1/seller/dashboard
- CRUD /api/v1/seller/products
- GET /api/v1/seller/orders

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
