# File Audit: frontend/src/modules/admin/components/ui/Pagination.jsx

| Property | Value |
|----------|-------|
| Lines | 130 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (2)

- `react`
- `lucide-react`

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | select | false |  |

## Buttons (5)

### Button 1
- **Label:** onPageChange(1)}
            disabled={currentPage === 1}
            classNam
- **Type:** button
- **onClick:** `() => onPageChange(1)`

### Button 2
- **Label:** onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
      
- **Type:** button
- **onClick:** `() => onPageChange(currentPage - 1)`

### Button 3
- **Label:** onPageChange(page)}
                className={`w-8 h-8 flex items-center justi
- **Type:** button
- **onClick:** `() => onPageChange(page)`

### Button 4
- **Label:** onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages
- **Type:** button
- **onClick:** `() => onPageChange(currentPage + 1)`

### Button 5
- **Label:** onPageChange(totalPages)}
            disabled={currentPage === totalPages}
  
- **Type:** button
- **onClick:** `() => onPageChange(totalPages)`

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
