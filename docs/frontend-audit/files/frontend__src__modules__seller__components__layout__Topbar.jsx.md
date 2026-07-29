# File Audit: frontend/src/modules/seller/components/layout/Topbar.jsx

| Property | Value |
|----------|-------|
| Lines | 275 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (8)

- `react-router-dom`
- `framer-motion`
- `lucide-react`
- `../../context/SellerAuthContext`
- `../../context/ThemeContext`
- `../../utils/dummyData`
- `../../utils/formatters`
- `../../constants`

## Hooks / State

- useState('')
- useState(false)
- useState(false)
- useState(false)
- useEffect x1
- useNavigate
- useLocation

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | text | false |  |

## Buttons (10)

### Button 1
- **Label:** (icon-only)
- **Type:** button
- **onClick:** `onMenuClick`

### Button 2
- **Label:** { setSearchQuery(''); setShowSearch(false); }} className="absolute right-2.5 top
- **Type:** button
- **onClick:** `() => { setSearchQuery(''); setShowSearch(false); `

### Button 3
- **Label:** { navigate(link.path); setSearchQuery(''); setShowSearch(false); }}
           
- **Type:** button
- **onClick:** `() => { navigate(link.path); setSearchQuery(''); setShowSearch(false); `

### Button 4
- **Label:** {theme === 'light' ?  : }
- **Type:** button
- **onClick:** `toggleTheme`

### Button 5
- **Label:** { setShowNotifications(!showNotifications); setShowProfile(false); }}
         
- **Type:** button
- **onClick:** `() => { setShowNotifications(!showNotifications); setShowProfile(false); `

### Button 6
- **Label:** { navigate('/seller/notifications'); setShowNotifications(false); }}
          
- **Type:** button
- **onClick:** `() => { navigate('/seller/notifications'); setShowNotifications(false); `

### Button 7
- **Label:** { setShowProfile(!showProfile); setShowNotifications(false); }}
            cla
- **Type:** button
- **onClick:** `() => { setShowProfile(!showProfile); setShowNotifications(false); `

### Button 8
- **Label:** { navigate('/seller/settings'); setShowProfile(false); }}
                    c
- **Type:** button
- **onClick:** `() => { navigate('/seller/settings'); setShowProfile(false); `

### Button 9
- **Label:** { navigate('/seller/settings'); setShowProfile(false); }}
                    c
- **Type:** button
- **onClick:** `() => { navigate('/seller/settings'); setShowProfile(false); `

### Button 10
- **Label:** { await logout(); navigate('/seller/login'); }}
                    className="
- **Type:** button
- **onClick:** `async () => { await logout(); navigate('/seller/login'); `

## Hardcoded / Mock Indicators

- contains mock/dummy references

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
