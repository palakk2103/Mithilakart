# File Audit: frontend/src/modules/admin/pages/vendors/SellerDetail.jsx

| Property | Value |
|----------|-------|
| Lines | 214 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (5)

- `react-router-dom`
- `lucide-react`
- `framer-motion`
- `../../constants/dummyData`
- `../../components/ui`

## Hooks / State

- useState(MOCK_SELLER_DETAIL)
- useState('Storefront')
- useNavigate
- useParams

## Buttons (4)

### Button 1
- **Label:** navigate(-1)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-sla
- **Type:** button
- **onClick:** `() => navigate(-1)`

### Button 2
- **Label:** Suspend Partner
- **Type:** button
- **onClick:** ``

### Button 3
- **Label:** Verify Account
- **Type:** button
- **onClick:** ``

### Button 4
- **Label:** setActiveTab(tab)}
              className={`w-full flex items-center gap-4 px-
- **Type:** button
- **onClick:** `() => setActiveTab(tab)`

## Hardcoded / Mock Indicators

- contains mock/dummy references

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
