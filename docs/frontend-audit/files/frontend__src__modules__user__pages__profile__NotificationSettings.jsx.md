# File Audit: frontend/src/modules/user/pages/profile/NotificationSettings.jsx

| Property | Value |
|----------|-------|
| Lines | 116 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (3)

- `lucide-react`
- `react-router-dom`
- `framer-motion`

## Hooks / State

- useState({
    offers: true,
    updates: true,)
- useNavigate

## Buttons (3)

### Button 1
- **Label:** navigate(-1)} className={`p-1 rounded-full hover:bg-slate-50 transition-colors $
- **Type:** button
- **onClick:** `() => navigate(-1)`

### Button 2
- **Label:** toggleSetting(item.id)}
                    className={`w-12 h-6.5 rounded-full
- **Type:** button
- **onClick:** `() => toggleSetting(item.id)`

### Button 3
- **Label:** toggleSetting('newsletter')}
                className={`w-12 h-6.5 rounded-ful
- **Type:** button
- **onClick:** `() => toggleSetting('newsletter')`

## localStorage Keys

- `isQuickShopFlow`
- `isMithilakFlow`
- `isFreshGroceryFlow`

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
