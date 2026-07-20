# File Audit: frontend/src/modules/delivery/pages/Auth.jsx

| Property | Value |
|----------|-------|
| Lines | 176 |
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
- useState('')
- useState(false)
- useState(false)
- useState('')
- useEffect x1
- useNavigate

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | text | false |  |
| unnamed | text | false |  |

## Buttons (3)

### Button 1
- **Label:** navigate('/')}
          className="bg-white/20 hover:bg-white/30 text-white p-
- **Type:** button
- **onClick:** `() => navigate('/')`

### Button 2
- **Label:** setShowPassword(!showPassword)}
                className="absolute right-4 top
- **Type:** button
- **onClick:** `() => setShowPassword(!showPassword)`

### Button 3
- **Label:** navigate('/delivery/signup')} className="text-[#0a4a17] hover:underline">
     
- **Type:** button
- **onClick:** `() => navigate('/delivery/signup')`

## localStorage Keys

- `isDeliveryAuthenticated`

## Hardcoded / Mock Indicators

- URL: http://www.w3.org/2000/svg
- URL: http://www.w3.org/2000/svg
- URL: http://www.w3.org/2000/svg

## Backend Dependency Inference

Contains forms — requires corresponding POST/PUT API endpoints with validation.
