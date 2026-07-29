# File Audit: frontend/src/modules/admin/pages/system/AuditLogs.jsx

| Property | Value |
|----------|-------|
| Lines | 177 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
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

- useState('Activity')
- useState('')
- useState(1)

## Buttons (2)

### Button 1
- **Label:** Export Logs
- **Type:** button
- **onClick:** ``

### Button 2
- **Label:** { setActiveTab(tab); setCurrentPage(1); setSearchQuery(''); }}
                
- **Type:** button
- **onClick:** `() => { setActiveTab(tab); setCurrentPage(1); setSearchQuery(''); `

## Hardcoded / Mock Indicators

- contains mock/dummy references

## Backend Dependency Inference

Contains data tables — requires paginated list API with filters/sort.
