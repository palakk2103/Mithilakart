# File Audit: frontend/src/modules/user/pages/AllOffers.jsx

| Property | Value |
|----------|-------|
| Lines | 164 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (12)

- `lucide-react`
- `react-router-dom`
- `../../../shared/components/SearchInput`
- `../../../assets/products/product07.jpg`
- `../../../assets/products/product05.jpg`
- `../../../assets/products/product09.jpg`
- `../../../assets/products/product10.jpg`
- `../../../assets/products/product06.jpg`
- `../../../assets/products/product04.jpg`
- `../../../assets/products/product08.jpg`
- `../../../assets/products/product09.jpg`
- `../../../assets/TopSection/TopSection2.jpg`

## Hooks / State

- useState(0)
- useState(false)
- useState('')
- useEffect x1
- useNavigate

## Buttons (3)

### Button 1
- **Label:** navigate(-1)} className="active:scale-95 transition-transform p-1 hover:bg-white
- **Type:** button
- **onClick:** `() => navigate(-1)`

### Button 2
- **Label:** {
                 setIsSearchVisible(false);
                 setSearchQuery(
- **Type:** button
- **onClick:** `() => {
                 setIsSearchVisible(false);
                 setSearchQuery('');
               `

### Button 3
- **Label:** setIsSearchVisible(true)} className="p-1.5 hover:bg-white/10 rounded-full">
- **Type:** button
- **onClick:** `() => setIsSearchVisible(true)`

## localStorage Keys

- `userCart`

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
