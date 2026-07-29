# File Audit: frontend/src/modules/admin/vendors/VendorApproval.jsx

| Property | Value |
|----------|-------|
| Lines | 131 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (5)

- `react`
- `react-redux`
- `../../../store/slices/adminSlice`
- `lucide-react`
- `framer-motion`

## Hooks / State

- useSelector
- useDispatch

## Buttons (2)

### Button 1
- **Label:** handleReject(vendor.id)}
                    className="flex-1 py-4 border bord
- **Type:** button
- **onClick:** `() => handleReject(vendor.id)`

### Button 2
- **Label:** handleApprove(vendor.id)}
                    className="flex-[2] py-4 bg-black
- **Type:** button
- **onClick:** `() => handleApprove(vendor.id)`

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
