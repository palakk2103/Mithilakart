# File Audit: frontend/src/modules/seller/pages/returns/ReturnList.jsx

| Property | Value |
|----------|-------|
| Lines | 125 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | true |
| Has Table | false |
| Has Chart | false |
| Has Toast | true |

## Exports

- `default`

## Imports (8)

- `framer-motion`
- `lucide-react`
- `../../components/common`
- `../../components/ui`
- `../../components/common`
- `../../utils/dummyData`
- `../../utils/formatters`
- `react-hot-toast`

## Hooks / State

- useState('all')
- useState('')
- useState({ open: false, type: null, item: null })

## Buttons (3)

### Button 1
- **Label:** setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-
- **Type:** button
- **onClick:** `() => setActiveTab(tab.key)`

### Button 2
- **Label:** handleAction('approve', ret)}>Approve
- **Type:** button
- **onClick:** `() => handleAction('approve', ret)`

### Button 3
- **Label:** handleAction('reject', ret)}>Reject
- **Type:** button
- **onClick:** `() => handleAction('reject', ret)`

## Hardcoded / Mock Indicators

- contains mock/dummy references

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
