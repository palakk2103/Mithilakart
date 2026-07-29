# File Audit: frontend/src/modules/user/pages/profile/OrderDetail.jsx

| Property | Value |
|----------|-------|
| Lines | 246 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (6)

- `lucide-react`
- `react-router-dom`
- `framer-motion`
- `../../../../store/useAccountStore`
- `../../../../shared/utils/priceFormatter`
- `react-i18next`

## Hooks / State

- useState(false)
- useAccountStore
- useTranslation
- useNavigate
- useParams

## Buttons (2)

### Button 1
- **Label:** navigate(-1)} className={`p-1 -ml-1 hover:bg-slate-50 rounded-full transition-co
- **Type:** button
- **onClick:** `() => navigate(-1)`

### Button 2
- **Label:** {isDownloading ? 'Downloading...' : 'Download Invoice'}
- **Type:** button
- **onClick:** `handleDownloadInvoice`

## localStorage Keys

- `isQuickShopFlow`
- `isMithilakFlow`
- `isFreshGroceryFlow`

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
