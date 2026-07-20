# Route Deep-Dive: `/seller/login`

**Page:** `seller/pages/auth/SellerLogin.jsx` | **Context:** `SellerAuthContext`

## Purpose
Seller portal login via context + `sellerApi.loginSeller` (mock).

## Business Flow
1. Pre-check `9111966732` / `123456`.
2. `login()` → stores `seller_token` + `seller_data` in localStorage.
3. Success toast → `/seller/dashboard`.
4. `ProtectedRoute` guards seller routes; `*` → login.

## Expected APIs
`POST /seller/auth/login` — **Mock** (800ms delay, dummy token)

## Permissions
- Login: Public
- Seller routes: `seller_token` required

## Errors
Toast for invalid credentials, API failure, unexpected errors.
