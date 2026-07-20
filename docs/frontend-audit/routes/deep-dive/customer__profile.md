# Route Deep-Dive: `/profile` · `/vendor/profile`

**Page:** `Profile.jsx` (export: `VendorProfile`) | **Layout:** `VendorLayout`

## Purpose
Account hub: user identity, navigation to sub-pages, legal links, login/logout, social footer.

## Profile Sub-Routes
| Path | Page |
|------|------|
| `/profile/orders` | MyOrders |
| `/profile/wishlist` | Wishlist |
| `/profile/coupons` | Coupons |
| `/profile/edit` | EditProfile |
| `/profile/addresses` | SavedAddresses |
| `/profile/notifications` | NotificationSettings |
| `/profile/help-center` | HelpCenter |

## Business Flow
1. `isAuthenticated !== 'false'` treated as logged in (unset = authenticated display).
2. Guest vs PRIME MEMBER card from `useAccountStore.userProfile`.
3. Logout clears wishlist, token, sessionStorage → `/home`.
4. Login → `/login` with `{ from: '/profile' }`.

## Expected APIs
| Endpoint | Current State |
|----------|---------------|
| `GET /users/me` | Mock — useAccountStore |
| `GET /users/loyalty-points` | Not wired |
| `POST /auth/logout` | localStorage only |

## Permissions
- Page: **Public** (guest mode)
- Sub-pages: **No route guards** (de facto public)

## Errors
| Scenario | Handling |
|----------|----------|
| Missing profile | Fallback email `mithilakart.user@gmail.com` |
| Logout | Clears local keys only; no server invalidation |
