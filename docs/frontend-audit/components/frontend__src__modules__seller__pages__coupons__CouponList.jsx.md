# File Audit: frontend/src/modules/seller/pages/coupons/CouponList.jsx

| Property | Value |
|----------|-------|
| Lines | 143 |
| Extension | .jsx |
| Has Form | true |
| Has Modal/Dialog | true |
| Has Table | false |
| Has Chart | false |
| Has Toast | true |

## Exports

- `default`

## Imports (8)

- `react-hook-form`
- `framer-motion`
- `lucide-react`
- `../../components/common`
- `../../components/ui`
- `../../utils/dummyData`
- `../../utils/formatters`
- `react-hot-toast`

## Hooks / State

- useState(false)
- useState({ open: false, coupon: null })
- useForm

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | text | true | SALE50 |
| unnamed | select | true |  |
| unnamed | number | true | 50 |
| minOrder | number | false | 500 |
| maxDiscount | number | false | 200 |
| unnamed | date | true |  |
| usageLimit | number | false | 100 |

## Buttons (4)

### Button 1
- **Label:** setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : 'Cr
- **Type:** button
- **onClick:** `() => setShowCreateForm(!showCreateForm)`

### Button 2
- **Label:** Create Coupon
- **Type:** submit
- **onClick:** ``

### Button 3
- **Label:** toast.success('Edit coupon')}>Edit
- **Type:** button
- **onClick:** `() => toast.success('Edit coupon')`

### Button 4
- **Label:** setDeleteModal({ open: true, coupon })}>Delete
- **Type:** button
- **onClick:** `() => setDeleteModal({ open: true, coupon `

## Hardcoded / Mock Indicators

- contains mock/dummy references

## Backend Dependency Inference

Contains forms — requires corresponding POST/PUT API endpoints with validation.
