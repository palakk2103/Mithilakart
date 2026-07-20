# File Audit: frontend/src/modules/seller/pages/products/AddProduct.jsx

| Property | Value |
|----------|-------|
| Lines | 271 |
| Extension | .jsx |
| Has Form | true |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | true |

## Exports

- `default`

## Imports (10)

- `react-router-dom`
- `react-hook-form`
- `framer-motion`
- `lucide-react`
- `../../components/common`
- `../../components/common`
- `../../components/ui`
- `../../utils/dummyData`
- `../../constants`
- `react-hot-toast`

## Hooks / State

- useState('basic')
- useState([])
- useState(existingProduct?.specifications || [{ ke)
- useForm
- useNavigate
- useParams

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | text | true | Enter product title |
| shortDescription | text | false | Brief description (one liner) |
| unnamed | textarea | true | Detailed product description |
| unnamed | select | true |  |
| subcategory | select | false |  |
| brand | text | false | Brand name |
| unnamed | text | true | MH-XX-001 |
| tags | text | false | Comma-separated tags (e.g., handmade, organic) |
| unnamed | number | true | 0 |
| discountPrice | number | false | 0 |
| gst | select | false |  |
| unnamed | number | true | 0 |
| weight | number | false | 0.5 |
| dimensions | text | false | 40x30x0.5 |
| warranty | text | false | e.g., 1 year against manufacturing defects |
| unnamed | text | false |  |
| unnamed | text | false |  |
| highlights | textarea | false | Enter product highlights, one per line |
| seoTitle | text | false | SEO-friendly title |
| seoDescription | textarea | false | Meta description for search engines |
| returnPolicy | text | false | e.g., 7-day return if damaged |
| shippingInfo | textarea | false | Shipping details and estimated delivery |

## Buttons (6)

### Button 1
- **Label:** navigate('/seller/products')}>Back
- **Type:** button
- **onClick:** `() => navigate('/seller/products')`

### Button 2
- **Label:** setActiveSection(section.id)}
                className={`w-full flex items-cen
- **Type:** button
- **onClick:** `() => setActiveSection(section.id)`

### Button 3
- **Label:** setSpecifications(specifications.filter((_, j) => j !== i))} className="text-red
- **Type:** button
- **onClick:** `() => setSpecifications(specifications.filter((_, j) => j !== i))`

### Button 4
- **Label:** setSpecifications([...specifications, { key: '', value: '' }])}
               
- **Type:** button
- **onClick:** `() => setSpecifications([...specifications, { key: '', value: '' `

### Button 5
- **Label:** Save as Draft
- **Type:** button
- **onClick:** `onSaveDraft`

### Button 6
- **Label:** {isEdit ? 'Update Product' : 'Publish Product'}
- **Type:** submit
- **onClick:** ``

## Hardcoded / Mock Indicators

- contains mock/dummy references

## Backend Dependency Inference

Contains forms — requires corresponding POST/PUT API endpoints with validation.
