# File Audit: frontend/src/modules/user/pages/Search.jsx

| Property | Value |
|----------|-------|
| Lines | 198 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (11)

- `react-router-dom`
- `lucide-react`
- `../components/common/ProductCard`
- `framer-motion`
- `../../../shared/components/SearchInput`
- `../../../assets/products/product01.jpg`
- `../../../assets/products/product02.jpg`
- `../../../assets/products/product03.jpg`
- `../../../assets/products/product04.jpg`
- `../../../assets/products/product07.jpg`
- `../../../assets/products/product12.jpg`

## Hooks / State

- useState('grid')
- useState(false)
- useState(query)
- useEffect x1
- useNavigate

## Buttons (6)

### Button 1
- **Label:** navigate(-1)} className={isFreshGroceryFlow ? 'text-black' : 'text-white'}>
- **Type:** button
- **onClick:** `() => navigate(-1)`

### Button 2
- **Label:** (icon-only)
- **Type:** button
- **onClick:** ``

### Button 3
- **Label:** setViewMode('grid')}
                   className={`p-1 rounded-md transition-a
- **Type:** button
- **onClick:** `() => setViewMode('grid')`

### Button 4
- **Label:** setViewMode('list')}
                   className={`p-1 rounded-md transition-a
- **Type:** button
- **onClick:** `() => setViewMode('list')`

### Button 5
- **Label:** {tag}
- **Type:** button
- **onClick:** ``

### Button 6
- **Label:** navigate('/home')}
               className={`mt-5 px-6 py-2.5 ${headerBg} ${is
- **Type:** button
- **onClick:** `() => navigate('/home')`

## localStorage Keys

- `isMithilakFlow`
- `isQuickShopFlow`
- `isFreshGroceryFlow`

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
