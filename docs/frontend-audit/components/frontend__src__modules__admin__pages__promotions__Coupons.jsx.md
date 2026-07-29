# File Audit: frontend/src/modules/admin/pages/promotions/Coupons.jsx

| Property | Value |
|----------|-------|
| Lines | 221 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | true |
| Has Table | true |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (3)

- `../../../../shared/components/SearchInput`
- `lucide-react`
- `framer-motion`

## Hooks / State

- useState(MOCK_COUPONS)
- useState(false)
- useState('')

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | text | false | e.g. SUMMER2026 |
| unnamed | select | false |  |
| unnamed | number | false | 0 |
| unnamed | number | false | ₹0 |
| unnamed | number | false | 1 |
| unnamed | date | false |  |

## Buttons (8)

### Button 1
- **Label:** Export CSV
- **Type:** button
- **onClick:** ``

### Button 2
- **Label:** setIsAdding(true)}
            className="flex-1 sm:flex-none flex items-center
- **Type:** button
- **onClick:** `() => setIsAdding(true)`

### Button 3
- **Label:** (icon-only)
- **Type:** button
- **onClick:** ``

### Button 4
- **Label:** (icon-only)
- **Type:** button
- **onClick:** ``

### Button 5
- **Label:** (icon-only)
- **Type:** button
- **onClick:** ``

### Button 6
- **Label:** setIsAdding(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-cente
- **Type:** button
- **onClick:** `() => setIsAdding(false)`

### Button 7
- **Label:** setIsAdding(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-xl
- **Type:** button
- **onClick:** `() => setIsAdding(false)`

### Button 8
- **Label:** Publish Coupon
- **Type:** button
- **onClick:** ``

## Hardcoded / Mock Indicators

- contains mock/dummy references

## Backend Dependency Inference

Contains data tables — requires paginated list API with filters/sort.
