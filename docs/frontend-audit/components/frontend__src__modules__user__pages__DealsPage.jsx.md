# File Audit: frontend/src/modules/user/pages/DealsPage.jsx

| Property | Value |
|----------|-------|
| Lines | 192 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | true |

## Exports

- `default`

## Imports (5)

- `react-router-dom`
- `lucide-react`
- `framer-motion`
- `react-hot-toast`
- `../../../store/useAccountStore`

## Hooks / State

- useState({})
- useAccountStore
- useNavigate
- useLocation

## Buttons (4)

### Button 1
- **Label:** navigate(-1)} className={isDarkMode ? 'text-[var(--color-gold)]' : 'text-slate-8
- **Type:** button
- **onClick:** `() => navigate(-1)`

### Button 2
- **Label:** toggleWishlist(product.id, e)}
                className={`absolute top-3 right
- **Type:** button
- **onClick:** `(e) => toggleWishlist(product.id, e)`

### Button 3
- **Label:** handleAddToCart(product, e)}
                   className={`absolute bottom-2 r
- **Type:** button
- **onClick:** `(e) => handleAddToCart(product, e)`

### Button 4
- **Label:** Shop {product.brand} deals
- **Type:** button
- **onClick:** ``

## localStorage Keys

- `userCart`

## Hardcoded / Mock Indicators

- URL: https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400
- URL: https://images.unsplash.com/photo-1670057037305-64d84711833d?w=400
- URL: https://images.unsplash.com/photo-1696446701796-da61225697cc?w=400
- URL: https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400
- URL: https://images.unsplash.com/photo-1695213601569-8088019316d3?w=400
- URL: https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400
- URL: https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400
- URL: https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=400
- URL: https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400
- URL: https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
