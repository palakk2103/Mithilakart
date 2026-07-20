# File Audit: frontend/src/modules/user/components/common/LanguageSelector.jsx

| Property | Value |
|----------|-------|
| Lines | 65 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (2)

- `react-i18next`
- `lucide-react`

## Hooks / State

- useState(false)
- useTranslation

## Buttons (2)

### Button 1
- **Label:** setIsOpen(!isOpen)}
        className={`flex items-center justify-center gap-1 
- **Type:** button
- **onClick:** `() => setIsOpen(!isOpen)`

### Button 2
- **Label:** handleLanguageChange(lang.code)}
                  className={`w-full flex item
- **Type:** button
- **onClick:** `() => handleLanguageChange(lang.code)`

## localStorage Keys

- `user_language`

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
