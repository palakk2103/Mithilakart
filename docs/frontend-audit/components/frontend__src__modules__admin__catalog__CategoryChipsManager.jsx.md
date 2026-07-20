# File Audit: frontend/src/modules/admin/catalog/CategoryChipsManager.jsx

| Property | Value |
|----------|-------|
| Lines | 328 |
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

- useState(INITIAL_CATEGORIES)
- useState(false)
- useState(null)
- useState(EMPTY_CAT)
- useState(false)
- useState(BANNER_TABS)
- useState('')
- useState(false)

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | text | false |  |
| unnamed | text | false |  |
| unnamed | checkbox | false |  |
| unnamed | text | false |  |

## Buttons (11)

### Button 1
- **Label:** Save
- **Type:** button
- **onClick:** `onSave`

### Button 2
- **Label:** Cancel
- **Type:** button
- **onClick:** `onCancel`

### Button 3
- **Label:** { setIsAdding(true); setEditingId(null); setFormData(EMPTY_CAT); }}
           
- **Type:** button
- **onClick:** `() => { setIsAdding(true); setEditingId(null); setFormData(EMPTY_CAT); `

### Button 4
- **Label:** {saved ?  : }
            {saved ? 'Saved!' : 'Publish Changes'}
- **Type:** button
- **onClick:** `handleSaveAll`

### Button 5
- **Label:** handleToggle(cat.id)} className={`p-1.5 rounded-lg transition-all ${cat.active ?
- **Type:** button
- **onClick:** `() => handleToggle(cat.id)`

### Button 6
- **Label:** handleEdit(cat)} className="p-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg
- **Type:** button
- **onClick:** `() => handleEdit(cat)`

### Button 7
- **Label:** handleDelete(cat.id)} className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hov
- **Type:** button
- **onClick:** `() => handleDelete(cat.id)`

### Button 8
- **Label:** setBannerTabs(prev => prev.filter((_, idx) => idx !== i))} className="text-slate
- **Type:** button
- **onClick:** `() => setBannerTabs(prev => prev.filter((_, idx) => idx !== i))`

### Button 9
- **Label:** setIsAddingTab(true)}
              className="flex items-center gap-1.5 px-3 p
- **Type:** button
- **onClick:** `() => setIsAddingTab(true)`

### Button 10
- **Label:** Add
- **Type:** button
- **onClick:** `handleAddTab`

### Button 11
- **Label:** { setIsAddingTab(false); setNewTabName(''); }} className="px-3 py-2 bg-slate-100
- **Type:** button
- **onClick:** `() => { setIsAddingTab(false); setNewTabName(''); `

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
