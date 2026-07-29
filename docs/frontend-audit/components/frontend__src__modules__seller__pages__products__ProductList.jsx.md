# File Audit: frontend/src/modules/seller/pages/products/ProductList.jsx

| Property | Value |
|----------|-------|
| Lines | 216 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | true |
| Has Table | true |
| Has Chart | false |
| Has Toast | true |

## Exports

- `default`

## Imports (10)

- `react-router-dom`
- `framer-motion`
- `lucide-react`
- `../../components/common`
- `../../components/ui`
- `../../utils/dummyData`
- `../../utils/formatters`
- `../../hooks/usePagination`
- `../../hooks/useDebounce`
- `react-hot-toast`

## Hooks / State

- useState('table')
- useState('')
- useState({})
- useState({ open: false, product: null })
- useNavigate

## Buttons (6)

### Button 1
- **Label:** { e.stopPropagation(); navigate(`/seller/products/edit/${row.id}`); }}
        
- **Type:** button
- **onClick:** `(e) => { e.stopPropagation(); navigate(`/seller/products/edit/${row.id`

### Button 2
- **Label:** { e.stopPropagation(); handleDuplicate(row); }}
                className="p-2 
- **Type:** button
- **onClick:** `(e) => { e.stopPropagation(); handleDuplicate(row); `

### Button 3
- **Label:** { e.stopPropagation(); handleDelete(row); }}
                className="p-2 rou
- **Type:** button
- **onClick:** `(e) => { e.stopPropagation(); handleDelete(row); `

### Button 4
- **Label:** setViewMode('table')} className={`p-2 rounded-md transition-colors ${viewMode ==
- **Type:** button
- **onClick:** `() => setViewMode('table')`

### Button 5
- **Label:** setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode ===
- **Type:** button
- **onClick:** `() => setViewMode('grid')`

### Button 6
- **Label:** navigate('/seller/products/add')}>Add Product
- **Type:** button
- **onClick:** `() => navigate('/seller/products/add')`

## Hardcoded / Mock Indicators

- contains mock/dummy references

## Backend Dependency Inference

Contains data tables — requires paginated list API with filters/sort.
