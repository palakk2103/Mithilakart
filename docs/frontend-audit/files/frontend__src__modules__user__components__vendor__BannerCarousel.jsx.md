# File Audit: frontend/src/modules/user/components/vendor/BannerCarousel.jsx

| Property | Value |
|----------|-------|
| Lines | 187 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (1)

- `framer-motion`

## Hooks / State

- useState(0)
- useState(true)
- useEffect x3

## Buttons (2)

### Button 1
- **Label:** {
              e.stopPropagation();
              setCurrentIndex((prev) => (
- **Type:** button
- **onClick:** `(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
            `

### Button 2
- **Label:** {
              e.stopPropagation();
              nextSlide();
            }
- **Type:** button
- **onClick:** `(e) => {
              e.stopPropagation();
              nextSlide();
            `

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
