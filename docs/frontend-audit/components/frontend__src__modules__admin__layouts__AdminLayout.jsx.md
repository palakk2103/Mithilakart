# File Audit: frontend/src/modules/admin/layouts/AdminLayout.jsx

| Property | Value |
|----------|-------|
| Lines | 451 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | true |
| Has Toast | false |

## Exports

- `default`

## Imports (4)

- `react-router-dom`
- `lucide-react`
- `framer-motion`
- `../../../shared/components/SearchInput`

## Hooks / State

- useState(false)
- useState({})
- useState('')
- useState(false)
- useState(false)
- useNavigate
- useLocation

## Routes Defined

| Path | Component |
|------|----------|
| `/admin/storefront/banners` | object-route |
| `/admin/users` | object-route |
| `/admin/inventory/all` | object-route |
| `/admin/settings` | object-route |
| `/admin/dashboard` | object-route |
| `/admin/analytics` | object-route |
| `/admin/users` | object-route |
| `/admin/storefront/banners` | object-route |
| `/admin/storefront/chips` | object-route |
| `/admin/storefront/sections/still-looking` | object-route |
| `/admin/storefront/sections/top-selection` | object-route |
| `/admin/storefront/sections/spotlight` | object-route |
| `/admin/storefront/sections/best-quality` | object-route |
| `/admin/storefront/sections/keep-shopping` | object-route |
| `/admin/categories` | object-route |
| `/admin/inventory/all` | object-route |
| `/admin/inventory/add` | object-route |
| `/admin/inventory/alerts` | object-route |
| `/admin/orders` | object-route |
| `/admin/operations/returns` | object-route |
| `/admin/operations/refunds` | object-route |
| `/admin/reports/sales` | object-route |
| `/admin/reports/sellers` | object-route |
| `/admin/reports/users` | object-route |
| `/admin/reports/orders` | object-route |
| `/admin/reports/inventory` | object-route |
| `/admin/reports/refunds` | object-route |
| `/admin/promotions/coupons` | object-route |
| `/admin/promotions/flash-sale` | object-route |
| `/admin/promotions/featured` | object-route |
| `/admin/comms/notifications` | object-route |
| `/admin/vendors/all` | object-route |
| `/admin/vendors/approval` | object-route |
| `/admin/delivery/all` | object-route |
| `/admin/delivery/approval` | object-route |
| `/admin/content/reviews` | object-route |
| `/admin/content/qna` | object-route |
| `/admin/content/legal` | object-route |
| `/admin/support/tickets` | object-route |
| `/admin/products/moderation` | object-route |
| `/admin/categories` | object-route |
| `/admin/finance/earnings` | object-route |
| `/admin/payouts` | object-route |
| `/admin/finance/rules` | object-route |
| `/admin/finance/tax` | object-route |
| `/admin/finance/delivery-charges` | object-route |
| `/admin/system/sub-admins` | object-route |
| `/admin/system/roles` | object-route |
| `/admin/system/audit-logs` | object-route |
| `/admin/settings` | object-route |
| `/admin/auth` | object-route |

## Buttons (6)

### Button 1
- **Label:** toggleSubMenu(item.name)}
                          className={`w-full flex ite
- **Type:** button
- **onClick:** `() => toggleSubMenu(item.name)`

### Button 2
- **Label:** setIsSidebarOpen(!isSidebarOpen)}
              className="w-10 h-10 border bor
- **Type:** button
- **onClick:** `() => setIsSidebarOpen(!isSidebarOpen)`

### Button 3
- **Label:** {
                          navigate(link.path);
                          set
- **Type:** button
- **onClick:** `() => {
                          navigate(link.path);
                          setSearchQuery('');
                          setShowSearchDropdown(false);
                        `

### Button 4
- **Label:** setShowNotifications(!showNotifications)}
                    className={`w-12 
- **Type:** button
- **onClick:** `() => setShowNotifications(!showNotifications)`

### Button 5
- **Label:** {n.type === 'warning' ?  : n.type === 'success' ?  : }
                        
- **Type:** button
- **onClick:** ``

### Button 6
- **Label:** { navigate('/admin/comms/notifications'); setShowNotifications(false); }}
     
- **Type:** button
- **onClick:** `() => { navigate('/admin/comms/notifications'); setShowNotifications(false); `

## Hardcoded / Mock Indicators

- contains mock/dummy references

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
