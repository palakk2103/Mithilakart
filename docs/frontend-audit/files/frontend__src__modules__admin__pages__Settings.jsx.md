# File Audit: frontend/src/modules/admin/pages/Settings.jsx

| Property | Value |
|----------|-------|
| Lines | 227 |
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

- useState('Account')
- useState(false)

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | text | false |  |
| unnamed | email | false |  |
| unnamed | text | false |  |
| unnamed | text | false |  |
| unnamed | text | false |  |
| unnamed | email | false |  |
| unnamed | text | false |  |
| unnamed | select | false |  |
| unnamed | number | false |  |
| unnamed | text | false |  |
| unnamed | password | false | •••••••• |
| unnamed | password | false | •••••••• |

## Buttons (2)

### Button 1
- **Label:** {saved ?  : }
          {saved ? 'Settings Updated!' : 'Save Changes'}
- **Type:** button
- **onClick:** `handleSave`

### Button 2
- **Label:** setActiveSection(section.id)}
              className={`w-full flex items-cente
- **Type:** button
- **onClick:** `() => setActiveSection(section.id)`

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
