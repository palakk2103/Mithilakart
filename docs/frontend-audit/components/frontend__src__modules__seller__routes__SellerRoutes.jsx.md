# File Audit: frontend/src/modules/seller/routes/SellerRoutes.jsx

| Property | Value |
|----------|-------|
| Lines | 82 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (6)

- `react-router-dom`
- `../context/SellerAuthContext`
- `../context/ThemeContext`
- `./ProtectedRoute`
- `../components/layout/SellerLayout`
- `../components/ui/Skeleton`

## Routes Defined

| Path | Component |
|------|----------|
| `login` | SellerLogin |
| `dashboard` | Dashboard |
| `products` | ProductList |
| `products/add` | AddProduct |
| `products/edit/:id` | AddProduct |
| `orders` | OrderList |
| `orders/:id` | OrderDetail |
| `returns` | ReturnList |
| `customers` | CustomerList |
| `inventory` | InventoryManager |
| `reviews` | ReviewList |
| `coupons` | CouponList |
| `analytics` | Analytics |
| `earnings` | Earnings |
| `notifications` | Notifications |
| `settings` | SettingsPage |
| `*` | Navigate |

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
