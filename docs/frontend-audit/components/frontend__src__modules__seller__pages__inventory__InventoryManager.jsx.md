# File Audit: frontend/src/modules/seller/pages/inventory/InventoryManager.jsx

| Property | Value |
|----------|-------|
| Lines | 109 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | true |
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

- useState('')

## Buttons (2)

### Button 1
- **Label:** toast.success(`Stock updated for ${row.title}`)}>Restock
- **Type:** button
- **onClick:** `() => toast.success(`Stock updated for ${row.title`

### Button 2
- **Label:** toast.success('Restock request sent')}>Restock
- **Type:** button
- **onClick:** `() => toast.success('Restock request sent')`

## Hardcoded / Mock Indicators

- contains mock/dummy references

## Backend Dependency Inference

Contains data tables — requires paginated list API with filters/sort.
