# File Audit: frontend/src/modules/admin/pages/AddProduct.jsx

| Property | Value |
|----------|-------|
| Lines | 389 |
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

- useState([])
- useState(false)

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | text | false | e.g. Premium Leather Satchel |
| unnamed | select | false |  |
| unnamed | text | false | e.g. Bags & Backpacks |
| unnamed | textarea | false | Tell customers about the product features, materials, and unique selling points... |
| unnamed | number | false | 0.00 |
| unnamed | number | false | 0.00 |
| unnamed | number | false | 1 |
| unnamed | text | false | e.g. 1 |
| unnamed | text | false | e.g. Cotton |
| unnamed | text | false | e.g. Full Sleeve |
| unnamed | text | false | e.g. Solid |
| unnamed | text | false | e.g. Spread |
| unnamed | text | false | e.g. Navy Blue |
| unnamed | text | false | e.g. Regular Fit |
| unnamed | text | false | e.g. Machine Wash |
| unnamed | text | false | e.g. Western Wear |
| unnamed | text | false | e.g. Curved |
| unnamed | number | false | 0.5 |
| unnamed | number | false | 10 |
| unnamed | number | false | 10 |
| unnamed | number | false | 5 |
| unnamed | select | false |  |
| unnamed | text | false | e.g. 4202 |
| unnamed | text | false | Generic |
| unnamed | text | false | new, trending, summer |
| unnamed | textarea | false | Manufacturer details, origin, etc. |

## Buttons (5)

### Button 1
- **Label:** Save as Draft
- **Type:** button
- **onClick:** ``

### Button 2
- **Label:** {saved ?  : }
            {saved ? 'Product Published!' : 'Publish to Catalog'}
- **Type:** button
- **onClick:** `handleSave`

### Button 3
- **Label:** + Add Attribute
- **Type:** button
- **onClick:** ``

### Button 4
- **Label:** handleRemoveImage(i)}
                         className="absolute top-2 right-
- **Type:** button
- **onClick:** `() => handleRemoveImage(i)`

### Button 5
- **Label:** Add URL
- **Type:** button
- **onClick:** `handleAddImage`

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
