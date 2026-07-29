# File Audit: frontend/src/modules/admin/pages/comms/Notifications.jsx

| Property | Value |
|----------|-------|
| Lines | 207 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | true |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (2)

- `lucide-react`
- `framer-motion`

## Hooks / State

- useState(MOCK_HISTORY)
- useState(false)

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | text | false | e.g. Exclusive Weekend Sale! |
| unnamed | textarea | false | Write your message content here... |

## Buttons (7)

### Button 1
- **Label:** setIsComposeOpen(true)}
          className="w-full sm:w-auto flex items-center
- **Type:** button
- **onClick:** `() => setIsComposeOpen(true)`

### Button 2
- **Label:** (icon-only)
- **Type:** button
- **onClick:** ``

### Button 3
- **Label:** (icon-only)
- **Type:** button
- **onClick:** ``

### Button 4
- **Label:** setIsComposeOpen(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-
- **Type:** button
- **onClick:** `() => setIsComposeOpen(false)`

### Button 5
- **Label:** Change
- **Type:** button
- **onClick:** ``

### Button 6
- **Label:** setIsComposeOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 round
- **Type:** button
- **onClick:** `() => setIsComposeOpen(false)`

### Button 7
- **Label:** Send Now
- **Type:** button
- **onClick:** ``

## Hardcoded / Mock Indicators

- contains mock/dummy references

## Backend Dependency Inference

Contains data tables — requires paginated list API with filters/sort.
