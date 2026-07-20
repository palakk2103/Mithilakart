# Route: `/wallet`

## Route
- **Path:** `/wallet`
- **Module:** customer
- **Component File:** `frontend/src/modules/user/pages/Wallet.jsx`

## Layout
VendorLayout

## Access
Implicit auth

## Permission
Public or customer JWT for checkout/profile actions

## Navigation
Reachable via customer portal navigation. See [05_Navigation.md](../../05_Navigation.md).

## Purpose
Wallet balance and transactions

## Components
Primary page component: **Wallet.jsx**
See per-file audit: [files/](../../files/) — search for Wallet.jsx

## Business Flow
1. User navigates to `/wallet`
2. Route guard checks: Implicit auth
3. Page component mounts and loads data (currently mock/localStorage)
4. User interacts with page-specific UI elements
5. Actions trigger API calls (when backend integrated) or local state updates

## Expected Backend
- GET /api/v1/products
- GET /api/v1/categories
- POST /api/v1/cart
- POST /api/v1/orders
- GET /api/v1/users/me

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
