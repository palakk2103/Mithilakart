# File Audit: frontend/src/modules/admin/catalog/BannerManager.jsx

| Property | Value |
|----------|-------|
| Lines | 365 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (2)

- `lucide-react`
- `framer-motion`

## Hooks / State

- useState(INITIAL_BANNERS)
- useState('Home')
- useState(false)
- useState(null)
- useState(EMPTY_BANNER)
- useState(false)

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | select | false |  |
| unnamed | text | false |  |
| unnamed | text | false |  |
| unnamed | text | false |  |
| unnamed | text | false |  |
| unnamed | checkbox | false |  |

## Buttons (9)

### Button 1
- **Label:** Save Banner
- **Type:** button
- **onClick:** `onSave`

### Button 2
- **Label:** Cancel
- **Type:** button
- **onClick:** `onCancel`

### Button 3
- **Label:** { setIsAdding(true); setEditingId(null); setFormData(EMPTY_BANNER); }}
        
- **Type:** button
- **onClick:** `() => { setIsAdding(true); setEditingId(null); setFormData(EMPTY_BANNER); `

### Button 4
- **Label:** {saved ?  : }
            {saved ? 'Saved!' : 'Publish'}
- **Type:** button
- **onClick:** `handleSaveAll`

### Button 5
- **Label:** { setActiveTab(tab); setIsAdding(false); setEditingId(null); }}
            cla
- **Type:** button
- **onClick:** `() => { setActiveTab(tab); setIsAdding(false); setEditingId(null); `

### Button 6
- **Label:** handleToggle(banner.id)} className={`p-2 rounded-lg transition-all ${banner.acti
- **Type:** button
- **onClick:** `() => handleToggle(banner.id)`

### Button 7
- **Label:** handleEdit(banner)} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:b
- **Type:** button
- **onClick:** `() => handleEdit(banner)`

### Button 8
- **Label:** handleDelete(banner.id)} className="p-2 bg-slate-50 text-slate-400 rounded-lg ho
- **Type:** button
- **onClick:** `() => handleDelete(banner.id)`

### Button 9
- **Label:** setIsAdding(true)} className="px-4 py-2 bg-blue-500 text-white rounded-xl text-[
- **Type:** button
- **onClick:** `() => setIsAdding(true)`

## Hardcoded / Mock Indicators

- URL: https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=300&fit=crop
- URL: https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=300&fit=crop
- URL: https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=300&fit=crop
- URL: https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=300&fit=crop
- URL: https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=300&fit=crop
- URL: https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=300&fit=crop
- URL: https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=300&fit=crop
- URL: https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=300&fit=crop
- URL: https://images.unsplash.com/photo-1532330393533-443990a51d10?w=800&h=300&fit=crop
- URL: https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&h=300&fit=crop

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
