# 06 — Modules

## Module Matrix

| Module | Path | Routes | Auth | State | API Status |
|--------|------|--------|------|-------|------------|
| Customer (user) | modules/user | /* | OTP mock | Zustand + localStorage | authApi mock only |
| Seller | modules/seller | /seller/* | Context | Context + dummyData | sellerApi stubbed |
| Admin | modules/admin | /admin/* | localStorage | Redux slices + inline mock | api.js minimal |
| Delivery | modules/delivery | /delivery/* | localStorage | useDeliveryStore + inline | None |
| Vendor (legacy) | modules/vendor | Not mounted | N/A | None | None |

## Customer Module — Business Flows
See [17_Business_Flows.md](./17_Business_Flows.md#customer-marketplace)

## Seller Module — Business Flows
Product CRUD → Order fulfillment → Returns → Earnings payout → Analytics

## Admin Module — Business Flows
Vendor approval → Product moderation → Order ops → Finance → Reports → RBAC

## Delivery Module — Business Flows
Auth → Accept orders → Navigate → OTP delivery confirmation → Earnings

## Shared Module (shared/)
SplashScreen, Footer, OfflineOverlay, SearchInput, priceFormatter

## Store Module (store/)
Redux global store + 3 Zustand stores — see [18_State_Management.md](./18_State_Management.md)
