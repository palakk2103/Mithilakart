# File Audit: frontend/src/modules/seller/components/common/SearchFilter.jsx

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

## Imports (3)

- `lucide-react`
- `framer-motion`
- `../../../../shared/components/SearchInput`

## Hooks / State

- useState(false)
- useEffect x1

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | select | false |  |

## Buttons (3)

### Button 1
- **Label:** onSearchChange?.('')}
                className="text-gray-300 hover:text-gray-
- **Type:** button
- **onClick:** `() => onSearchChange?.('')`

### Button 2
- **Label:** setShowFilters(!showFilters)}
            className={`
              flex item
- **Type:** button
- **onClick:** `() => setShowFilters(!showFilters)`

### Button 3
- **Label:** {
                      filters.forEach((f) => onFilterChange?.(f.key, 'all'));
- **Type:** button
- **onClick:** `() => {
                      filters.forEach((f) => onFilterChange?.(f.key, 'all'));
                    `

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
