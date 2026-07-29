# File Audit: frontend/src/modules/user/pages/profile/SavedCards.jsx

| Property | Value |
|----------|-------|
| Lines | 306 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | true |
| Has Table | false |
| Has Chart | false |
| Has Toast | true |

## Exports

- `default`

## Imports (5)

- `lucide-react`
- `react-router-dom`
- `framer-motion`
- `../../../../store/useAccountStore`
- `react-hot-toast`

## Hooks / State

- useState(false)
- useState({
    number: '',
    expiry: '',
   )
- useAccountStore
- useNavigate

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | text | false | 0000 0000 0000 0000 |
| unnamed | text | false | Full name as on card |
| unnamed | text | false | MM/YY |
| unnamed | password | false | *** |

## Buttons (6)

### Button 1
- **Label:** navigate(-1)} className={`hover:opacity-80 transition-colors ${headerTextColor}`
- **Type:** button
- **onClick:** `() => navigate(-1)`

### Button 2
- **Label:** setIsModalOpen(true)} className="text-[#3E5A44]">
- **Type:** button
- **onClick:** `() => setIsModalOpen(true)`

### Button 3
- **Label:** handleDelete(card.id)}
                            className="text-white/60 hov
- **Type:** button
- **onClick:** `() => handleDelete(card.id)`

### Button 4
- **Label:** setIsModalOpen(true)}
          className="w-full bg-[var(--color-gold)] text-b
- **Type:** button
- **onClick:** `() => setIsModalOpen(true)`

### Button 5
- **Label:** setIsModalOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 
- **Type:** button
- **onClick:** `() => setIsModalOpen(false)`

### Button 6
- **Label:** Save Card
- **Type:** button
- **onClick:** `handleSave`

## localStorage Keys

- `isQuickShopFlow`
- `isMithilakFlow`
- `isFreshGroceryFlow`

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
