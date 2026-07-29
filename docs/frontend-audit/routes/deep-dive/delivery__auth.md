# Route Deep-Dive: `/delivery/auth`

**Page:** `delivery/pages/Auth.jsx` | **Router:** `DeliveryRoutes.jsx`

## Purpose
Delivery partner login. Sets `isDeliveryAuthenticated`.

## Business Flow
1. On mount: clear stale `isDeliveryAuthenticated`.
2. Validate fields → 800ms simulated delay.
3. Hardcoded `9111966732` / `123456`.
4. Success → `/delivery/dashboard`.
5. Register link → `/delivery/signup`.

## Expected APIs
`POST /delivery/auth/login` — **Not wired**

## Permissions
- Auth/signup: Public
- Dashboard+: `isDeliveryAuthenticated`

## Errors
Empty fields; invalid credentials — inline banner.
