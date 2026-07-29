# File Audit: frontend/src/modules/admin/catalog/HomeSectionsManager.jsx

| Property | Value |
|----------|-------|
| Lines | 331 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (4)

- `react-router-dom`
- `lucide-react`
- `framer-motion`
- `../../../store/useVendorStore`

## Hooks / State

- useState(homeSections)
- useState(false)
- useState(false)
- useState({ label: '', name: '', tag: '', title: ')
- useEffect x1
- useVendorStore
- useNavigate
- useParams

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | text | false |  |
| unnamed | text | false |  |
| unnamed | text | false |  |
| unnamed | text | false |  |
| unnamed | text | false |  |
| unnamed | text | false |  |
| unnamed | text | false |  |

## Buttons (7)

### Button 1
- **Label:** navigate('/admin/inventory/add')}
            className="flex-1 sm:flex-none fl
- **Type:** button
- **onClick:** `() => navigate('/admin/inventory/add')`

### Button 2
- **Label:** {saved ?  : }
            {saved ? 'Changes Published!' : 'Save & Publish'}
- **Type:** button
- **onClick:** `handleSaveAll`

### Button 3
- **Label:** (icon-only)
- **Type:** button
- **onClick:** ``

### Button 4
- **Label:** removeItem(index)} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg
- **Type:** button
- **onClick:** `() => removeItem(index)`

### Button 5
- **Label:** setIsAdding(true)}
                  className="w-full py-4 border-2 border-das
- **Type:** button
- **onClick:** `() => setIsAdding(true)`

### Button 6
- **Label:** Add Item
- **Type:** button
- **onClick:** `addItem`

### Button 7
- **Label:** setIsAdding(false)} className="px-6 py-2.5 bg-white text-slate-400 rounded-xl te
- **Type:** button
- **onClick:** `() => setIsAdding(false)`

## Hardcoded / Mock Indicators

- URL: https://...

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
