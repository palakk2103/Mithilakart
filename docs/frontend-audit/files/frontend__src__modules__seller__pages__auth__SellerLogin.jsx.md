# File Audit: frontend/src/modules/seller/pages/auth/SellerLogin.jsx

| Property | Value |
|----------|-------|
| Lines | 166 |
| Extension | .jsx |
| Has Form | true |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | true |

## Exports

- `default`

## Imports (5)

- `react-router-dom`
- `framer-motion`
- `lucide-react`
- `react-hot-toast`
- `../../context/SellerAuthContext`

## Hooks / State

- useState('')
- useState('')
- useState(false)
- useState(false)
- useNavigate

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | text | false |  |
| unnamed | text | false |  |

## Buttons (2)

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

## Hardcoded / Mock Indicators

- URL: http://www.w3.org/2000/svg
- URL: http://www.w3.org/2000/svg
- URL: http://www.w3.org/2000/svg

## Backend Dependency Inference

Contains forms — requires corresponding POST/PUT API endpoints with validation.
