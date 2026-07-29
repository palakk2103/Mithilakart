# File Audit: frontend/src/modules/user/pages/CategoryProducts.jsx

| Property | Value |
|----------|-------|
| Lines | 573 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | true |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (12)

- `react-router-dom`
- `lucide-react`
- `../../../assets/products/product12.jpg`
- `../../../assets/products/product08.jpg`
- `../../../assets/products/product01.jpg`
- `../../../assets/products/product03.jpg`
- `../../../assets/Beauty/BeautyJewel1.jpg`
- `../../../assets/Beauty/BeautyJewel2.jpg`
- `../../../assets/Beauty/BeautyJewel3.jpg`
- `../../../assets/Beauty/BeautyJewel4.jpg`
- `../../../assets/Beauty/BeautyJewel5.jpg`
- `../../../assets/Beauty/BeautyJewel6.jpg`

## Hooks / State

- useState(false)
- useState('Popularity')
- useState(false)
- useState(false)
- useState(0)
- useEffect x1

## Buttons (7)

### Button 1
- **Label:** {
            e.stopPropagation();
            e.preventDefault();
          
- **Type:** button
- **onClick:** `(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsWishlisted(!isWishlisted);
          `

### Button 2
- **Label:** setShowSortModal(true)}
            className="flex-1 flex items-center justify
- **Type:** button
- **onClick:** `() => setShowSortModal(true)`

### Button 3
- **Label:** setShowFilterModal(true)}
            className="flex-1 flex items-center justi
- **Type:** button
- **onClick:** `() => setShowFilterModal(true)`

### Button 4
- **Label:** {
                    setActiveSort(option);
                    setShowSortMo
- **Type:** button
- **onClick:** `() => {
                    setActiveSort(option);
                    setShowSortModal(false);
                  `

### Button 5
- **Label:** setShowFilterModal(false)} className="text-white">✕
- **Type:** button
- **onClick:** `() => setShowFilterModal(false)`

### Button 6
- **Label:** setShowFilterModal(false)} className="flex-1 py-4 text-[11px] font-black text-gr
- **Type:** button
- **onClick:** `() => setShowFilterModal(false)`

### Button 7
- **Label:** setShowFilterModal(false)} className="flex-[2] py-4 bg-[#3E5A44] text-black text
- **Type:** button
- **onClick:** `() => setShowFilterModal(false)`

## localStorage Keys

- `userCart`

## Hardcoded / Mock Indicators

- URL: http://www.w3.org/2000/svg
- URL: http://www.w3.org/2000/svg

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
