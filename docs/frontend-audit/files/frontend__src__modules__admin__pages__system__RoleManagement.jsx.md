# File Audit: frontend/src/modules/admin/pages/system/RoleManagement.jsx

| Property | Value |
|----------|-------|
| Lines | 191 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | true |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (4)

- `lucide-react`
- `framer-motion`
- `../../constants/dummyData`
- `../../components/ui`

## Hooks / State

- useState(MOCK_ROLES)
- useState(false)
- useState(null)
- useState(false)
- useState({ name: '', description: '', permissions)

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | text | false | e.g. Content Writer |
| unnamed | text | false | Brief summary of duties and bounds |
| unnamed | checkbox | false |  |

## Buttons (5)

### Button 1
- **Label:** Create Custom Role
- **Type:** button
- **onClick:** `handleCreateNew`

### Button 2
- **Label:** setIsEditing(false)} className="text-xs font-bold text-slate-400 hover:text-slat
- **Type:** button
- **onClick:** `() => setIsEditing(false)`

### Button 3
- **Label:** setIsEditing(false)} className="px-6 py-3.5 bg-slate-50 text-slate-500 rounded-x
- **Type:** button
- **onClick:** `() => setIsEditing(false)`

### Button 4
- **Label:** Save Role Config
- **Type:** button
- **onClick:** `handleSave`

### Button 5
- **Label:** handleEdit(role)}
                  className="flex-1 py-2.5 bg-slate-50 hover:
- **Type:** button
- **onClick:** `() => handleEdit(role)`

## Hardcoded / Mock Indicators

- contains mock/dummy references

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
