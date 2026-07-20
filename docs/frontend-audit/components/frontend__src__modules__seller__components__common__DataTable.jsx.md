# File Audit: frontend/src/modules/seller/components/common/DataTable.jsx

| Property | Value |
|----------|-------|
| Lines | 214 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | true |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (4)

- `lucide-react`
- `framer-motion`
- `../ui`
- `../../constants`

## Hooks / State

- useState({ key: null, direction: 'asc' })
- useState(1)
- useState(defaultPageSize)

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | select | false |  |

## Buttons (5)

### Button 1
- **Label:** setCurrentPage(1)}
              disabled={currentPage === 1}
              cl
- **Type:** button
- **onClick:** `() => setCurrentPage(1)`

### Button 2
- **Label:** setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage 
- **Type:** button
- **onClick:** `() => setCurrentPage((p) => Math.max(1, p - 1))`

### Button 3
- **Label:** setCurrentPage(pageNum)}
                  className={`
                    w-
- **Type:** button
- **onClick:** `() => setCurrentPage(pageNum)`

### Button 4
- **Label:** setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={cur
- **Type:** button
- **onClick:** `() => setCurrentPage((p) => Math.min(totalPages, p + 1))`

### Button 5
- **Label:** setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
- **Type:** button
- **onClick:** `() => setCurrentPage(totalPages)`

## Backend Dependency Inference

Contains data tables — requires paginated list API with filters/sort.
