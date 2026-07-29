# File Audit: frontend/src/modules/admin/pages/operations/Refunds.jsx

| Property | Value |
|----------|-------|
| Lines | 244 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | true |
| Has Table | true |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (5)

- `../../../../shared/components/SearchInput`
- `lucide-react`
- `framer-motion`
- `../../constants/dummyData`
- `../../components/ui`

## Hooks / State

- useState(MOCK_REFUNDS)
- useState('All')
- useState('')
- useState(1)
- useState(null)
- useState(null)
- useState(false)
- useState(false)

## Buttons (6)

### Button 1
- **Label:** Export CSV
- **Type:** button
- **onClick:** ``

### Button 2
- **Label:** { setActiveTab(tab); setCurrentPage(1); }}
                className={`px-6 py-
- **Type:** button
- **onClick:** `() => { setActiveTab(tab); setCurrentPage(1); `

### Button 3
- **Label:** Filters
- **Type:** button
- **onClick:** ``

### Button 4
- **Label:** handleActionClick(ref, 'approve')}
                            className="px-3 
- **Type:** button
- **onClick:** `() => handleActionClick(ref, 'approve')`

### Button 5
- **Label:** handleActionClick(ref, 'reject')}
                            className="px-3 p
- **Type:** button
- **onClick:** `() => handleActionClick(ref, 'reject')`

### Button 6
- **Label:** (icon-only)
- **Type:** button
- **onClick:** ``

## Hardcoded / Mock Indicators

- contains mock/dummy references

## Backend Dependency Inference

Contains data tables — requires paginated list API with filters/sort.
