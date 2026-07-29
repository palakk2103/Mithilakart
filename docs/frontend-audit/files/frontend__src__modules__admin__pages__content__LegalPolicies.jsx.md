# File Audit: frontend/src/modules/admin/pages/content/LegalPolicies.jsx

| Property | Value |
|----------|-------|
| Lines | 180 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (2)

- `lucide-react`
- `framer-motion`

## Hooks / State

- useState('privacy')
- useState(false)
- useState(`Privacy Policy for Cocio

Last Update)
- useState(`Terms & Conditions for Cocio

1. ACCE)
- useState(false)
- useState(false)

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | textarea | false |  |

## Buttons (5)

### Button 1
- **Label:** setIsEditing(true)}
              className="flex items-center gap-2 bg-blue-60
- **Type:** button
- **onClick:** `() => setIsEditing(true)`

### Button 2
- **Label:** Discard
- **Type:** button
- **onClick:** `handleDiscard`

### Button 3
- **Label:** {isSaving ? (
                  
                ) : (
                  
  
- **Type:** button
- **onClick:** `handleSave`

### Button 4
- **Label:** setActiveTab('privacy')}
            className={`flex-1 py-5 text-sm font-bold 
- **Type:** button
- **onClick:** `() => setActiveTab('privacy')`

### Button 5
- **Label:** setActiveTab('terms')}
            className={`flex-1 py-5 text-sm font-bold tr
- **Type:** button
- **onClick:** `() => setActiveTab('terms')`

## Hardcoded / Mock Indicators

- contains mock/dummy references

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
