# File Audit: frontend/src/modules/delivery/pages/PersonalInfo.jsx

| Property | Value |
|----------|-------|
| Lines | 262 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | true |
| Has Table | false |
| Has Chart | false |
| Has Toast | true |

## Exports

- `default`

## Imports (5)

- `react-router-dom`
- `lucide-react`
- `react-hot-toast`
- `framer-motion`
- `../../../store/useDeliveryStore`

## Hooks / State

- useState(false)
- useState(profile)
- useState(null)
- useEffect x1
- useDeliveryStore
- useNavigate

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | text | false |  |
| unnamed | text | false |  |
| unnamed | text | false |  |
| unnamed | text | false |  |

## Buttons (5)

### Button 1
- **Label:** navigate(-1)} className="p-2 -ml-2 text-slate-600">
- **Type:** button
- **onClick:** `() => navigate(-1)`

### Button 2
- **Label:** setIsEditing(!isEditing)}
          className={`p-2 rounded-xl transition-color
- **Type:** button
- **onClick:** `() => setIsEditing(!isEditing)`

### Button 3
- **Label:** (icon-only)
- **Type:** button
- **onClick:** ``

### Button 4
- **Label:** setSelectedImage({ url: formData[doc.key], label: doc.label })}
               
- **Type:** button
- **onClick:** `() => setSelectedImage({ url: formData[doc.key], label: doc.label `

### Button 5
- **Label:** setSelectedImage(null)} className="p-3 bg-white/10 text-white rounded-full backd
- **Type:** button
- **onClick:** `() => setSelectedImage(null)`

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
