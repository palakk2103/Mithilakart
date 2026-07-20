# File Audit: frontend/src/modules/user/pages/ForgotPassword.jsx

| Property | Value |
|----------|-------|
| Lines | 151 |
| Extension | .jsx |
| Has Form | true |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (3)

- `react-router-dom`
- `lucide-react`
- `framer-motion`

## Hooks / State

- useState('')
- useState(true)
- useState(false)
- useState('')
- useNavigate

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | text | false |  |

## Buttons (2)

### Button 1
- **Label:** navigate('/login')}
          className="bg-[#F26522]/10 hover:bg-[#F26522]/20 
- **Type:** button
- **onClick:** `() => navigate('/login')`

### Button 2
- **Label:** {
                  setUseEmail(!useEmail);
                  setInputVal('');
- **Type:** button
- **onClick:** `() => {
                  setUseEmail(!useEmail);
                  setInputVal('');
                  setError('');
                `

## Hardcoded / Mock Indicators

- URL: http://www.w3.org/2000/svg

## Backend Dependency Inference

Contains forms — requires corresponding POST/PUT API endpoints with validation.
