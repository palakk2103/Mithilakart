# Route: `/delivery/orders/:orderId`

## Route
- **Path:** `/delivery/orders/:orderId`
- **Module:** delivery
- **Component File:** `frontend/src/modules/delivery/pages/OrderDetail.jsx`

## Layout
DeliveryLayout

## Access
DeliveryProtectedRoute

## Permission
Requires delivery partner JWT

## Navigation
Reachable via delivery portal navigation. See [05_Navigation.md](../../05_Navigation.md).

## Purpose
Order pickup and delivery with OTP

## Components
Primary page component: **OrderDetail.jsx**
See per-file audit: [files/](../../files/) — search for OrderDetail.jsx

## Business Flow
1. User navigates to `/delivery/orders/:orderId`
2. Route guard checks: DeliveryProtectedRoute
3. Page component mounts and loads data (currently mock/localStorage)
4. User interacts with page-specific UI elements
5. Actions trigger API calls (when backend integrated) or local state updates

## Expected Backend
- GET /api/v1/delivery/orders
- POST /api/v1/delivery/orders/:id/deliver

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
