# File Audit: frontend/src/modules/user/pages/Checkout.jsx

| Property | Value |
|----------|-------|
| Lines | 535 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | true |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (6)

- `react-router-dom`
- `react-i18next`
- `lucide-react`
- `../../../shared/utils/priceFormatter`
- `../../../store/useAccountStore`
- `../../../assets/products/product04.jpg`

## Hooks / State

- useState(2)
- useState('UPI')
- useState('paytm')
- useState('idle')
- useState(null)
- useState([defaultProduct])
- useEffect x3
- useAccountStore
- useTranslation
- useNavigate
- useLocation

## Buttons (8)

### Button 1
- **Label:** navigate('/profile/addresses')}
            className={`${primaryText} text-[11
- **Type:** button
- **onClick:** `() => navigate('/profile/addresses')`

### Button 2
- **Label:** Pay {formatPrice(totalPrice + 19 - 50)}
- **Type:** button
- **onClick:** `handleContinue`

### Button 3
- **Label:** Place Order
- **Type:** button
- **onClick:** `handleContinue`

### Button 4
- **Label:** Add Card
- **Type:** button
- **onClick:** ``

### Button 5
- **Label:** navigate(`/vendor/profile/orders/${placedOrder?.id || ''}`)}
                cl
- **Type:** button
- **onClick:** `() => navigate(`/vendor/profile/orders/${placedOrder?.id || ''`

### Button 6
- **Label:** navigate(shopNowLink)}
                className="w-full bg-white border-2 bord
- **Type:** button
- **onClick:** `() => navigate(shopNowLink)`

### Button 7
- **Label:** navigate(-1)} 
            className="w-10 h-10 rounded-full bg-white shadow-sm
- **Type:** button
- **onClick:** `() => navigate(-1)`

### Button 8
- **Label:** {currentStep === 3 ? 'Place Order' : 'Continue'}
- **Type:** button
- **onClick:** `handleContinue`

## localStorage Keys

- `isMithilakFlow`
- `isQuickShopFlow`
- `isFreshGroceryFlow`
- `userCart`
- `cartAddress`
- `isAuthenticated`

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
