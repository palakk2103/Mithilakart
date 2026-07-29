# File Audit: frontend/src/modules/admin/pages/promotions/FlashSale.jsx

| Property | Value |
|----------|-------|
| Lines | 215 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | true |
| Has Table | true |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (2)

- `lucide-react`
- `framer-motion`

## Hooks / State

- useState(MOCK_SALES)
- useState(false)

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | text | false | e.g. Early Bird Special |
| unnamed | datetime-local | false |  |
| unnamed | datetime-local | false |  |
| unnamed | select | false |  |

## Buttons (8)

### Button 1
- **Label:** setIsAdding(true)}
            className="flex-1 sm:flex-none flex items-center
- **Type:** button
- **onClick:** `() => setIsAdding(true)`

### Button 2
- **Label:** Monitor Live
- **Type:** button
- **onClick:** ``

### Button 3
- **Label:** (icon-only)
- **Type:** button
- **onClick:** ``

### Button 4
- **Label:** (icon-only)
- **Type:** button
- **onClick:** ``

### Button 5
- **Label:** setIsAdding(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-cente
- **Type:** button
- **onClick:** `() => setIsAdding(false)`

### Button 6
- **Label:** + Add Manually
- **Type:** button
- **onClick:** ``

### Button 7
- **Label:** setIsAdding(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-xl
- **Type:** button
- **onClick:** `() => setIsAdding(false)`

### Button 8
- **Label:** Schedule Sale
- **Type:** button
- **onClick:** ``

## Hardcoded / Mock Indicators

- contains mock/dummy references

## Backend Dependency Inference

Contains data tables — requires paginated list API with filters/sort.
