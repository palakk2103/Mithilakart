# File Audit: frontend/src/modules/user/pages/profile/Wishlist.jsx

| Property | Value |
|----------|-------|
| Lines | 166 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (5)

- `react`
- `lucide-react`
- `react-router-dom`
- `framer-motion`
- `../../../../store/useAccountStore`

## Hooks / State

- useAccountStore
- useNavigate

## Buttons (7)

### Button 1
- **Label:** navigate(-1)} className={`active:scale-95 transition-transform ${headerTextColor
- **Type:** button
- **onClick:** `() => navigate(-1)`

### Button 2
- **Label:** Share
- **Type:** button
- **onClick:** ``

### Button 3
- **Label:** Edit
- **Type:** button
- **onClick:** ``

### Button 4
- **Label:** (icon-only)
- **Type:** button
- **onClick:** ``

### Button 5
- **Label:** {
                      e.stopPropagation();
                      removeFromW
- **Type:** button
- **onClick:** `(e) => {
                      e.stopPropagation();
                      removeFromWishlist(item.id);
                    `

### Button 6
- **Label:** addToCart(item, e)}
                    className="w-full mt-4 py-2 border bord
- **Type:** button
- **onClick:** `(e) => addToCart(item, e)`

### Button 7
- **Label:** navigate('/vendor/home')}
              className="mt-6 bg-[#3E5A44] text-white
- **Type:** button
- **onClick:** `() => navigate('/vendor/home')`

## localStorage Keys

- `userCart`
- `isQuickShopFlow`
- `isMithilakFlow`
- `isFreshGroceryFlow`

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
