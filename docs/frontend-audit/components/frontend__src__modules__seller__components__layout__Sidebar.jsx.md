# File Audit: frontend/src/modules/seller/components/layout/Sidebar.jsx

| Property | Value |
|----------|-------|
| Lines | 177 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | true |
| Has Toast | false |

## Exports

- `default`

## Imports (6)

- `react`
- `react-router-dom`
- `framer-motion`
- `lucide-react`
- `../../context/SellerAuthContext`
- `../../constants`

## Hooks / State

- useNavigate
- useLocation

## Buttons (2)

### Button 1
- **Label:** {IconComponent && }
                      {!collapsed && {item.name}}
- **Type:** button
- **onClick:** `handleLogout`

### Button 2
- **Label:** {collapsed ?  : }
- **Type:** button
- **onClick:** `onToggle`

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
