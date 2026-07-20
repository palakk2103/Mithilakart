# File Audit: frontend/src/modules/user/pages/ContinueShopping.jsx

| Property | Value |
|----------|-------|
| Lines | 292 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (3)

- `react-router-dom`
- `lucide-react`
- `../../../data/categoryData`

## Hooks / State

- useState('Trending')
- useNavigate
- useLocation
- useParams

## Buttons (5)

### Button 1
- **Label:** navigate(-1)} className="p-1 hover:bg-white/10 rounded-full active:scale-95 tran
- **Type:** button
- **onClick:** `() => navigate(-1)`

### Button 2
- **Label:** navigate('/vendor/search')} className="p-1 hover:bg-white/10 rounded-full">
- **Type:** button
- **onClick:** `() => navigate('/vendor/search')`

### Button 3
- **Label:** setActiveFilter(filter)}
                className={`whitespace-nowrap px-4 py-
- **Type:** button
- **onClick:** `() => setActiveFilter(filter)`

### Button 4
- **Label:** {trend}
- **Type:** button
- **onClick:** ``

### Button 5
- **Label:** View all
- **Type:** button
- **onClick:** ``

## Hardcoded / Mock Indicators

- URL: https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400&h=400
- URL: https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=200&h=200
- URL: https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=200&h=200
- URL: https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=200&h=200
- URL: https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=200&h=200
- URL: https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&q=80&w=200&h=200

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
