# File Audit: frontend/src/modules/delivery/pages/OrderDetail.jsx

| Property | Value |
|----------|-------|
| Lines | 378 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | true |
| Has Table | false |
| Has Chart | false |
| Has Toast | true |

## Exports

- `default`

## Imports (3)

- `lucide-react`
- `framer-motion`
- `react-hot-toast`

## Hooks / State

- useState(false)
- useState(false)
- useState('accepted')
- useState('')
- useState(false)
- useState(false)
- useState(false)
- useState(null)
- useState(null)
- useState(false)
- useEffect x1
- useNavigate

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | tel | false |  |

## Buttons (12)

### Button 1
- **Label:** (icon-only)
- **Type:** button
- **onClick:** `clear`

### Button 2
- **Label:** (icon-only)
- **Type:** button
- **onClick:** `onClose`

### Button 3
- **Label:** (icon-only)
- **Type:** button
- **onClick:** `capture`

### Button 4
- **Label:** navigate('/delivery/orders')}
          className="mt-8 w-full bg-blue-600 text
- **Type:** button
- **onClick:** `() => navigate('/delivery/orders')`

### Button 5
- **Label:** navigate(-1)} className="p-2.5 bg-slate-100 rounded-xl text-slate-700">
- **Type:** button
- **onClick:** `() => navigate(-1)`

### Button 6
- **Label:** window.open(`https://www.google.com/maps/dir/`)} className="w-10 h-10 bg-blue-60
- **Type:** button
- **onClick:** `() => window.open(`https://www.google.com/maps/dir/`)`

### Button 7
- **Label:** window.open(`https://www.google.com/maps/dir/`)} className="w-10 h-10 bg-green-6
- **Type:** button
- **onClick:** `() => window.open(`https://www.google.com/maps/dir/`)`

### Button 8
- **Label:** setCapturedPhoto(null)} className="absolute top-3 right-3 p-2 bg-red-500 text-wh
- **Type:** button
- **onClick:** `() => setCapturedPhoto(null)`

### Button 9
- **Label:** setShowCamera(true)} className="w-full h-32 bg-slate-50 border-2 border-dashed b
- **Type:** button
- **onClick:** `() => setShowCamera(true)`

### Button 10
- **Label:** {otpVerified ? 'IDENTITY VERIFIED ✓' : 'VERIFY & COMPLETE'}
- **Type:** button
- **onClick:** `handleVerifyOTP`

### Button 11
- **Label:** setShowIssueModal(true)} className="w-full py-4 text-slate-400 font-black text-[
- **Type:** button
- **onClick:** `() => setShowIssueModal(true)`

### Button 12
- **Label:** setShowIssueModal(false)} className="w-full text-left p-4 bg-slate-50 rounded-2x
- **Type:** button
- **onClick:** `() => setShowIssueModal(false)`

## Hardcoded / Mock Indicators

- contains mock/dummy references
- URL: https://images.unsplash.com/photo-1539186607619-df476afe3ff1?auto=format&fit=crop&q=80&w=400
- URL: https://www.google.com/maps/dir/`)}
- URL: https://www.google.com/maps/dir/`)}

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
