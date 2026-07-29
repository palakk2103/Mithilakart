# File Audit: frontend/src/modules/seller/pages/reviews/ReviewList.jsx

| Property | Value |
|----------|-------|
| Lines | 142 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | true |

## Exports

- `default`

## Imports (7)

- `lucide-react`
- `framer-motion`
- `../../components/common`
- `../../components/ui`
- `../../utils/dummyData`
- `../../utils/formatters`
- `react-hot-toast`

## Hooks / State

- useState('')
- useState('all')
- useState(null)
- useState('')

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | text | false |  |

## Buttons (5)

### Button 1
- **Label:** setRatingFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs 
- **Type:** button
- **onClick:** `() => setRatingFilter(r)`

### Button 2
- **Label:** handleReply(review.id)}>Send
- **Type:** button
- **onClick:** `() => handleReply(review.id)`

### Button 3
- **Label:** setReplyBoxId(replyBoxId === review.id ? null : review.id)}
                   
- **Type:** button
- **onClick:** `() => setReplyBoxId(replyBoxId === review.id ? null : review.id)`

### Button 4
- **Label:** toast.success('Review hidden')}
                    className="p-2 rounded-lg h
- **Type:** button
- **onClick:** `() => toast.success('Review hidden')`

### Button 5
- **Label:** toast.success('Review reported')}
                    className="p-2 rounded-lg
- **Type:** button
- **onClick:** `() => toast.success('Review reported')`

## Hardcoded / Mock Indicators

- contains mock/dummy references

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
