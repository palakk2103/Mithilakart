# File Audit: frontend/src/modules/user/pages/profile/HelpCenter.jsx

| Property | Value |
|----------|-------|
| Lines | 279 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (4)

- `lucide-react`
- `react-router-dom`
- `framer-motion`
- `../../../../shared/components/SearchInput`

## Hooks / State

- useState('')
- useState(null)
- useNavigate

## Routes Defined

| Path | Component |
|------|----------|
| `/vendor/privacy` | object-route |
| `/vendor/terms` | object-route |
| `/vendor/cancellation-returns` | object-route |
| `/vendor/shipping` | object-route |

## Buttons (2)

### Button 1
- **Label:** navigate(-1)} 
            className={`active:scale-90 transition-transform ${h
- **Type:** button
- **onClick:** `() => navigate(-1)`

### Button 2
- **Label:** setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="
- **Type:** button
- **onClick:** `() => setExpandedFaq(expandedFaq === idx ? null : idx)`

## localStorage Keys

- `isQuickShopFlow`
- `isMithilakFlow`
- `isFreshGroceryFlow`

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
