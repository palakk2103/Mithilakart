# File Audit: frontend/src/modules/user/pages/profile/EditProfile.jsx

| Property | Value |
|----------|-------|
| Lines | 230 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | true |

## Exports

- `default`

## Imports (5)

- `lucide-react`
- `react-router-dom`
- `framer-motion`
- `../../../../store/useAccountStore`
- `react-hot-toast`

## Hooks / State

- useState({ ...userProfile })
- useState({})
- useAccountStore
- useNavigate

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | file | false |  |
| unnamed | text | false |  |
| unnamed | email | false |  |
| unnamed | tel | false |  |
| unnamed | select | false |  |
| unnamed | date | false |  |

## Buttons (5)

### Button 1
- **Label:** navigate(-1)} className={`p-1 rounded-full hover:bg-slate-50 transition-colors $
- **Type:** button
- **onClick:** `() => navigate(-1)`

### Button 2
- **Label:** Save
- **Type:** button
- **onClick:** `handleSave`

### Button 3
- **Label:** fileInputRef.current.click()}
              className="absolute bottom-0 right-
- **Type:** button
- **onClick:** `() => fileInputRef.current.click()`

### Button 4
- **Label:** fileInputRef.current.click()}
            className="mt-4 text-[10px] font-blac
- **Type:** button
- **onClick:** `() => fileInputRef.current.click()`

### Button 5
- **Label:** Save Changes
- **Type:** button
- **onClick:** `handleSave`

## localStorage Keys

- `isQuickShopFlow`
- `isMithilakFlow`
- `isFreshGroceryFlow`

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
