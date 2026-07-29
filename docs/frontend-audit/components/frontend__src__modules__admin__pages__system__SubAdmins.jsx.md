# File Audit: frontend/src/modules/admin/pages/system/SubAdmins.jsx

| Property | Value |
|----------|-------|
| Lines | 189 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | true |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (3)

- `lucide-react`
- `framer-motion`
- `../../../../shared/components/SearchInput`

## Hooks / State

- useState(MOCK_ADMINS)
- useState(false)

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | text | false | Enter name |
| unnamed | email | false | example@cocia.com |
| unnamed | select | false |  |

## Buttons (6)

### Button 1
- **Label:** setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-bl
- **Type:** button
- **onClick:** `() => setIsAdding(true)`

### Button 2
- **Label:** (icon-only)
- **Type:** button
- **onClick:** ``

### Button 3
- **Label:** (icon-only)
- **Type:** button
- **onClick:** ``

### Button 4
- **Label:** setIsAdding(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-cente
- **Type:** button
- **onClick:** `() => setIsAdding(false)`

### Button 5
- **Label:** setIsAdding(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-xl
- **Type:** button
- **onClick:** `() => setIsAdding(false)`

### Button 6
- **Label:** Create Account
- **Type:** button
- **onClick:** ``

## Hardcoded / Mock Indicators

- contains mock/dummy references

## Backend Dependency Inference

Contains data tables — requires paginated list API with filters/sort.
