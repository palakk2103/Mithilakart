# File Audit: frontend/src/modules/seller/pages/notifications/Notifications.jsx

| Property | Value |
|----------|-------|
| Lines | 114 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | true |

## Exports

- `default`

## Imports (7)

- `framer-motion`
- `lucide-react`
- `../../components/common`
- `../../components/ui`
- `../../utils/dummyData`
- `../../utils/formatters`
- `react-hot-toast`

## Hooks / State

- useState('all')
- useState(allNotifications)

## Buttons (3)

### Button 1
- **Label:** Mark All Read
- **Type:** button
- **onClick:** `markAllRead`

### Button 2
- **Label:** setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-me
- **Type:** button
- **onClick:** `() => setActiveTab(tab)`

### Button 3
- **Label:** { e.stopPropagation(); markAsRead(notif.id); }}
                  className="p-
- **Type:** button
- **onClick:** `(e) => { e.stopPropagation(); markAsRead(notif.id); `

## Hardcoded / Mock Indicators

- contains mock/dummy references

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
