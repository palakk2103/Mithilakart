# File Audit: frontend/src/modules/admin/pages/Products.jsx

| Property | Value |
|----------|-------|
| Lines | 224 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | true |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (4)

- `../../../shared/components/SearchInput`
- `lucide-react`
- `framer-motion`
- `../components/ui`

## Hooks / State

- useState('All')
- useState('')
- useState(1)

## Buttons (7)

### Button 1
- **Label:** Export
- **Type:** button
- **onClick:** ``

### Button 2
- **Label:** Add Product
- **Type:** button
- **onClick:** ``

### Button 3
- **Label:** { setActiveTab(tab); setCurrentPage(1); }}
                className={`px-6 py-
- **Type:** button
- **onClick:** `() => { setActiveTab(tab); setCurrentPage(1); `

### Button 4
- **Label:** Filters
- **Type:** button
- **onClick:** ``

### Button 5
- **Label:** (icon-only)
- **Type:** button
- **onClick:** ``

### Button 6
- **Label:** (icon-only)
- **Type:** button
- **onClick:** ``

### Button 7
- **Label:** (icon-only)
- **Type:** button
- **onClick:** ``

## Hardcoded / Mock Indicators

- URL: https://images.unsplash.com/photo-1696446701796-da61225697cc?w=100
- URL: https://images.unsplash.com/photo-1670057037305-64d84711833d?w=100
- URL: https://images.unsplash.com/photo-1695213601569-8088019316d3?w=100
- URL: https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100
- URL: https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=100

## Backend Dependency Inference

Contains data tables — requires paginated list API with filters/sort.
