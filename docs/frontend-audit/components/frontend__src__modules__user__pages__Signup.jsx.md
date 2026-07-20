# File Audit: frontend/src/modules/user/pages/Signup.jsx

| Property | Value |
|----------|-------|
| Lines | 467 |
| Extension | .jsx |
| Has Form | true |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (5)

- `react-router-dom`
- `lucide-react`
- `framer-motion`
- `react-i18next`
- `../services/authApi`

## Hooks / State

- useState('')
- useState(false)
- useState('+91')
- useState('')
- useState('')
- useState('')
- useState(false)
- useState(60)
- useState(false)
- useState(false)
- useState('')
- useState('')
- useEffect x1
- useTranslation
- useNavigate
- useLocation

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | text | false |  |
| unnamed | select | false |  |
| unnamed | tel | false |  |
| unnamed | email | false |  |
| unnamed | text | false |  |

## Buttons (4)

### Button 1
- **Label:** navigate(-1)}
          className="bg-[#F26522]/10 hover:bg-[#F26522]/20 text-[
- **Type:** button
- **onClick:** `() => navigate(-1)`

### Button 2
- **Label:** {
                setUseEmail(false);
                setOtpSent(false);
    
- **Type:** button
- **onClick:** `() => {
                setUseEmail(false);
                setOtpSent(false);
                setError('');
                setSuccess('');
                setOtp('');
              `

### Button 3
- **Label:** {
                setUseEmail(true);
                setOtpSent(false);
     
- **Type:** button
- **onClick:** `() => {
                setUseEmail(true);
                setOtpSent(false);
                setError('');
                setSuccess('');
                setOtp('');
              `

### Button 4
- **Label:** 0 || isSendingOtp || isVerifyingOtp}
                    className={`text-[#F26
- **Type:** button
- **onClick:** `handleResendOtp`

## localStorage Keys

- `isAuthenticated`

## Hardcoded / Mock Indicators

- URL: http://www.w3.org/2000/svg
- URL: http://www.w3.org/2000/svg
- URL: http://www.w3.org/2000/svg

## Backend Dependency Inference

Contains forms — requires corresponding POST/PUT API endpoints with validation.
