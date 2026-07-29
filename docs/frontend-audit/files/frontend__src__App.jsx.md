# File Audit: frontend/src/App.jsx

| Property | Value |
|----------|-------|
| Lines | 46 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | true |

## Exports

- `default`

## Imports (7)

- `react-router-dom`
- `react-hot-toast`
- `./modules/user/routes/MarketRoutes`
- `./modules/seller/routes/SellerRoutes`
- `./modules/admin/routes/AdminRoutes`
- `./modules/delivery/routes/DeliveryRoutes`
- `./shared/components/SplashScreen`

## Hooks / State

- useState(true)

## Routes Defined

| Path | Component |
|------|----------|
| `/delivery/*` | DeliveryRoutes |
| `/seller/*` | SellerRoutes |
| `/admin/*` | AdminRoutes |
| `/vendor/*` | MarketRoutes |
| `/*` | MarketRoutes |

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.
