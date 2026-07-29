# File Audit: frontend/src/modules/user/pages/ProductDetail.jsx

| Property | Value |
|----------|-------|
| Lines | 941 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (16)

- `lucide-react`
- `../../../shared/utils/priceFormatter`
- `react-router-dom`
- `../../../store/useAccountStore`
- `react-i18next`
- `../../../assets/products/product05.jpg`
- `../../../assets/products/product06.jpg`
- `../../../assets/products/product07.jpg`
- `../../../assets/products/product03.jpg`
- `../../../assets/products/product05.jpg`
- `../../../assets/products/product07.jpg`
- `../../../assets/products/product09.jpg`
- `../../../assets/TopSection/TopSection1.jpg`
- `../../../assets/products/product10.jpg`
- `../../../assets/products/product08.jpg`
- `../../../assets/products/product09.jpg`

## Hooks / State

- useState('S')
- useState(false)
- useState(false)
- useState('')
- useState(0)
- useState(false)
- useState(false)
- useState(false)
- useState(false)
- useState(false)
- useState(false)
- useState(true)
- useState(false)
- useState('Specifications')
- useState('COD')
- useState(0)
- useState(0)
- useState('')
- useEffect x1
- useAccountStore
- useTranslation
- useNavigate
- useLocation

## Buttons (17)

### Button 1
- **Label:** navigate(-1)} className={`p-1.5 rounded-full transition-colors active:scale-90 $
- **Type:** button
- **onClick:** `() => navigate(-1)`

### Button 2
- **Label:** navigate('/vendor/search')} 
            className={`p-1.5 rounded-full transit
- **Type:** button
- **onClick:** `() => navigate('/vendor/search')`

### Button 3
- **Label:** (icon-only)
- **Type:** button
- **onClick:** `toggleWishlist`

### Button 4
- **Label:** (icon-only)
- **Type:** button
- **onClick:** `handleShare`

### Button 5
- **Label:** setCurrentSlide(idx)}
                  className={`w-12 h-15 rounded-lg overfl
- **Type:** button
- **onClick:** `() => setCurrentSlide(idx)`

### Button 6
- **Label:** setSelectedSize(size)}
              className={`w-10 h-10 rounded-full text-[1
- **Type:** button
- **onClick:** `() => setSelectedSize(size)`

### Button 7
- **Label:** {t('cart.addToCart')}
- **Type:** button
- **onClick:** `handleAddToCart`

### Button 8
- **Label:** {t('cart.buyNow')} • {formatPrice(product.price)}
- **Type:** button
- **onClick:** `handleBuyNow`

### Button 9
- **Label:** {
                      e.stopPropagation();
                      setActiveDe
- **Type:** button
- **onClick:** `(e) => {
                      e.stopPropagation();
                      setActiveDetailTab(tab);
                    `

### Button 10
- **Label:** {
                setShowReturnPolicy(false);
                setIsReturnExpan
- **Type:** button
- **onClick:** `() => {
                setShowReturnPolicy(false);
                setIsReturnExpanded(false);
              `

### Button 11
- **Label:** {
                setShowPaymentOptions(false);
                setIsPaymentEx
- **Type:** button
- **onClick:** `() => {
                setShowPaymentOptions(false);
                setIsPaymentExpanded(false);
              `

### Button 12
- **Label:** setActivePaymentTab('COD')}
                className={`flex-1 flex flex-col it
- **Type:** button
- **onClick:** `() => setActivePaymentTab('COD')`

### Button 13
- **Label:** setActivePaymentTab('UPI')}
                className={`flex-1 flex flex-col it
- **Type:** button
- **onClick:** `() => setActivePaymentTab('UPI')`

### Button 14
- **Label:** {
                setShowSupportInfo(false);
                setIsSupportExpan
- **Type:** button
- **onClick:** `() => {
                setShowSupportInfo(false);
                setIsSupportExpanded(false);
              `

### Button 15
- **Label:** Chat with us
- **Type:** button
- **onClick:** ``

### Button 16
- **Label:** Help Center
- **Type:** button
- **onClick:** ``

### Button 17
- **Label:** {t('cart.addToCart') || 'Add to cart'}
- **Type:** button
- **onClick:** `handleAddToCart`

## localStorage Keys

- `isQuickShopFlow`
- `isMithilakFlow`
- `isFreshGroceryFlow`
- `userCart`
- `isAuthenticated`

## Hardcoded / Mock Indicators

- URL: http://www.w3.org/2000/svg

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
