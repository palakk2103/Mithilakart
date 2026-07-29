# File Audit: frontend/src/modules/seller/pages/settings/Settings.jsx

| Property | Value |
|----------|-------|
| Lines | 199 |
| Extension | .jsx |
| Has Form | true |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | true |

## Exports

- `default`

## Imports (6)

- `react-hook-form`
- `lucide-react`
- `../../components/common`
- `../../components/ui`
- `../../utils/dummyData`
- `react-hot-toast`

## Hooks / State

- useState('profile')
- useState({
    orderAlerts: true,
    outOfStoc)
- useForm

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | text | false |  |
| unnamed | text | false |  |
| unnamed | email | false |  |
| unnamed | text | false |  |
| unnamed | textarea | false |  |
| unnamed | text | false |  |
| unnamed | text | false |  |
| unnamed | text | false |  |
| unnamed | text | false |  |
| unnamed | password | true |  |
| unnamed | password | true |  |
| unnamed | password | true |  |

## Buttons (4)

### Button 1
- **Label:** setActiveTab(tab.id)}
                className={`w-full flex items-center gap-
- **Type:** button
- **onClick:** `() => setActiveTab(tab.id)`

### Button 2
- **Label:** Save Profile Details
- **Type:** submit
- **onClick:** ``

### Button 3
- **Label:** Save Bank Details
- **Type:** submit
- **onClick:** ``

### Button 4
- **Label:** Update Password
- **Type:** submit
- **onClick:** ``

## Hardcoded / Mock Indicators

- contains mock/dummy references

## Backend Dependency Inference

Contains forms — requires corresponding POST/PUT API endpoints with validation.
