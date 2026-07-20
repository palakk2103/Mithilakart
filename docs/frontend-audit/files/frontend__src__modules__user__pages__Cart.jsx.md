# File Audit: frontend/src/modules/user/pages/Cart.jsx

| Property | Value |
|----------|-------|
| Lines | 455 |
| Extension | .jsx |
| Has Form | true |
| Has Modal/Dialog | true |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (4)

- `lucide-react`
- `react-router-dom`
- `react-i18next`
- `../../../shared/utils/priceFormatter`

## Hooks / State

- useState([])
- useState(localStorage.getItem('isAuthenticated')
- useState(()
- useState(false)
- useState('')
- useState('')
- useState('')
- useEffect x2
- useTranslation
- useNavigate

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | text | false |  |
| unnamed | tel | false |  |
| unnamed | textarea | false |  |

## Buttons (14)

### Button 1
- **Label:** navigate(-1)} 
          className="w-10 h-10 rounded-full bg-white shadow-sm f
- **Type:** button
- **onClick:** `() => navigate(-1)`

### Button 2
- **Label:** {
                      setAddrName(address.name || '');
                     
- **Type:** button
- **onClick:** `() => {
                      setAddrName(address.name || '');
                      setAddrPhone(address.phone || '');
                      setAddrDetails(address.address || '');
                      setShowAddressModal(true);
                    `

### Button 3
- **Label:** setShowAddressModal(true)}
                      className={`${primaryText} tex
- **Type:** button
- **onClick:** `() => setShowAddressModal(true)`

### Button 4
- **Label:** updateQuantity(item.cartId, -1)}
                            className="text-sl
- **Type:** button
- **onClick:** `() => updateQuantity(item.cartId, -1)`

### Button 5
- **Label:** updateQuantity(item.cartId, 1)}
                            className={`${prima
- **Type:** button
- **onClick:** `() => updateQuantity(item.cartId, 1)`

### Button 6
- **Label:** handleRemove(item.cartId)}
                        className="absolute right-0 
- **Type:** button
- **onClick:** `() => handleRemove(item.cartId)`

### Button 7
- **Label:** navigate('/login', { state: { from: '/cart' } })}
                  className={
- **Type:** button
- **onClick:** `() => navigate('/login', { state: { from: '/cart' `

### Button 8
- **Label:** setShowAddressModal(true)}
                  className={`hidden md:flex w-full 
- **Type:** button
- **onClick:** `() => setShowAddressModal(true)`

### Button 9
- **Label:** navigate('/vendor/checkout', { state: { product: cartItems[0] } })}
           
- **Type:** button
- **onClick:** `() => navigate('/vendor/checkout', { state: { product: cartItems[0] `

### Button 10
- **Label:** navigate('/login', { state: { from: '/cart' } })}
              className={`${p
- **Type:** button
- **onClick:** `() => navigate('/login', { state: { from: '/cart' `

### Button 11
- **Label:** setShowAddressModal(true)}
              className={`${primaryBg} text-white ro
- **Type:** button
- **onClick:** `() => setShowAddressModal(true)`

### Button 12
- **Label:** navigate('/vendor/checkout', { state: { product: cartItems[0] } })}
           
- **Type:** button
- **onClick:** `() => navigate('/vendor/checkout', { state: { product: cartItems[0] `

### Button 13
- **Label:** setShowAddressModal(false)}
              className="absolute right-6 top-6 tex
- **Type:** button
- **onClick:** `() => setShowAddressModal(false)`

### Button 14
- **Label:** Save & Continue
- **Type:** submit
- **onClick:** ``

## localStorage Keys

- `isAuthenticated`
- `cartAddress`
- `isMithilakFlow`
- `isQuickShopFlow`
- `isFreshGroceryFlow`
- `userCart`

## Hardcoded / Mock Indicators

- URL: http://www.w3.org/2000/svg

## Backend Dependency Inference

Contains forms — requires corresponding POST/PUT API endpoints with validation.
