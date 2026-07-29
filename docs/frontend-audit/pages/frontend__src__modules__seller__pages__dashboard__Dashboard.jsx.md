# File Audit: frontend/src/modules/seller/pages/dashboard/Dashboard.jsx

| Property | Value |
|----------|-------|
| Lines | 311 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | true |
| Has Toast | false |

## Exports

- `default`

## Imports (10)

- `react-router-dom`
- `framer-motion`
- `lucide-react`
- `recharts`
- `../../components/common`
- `../../components/ui`
- `../../components/ui/Skeleton`
- `../../utils/formatters`
- `../../utils/dummyData`
- `../../constants`

## Hooks / State

- useState(true)
- useEffect x1
- useNavigate

## Routes Defined

| Path | Component |
|------|----------|
| `/seller/products/add` | object-route |
| `/seller/orders` | object-route |
| `/seller/analytics` | object-route |
| `/seller/coupons` | object-route |
| `/seller/inventory` | object-route |
| `/seller/earnings` | object-route |

## Buttons (5)

### Button 1
- **Label:** navigate('/seller/products/add')}
          className="flex items-center gap-2 
- **Type:** button
- **onClick:** `() => navigate('/seller/products/add')`

### Button 2
- **Label:** navigate(action.path)}
                className={`flex flex-col items-center g
- **Type:** button
- **onClick:** `() => navigate(action.path)`

### Button 3
- **Label:** navigate('/seller/orders')} className="text-xs font-semibold text-blue-600 hover
- **Type:** button
- **onClick:** `() => navigate('/seller/orders')`

### Button 4
- **Label:** Restock
- **Type:** button
- **onClick:** ``

### Button 5
- **Label:** navigate('/seller/reviews')} className="text-xs font-semibold text-blue-600 hove
- **Type:** button
- **onClick:** `() => navigate('/seller/reviews')`

## Hardcoded / Mock Indicators

- contains mock/dummy references

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
