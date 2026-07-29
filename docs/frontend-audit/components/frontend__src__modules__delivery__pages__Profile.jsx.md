# File Audit: frontend/src/modules/delivery/pages/Profile.jsx

| Property | Value |
|----------|-------|
| Lines | 103 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (3)

- `react-router-dom`
- `lucide-react`
- `framer-motion`

## Hooks / State

- useState(true)
- useNavigate

## Routes Defined

| Path | Component |
|------|----------|
| `/delivery/profile/edit` | object-route |
| `/delivery/earnings` | object-route |
| `/delivery/settings` | object-route |
| `/delivery/support` | object-route |
| `/delivery/about` | object-route |

## Buttons (3)

### Button 1
- **Label:** setIsOnline(!isOnline)}
            className={`w-12 h-6 rounded-full relative 
- **Type:** button
- **onClick:** `() => setIsOnline(!isOnline)`

### Button 2
- **Label:** navigate(item.path)}
            className="w-full bg-white rounded-xl p-3.5 bo
- **Type:** button
- **onClick:** `() => navigate(item.path)`

### Button 3
- **Label:** Logout
- **Type:** button
- **onClick:** `handleLogout`

## localStorage Keys

- `isDeliveryAuthenticated`

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
