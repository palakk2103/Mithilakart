# File Audit: frontend/src/modules/seller/pages/orders/OrderDetail.jsx

| Property | Value |
|----------|-------|
| Lines | 178 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (8)

- `react`
- `react-router-dom`
- `framer-motion`
- `lucide-react`
- `../../components/common`
- `../../components/ui`
- `../../utils/dummyData`
- `../../utils/formatters`

## Hooks / State

- useNavigate
- useParams

## Buttons (3)

### Button 1
- **Label:** navigate('/seller/orders')} className="mt-4">Go Back
- **Type:** button
- **onClick:** `() => navigate('/seller/orders')`

### Button 2
- **Label:** navigate('/seller/orders')}>Back
- **Type:** button
- **onClick:** `() => navigate('/seller/orders')`

### Button 3
- **Label:** Print Invoice
- **Type:** button
- **onClick:** `handlePrint`

## Hardcoded / Mock Indicators

- contains mock/dummy references

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
