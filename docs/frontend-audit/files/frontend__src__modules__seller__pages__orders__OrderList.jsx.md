# File Audit: frontend/src/modules/seller/pages/orders/OrderList.jsx

| Property | Value |
|----------|-------|
| Lines | 114 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | true |
| Has Chart | false |
| Has Toast | true |

## Exports

- `default`

## Imports (7)

- `react-router-dom`
- `lucide-react`
- `../../components/common`
- `../../utils/dummyData`
- `../../utils/formatters`
- `../../hooks/useDebounce`
- `react-hot-toast`

## Hooks / State

- useState('all')
- useState('')
- useNavigate

## Buttons (2)

### Button 1
- **Label:** { e.stopPropagation(); navigate(`/seller/orders/${row.id}`); }}
              c
- **Type:** button
- **onClick:** `(e) => { e.stopPropagation(); navigate(`/seller/orders/${row.id`

### Button 2
- **Label:** setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-
- **Type:** button
- **onClick:** `() => setActiveTab(tab.key)`

## Hardcoded / Mock Indicators

- contains mock/dummy references

## Backend Dependency Inference

Contains data tables — requires paginated list API with filters/sort.
