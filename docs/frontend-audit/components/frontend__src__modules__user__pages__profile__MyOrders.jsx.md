# File Audit: frontend/src/modules/user/pages/profile/MyOrders.jsx

| Property | Value |
|----------|-------|
| Lines | 494 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | true |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (9)

- `lucide-react`
- `react-router-dom`
- `framer-motion`
- `../../../../store/useAccountStore`
- `../../../../shared/components/SearchInput`
- `../../../../assets/TopBanner/ImageBanner1.jpg`
- `../../../../assets/TopBanner/ImageBanner2.jpg`
- `../../../../assets/TopBanner/ImageBanner3.webp`
- `../../../../assets/TopBanner/ImageBanner4.jpg`

## Hooks / State

- useState(0)
- useState(false)
- useState('')
- useState(false)
- useState(null)
- useState({})
- useState({
    status: 'All',
    time: 'Anytim)
- useEffect x1
- useAccountStore
- useNavigate

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | textarea | false | Share your experience with this product... |

## Buttons (13)

### Button 1
- **Label:** Shop Now
- **Type:** button
- **onClick:** ``

### Button 2
- **Label:** {
                if (i !== currentBanner) {
                  setIsBannerLoad
- **Type:** button
- **onClick:** `() => {
                if (i !== currentBanner) {
                  setIsBannerLoaded(false);
                  setCurrentBanner(i);
                `

### Button 3
- **Label:** navigate(-1)} className={`p-1 -ml-1 active:scale-90 transition-transform ${heade
- **Type:** button
- **onClick:** `() => navigate(-1)`

### Button 4
- **Label:** setSearchQuery('')} className="text-gray-400 hover:text-slate-600">
- **Type:** button
- **onClick:** `() => setSearchQuery('')`

### Button 5
- **Label:** setShowFilterSheet(true)}
                className={`bg-white border border-gr
- **Type:** button
- **onClick:** `() => setShowFilterSheet(true)`

### Button 6
- **Label:** navigate('/vendor/home')}
                    className="mt-10 bg-[#3E5A44] tex
- **Type:** button
- **onClick:** `() => navigate('/vendor/home')`

### Button 7
- **Label:** setShowReviewModal(null)} className="p-2 bg-gray-100 rounded-full">
- **Type:** button
- **onClick:** `() => setShowReviewModal(null)`

### Button 8
- **Label:** setShowReviewModal(null)}
                  className="w-full bg-slate-900 text
- **Type:** button
- **onClick:** `() => setShowReviewModal(null)`

### Button 9
- **Label:** setShowFilterSheet(false)} className="bg-gray-100 p-2 rounded-full active:scale-
- **Type:** button
- **onClick:** `() => setShowFilterSheet(false)`

### Button 10
- **Label:** setActiveFilters(prev => ({ ...prev, status: opt }))}
                         
- **Type:** button
- **onClick:** `() => setActiveFilters(prev => ({ ...prev, status: opt `

### Button 11
- **Label:** setActiveFilters(prev => ({ ...prev, time: opt }))}
                           
- **Type:** button
- **onClick:** `() => setActiveFilters(prev => ({ ...prev, time: opt `

### Button 12
- **Label:** {
                          setActiveFilters({ status: 'All', time: 'Anytime' }
- **Type:** button
- **onClick:** `() => {
                          setActiveFilters({ status: 'All', time: 'Anytime' `

### Button 13
- **Label:** setShowFilterSheet(false)}
                        className="flex-[2] py-4 bg-
- **Type:** button
- **onClick:** `() => setShowFilterSheet(false)`

## localStorage Keys

- `isQuickShopFlow`
- `isMithilakFlow`
- `isFreshGroceryFlow`

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
