# File Audit: frontend/src/modules/user/pages/QuickShopSubcategory.jsx

| Property | Value |
|----------|-------|
| Lines | 769 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (4)

- `react-router-dom`
- `lucide-react`
- `../../../shared/utils/priceFormatter`
- `../../../assets/closed_shutter.png`

## Hooks / State

- useState('all')
- useState([])
- useState({ h: '00', m: '00', s: '00' })
- useEffect x2
- useNavigate
- useLocation

## Buttons (8)

### Button 1
- **Label:** navigate(-1)}
            className={`p-1 active:scale-95 transition-transform 
- **Type:** button
- **onClick:** `() => navigate(-1)`

### Button 2
- **Label:** (icon-only)
- **Type:** button
- **onClick:** ``

### Button 3
- **Label:** (icon-only)
- **Type:** button
- **onClick:** ``

### Button 4
- **Label:** Filters
- **Type:** button
- **onClick:** ``

### Button 5
- **Label:** Sort
- **Type:** button
- **onClick:** ``

### Button 6
- **Label:** Type
- **Type:** button
- **onClick:** ``

### Button 7
- **Label:** {
                      e.stopPropagation();
                      toggleFavor
- **Type:** button
- **onClick:** `(e) => {
                      e.stopPropagation();
                      toggleFavorite(product.id);
                    `

### Button 8
- **Label:** {
                        e.stopPropagation();
                        // Add 
- **Type:** button
- **onClick:** `(e) => {
                        e.stopPropagation();
                        // Add to cart local storage flow
                        const cart = JSON.parse(localStorage.getItem('userCart') || '[]');
                        cart.push({ ...product, image: product.img, cartId: Date.now(), qty: 1 `

## localStorage Keys

- `forceShopClosed`
- `isMithilakFlow`
- `isFreshGroceryFlow`
- `userCart`

## Hardcoded / Mock Indicators

- URL: http://www.w3.org/2000/svg
- URL: https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=100&auto=format&fit=crop&q=60
- URL: https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=100&auto=format&fit=crop&q=60
- URL: https://images.unsplash.com/photo-1610832958506-ee5633619144?w=100&auto=format&fit=crop&q=60
- URL: https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=100&auto=format&fit=crop&q=60
- URL: https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=300&auto=format&fit=crop&q=60
- URL: https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&auto=format&fit=crop&q=60
- URL: https://images.unsplash.com/photo-1544025162-d76694265947?w=300&auto=format&fit=crop&q=60
- URL: https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=300&auto=format&fit=crop&q=60
- URL: https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=300&auto=format&fit=crop&q=60

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
