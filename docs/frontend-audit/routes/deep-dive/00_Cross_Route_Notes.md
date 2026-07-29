# Cross-Route Notes (Customer Marketplace & Auth Portals)

## Route Aliasing

Customer marketplace routes are reachable at both root and `/vendor` prefix:

| Root Path | Vendor Alias |
|-----------|-------------|
| `/home` | `/vendor/home` |
| `/cart` | `/vendor/cart` |
| `/product-detail` | `/vendor/product-detail` |
| `/profile` | `/vendor/profile` |
| `/search` | `/vendor/search` |
| `/login` | `/vendor/login` |

Internal navigation is inconsistent — some links use `/vendor/...`, others use root-relative paths.

## Shared Auth Flags

| Portal | localStorage Key | Notes |
|--------|------------------|-------|
| Customer | `isAuthenticated` | No JWT persisted despite mock API returning token |
| Admin | `isAdminAuthenticated` | Hardcoded credentials in Auth.jsx |
| Seller | `seller_token`, `seller_data` | Via SellerAuthContext |
| Delivery | `isDeliveryAuthenticated` | Hardcoded credentials in Auth.jsx |

## Data Persistence Summary

| Data | Storage | Used By |
|------|---------|---------|
| Cart items | `localStorage.userCart` | Home, Cart, ProductDetail, VendorLayout |
| Cart address | `localStorage.cartAddress` | Cart, Checkout |
| Auth state | `localStorage.isAuthenticated` | Cart, ProductDetail, Profile, Login, Checkout |
| Wishlist | Zustand + `localStorage.userWishlist` | ProductDetail, Profile (logout clears) |
| Flow theming | `isMithilakFlow`, `isQuickShopFlow`, `isFreshGroceryFlow` | Cart, ProductDetail, Checkout, Profile, Search |

## Dead / Unmounted Route Modules

| File | Status |
|------|--------|
| `modules/user/routes/VendorRoutes.jsx` | Not mounted in App.jsx — subset of MarketRoutes |
| `modules/vendor/routes/SellerRoutes.jsx` | Not mounted — legacy seller routes |

## Shared Mock Credentials (All Portals)

| Portal | Username/Phone | Password/OTP |
|--------|----------------|--------------|
| Customer (phone) | 9111966732 | OTP 123456 |
| Customer (email) | mithilakart@gmail.com | OTP 123456 |
| Admin | 9111966732 | 123456 |
| Seller | 9111966732 | 123456 |
| Delivery | 9111966732 | 123456 |
