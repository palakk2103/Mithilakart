# File Audit: frontend/src/modules/user/pages/Profile.jsx

| Property | Value |
|----------|-------|
| Lines | 315 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (6)

- `react`
- `lucide-react`
- `react-router-dom`
- `framer-motion`
- `../../../store/useAccountStore`
- `react-i18next`

## Hooks / State

- useAccountStore
- useTranslation
- useNavigate

## Routes Defined

| Path | Component |
|------|----------|
| `/profile/orders` | object-route |
| `/profile/wishlist` | object-route |
| `/profile/coupons` | object-route |
| `/profile/edit` | object-route |
| `/profile/addresses` | object-route |
| `/profile/notifications` | object-route |
| `/profile/help-center` | object-route |

## Buttons (3)

### Button 1
- **Label:** {t('profile.loyaltyPoints') || 'Points'}
- **Type:** button
- **onClick:** ``

### Button 2
- **Label:** Log Out
- **Type:** button
- **onClick:** `handleLogout`

### Button 3
- **Label:** Login
- **Type:** button
- **onClick:** `handleLogin`

## localStorage Keys

- `isAuthenticated`
- `userWishlist`
- `userToken`
- `isQuickShopFlow`
- `isMithilakFlow`
- `isFreshGroceryFlow`

## Hardcoded / Mock Indicators

- URL: http://www.w3.org/2000/svg
- URL: http://www.w3.org/2000/svg
- URL: https://www.facebook.com/mithilakart
- URL: https://www.youtube.com/@mithilakart
- URL: https://www.instagram.com/mithilakart
- URL: https://x.com
- URL: https://wa.me/918076109547

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
