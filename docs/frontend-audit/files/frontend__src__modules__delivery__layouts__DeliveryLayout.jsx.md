# File Audit: frontend/src/modules/delivery/layouts/DeliveryLayout.jsx

| Property | Value |
|----------|-------|
| Lines | 95 |
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
- `react-router-dom`
- `lucide-react`
- `react`
- `framer-motion`

## Hooks / State

- useState(true)
- useNavigate
- useLocation

## Routes Defined

| Path | Component |
|------|----------|
| `/delivery/dashboard` | object-route |
| `/delivery/orders` | object-route |
| `/delivery/earnings` | object-route |
| `/delivery/profile` | object-route |

## Buttons (2)

### Button 1
- **Label:** setIsOnline(!isOnline)}
            className={`flex items-center gap-2 px-4 py
- **Type:** button
- **onClick:** `() => setIsOnline(!isOnline)`

### Button 2
- **Label:** navigate(item.path)}
                className="flex flex-col items-center gap-
- **Type:** button
- **onClick:** `() => navigate(item.path)`

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
