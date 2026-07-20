# 03 — Folder Structure

Complete directory tree of `frontend/src` (324 files).

## Root Files

```
frontend/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── vercel.json
├── index.html
└── src/
    ├── App.jsx              # Root router, splash, toaster
    ├── main.jsx             # Redux Provider, i18n, OfflineOverlay
    ├── index.css            # Global Tailwind styles
    ├── assets/              # Images, Lottie JSON (101 files)
    ├── data/                # categoryData.js
    ├── i18n/                # Internationalization (en, hi, bn, mai)
    ├── modules/             # Feature modules (5 portals)
    ├── shared/              # Cross-module components & utils
    └── store/               # Redux + Zustand stores
```

## modules/admin/ (66 code files)

```
admin/
├── catalog/           BannerManager, CategoryManager, CategoryChipsManager, HomeSectionsManager
├── components/ui/     Modal, DataTable, Pagination, StatCard, ConfirmDialog, etc.
├── constants/         dummyData.js (centralized mock)
├── dashboard/         Legacy Dashboard.jsx
├── layouts/           AdminLayout.jsx (sidebar navigation)
├── pages/             40+ admin pages (analytics, finance, reports, system, etc.)
├── products/          ProductModeration.jsx
├── routes/            AdminRoutes.jsx
├── services/          api.js
└── vendors/           VendorList, VendorApproval
```

## modules/seller/ (50 code files)

```
seller/
├── components/        layout/, common/, ui/
├── context/           SellerAuthContext, ThemeContext
├── hooks/             useDebounce, usePagination, useMediaQuery
├── pages/             auth, dashboard, products, orders, returns, customers,
│                      inventory, reviews, coupons, analytics, earnings,
│                      notifications, settings
├── routes/            SellerRoutes, ProtectedRoute
├── services/          sellerApi.js, axiosInstance.js
├── styles/            seller.css
└── utils/             dummyData.js, validators.js, formatters.js
```

## modules/user/ (66 code files)

```
user/
├── components/
│   ├── common/        HeaderTop, SearchBar, ProductCard, MainSidebar, etc.
│   └── vendor/home/   Home page sections (Trending, BestQuality, etc.)
├── layouts/           VendorLayout.jsx
├── pages/             30+ customer pages + profile/ subdirectory
├── routes/            MarketRoutes.jsx, VendorRoutes.jsx (legacy)
└── services/          authApi.js
```

## modules/delivery/ (13 code files)

```
delivery/
├── layouts/           DeliveryLayout.jsx
├── pages/             Auth, Signup, Dashboard, Orders, OrderDetail,
│                      Earnings, Profile, PersonalInfo, Settings, Support, About
└── routes/            DeliveryRoutes.jsx
```

## modules/vendor/ (legacy — 3 code files)

```
vendor/
├── dashboard/         Dashboard.jsx (used by admin)
├── inventory/         InventoryList.jsx (used by admin)
└── routes/            SellerRoutes.jsx (NOT mounted)
```

## shared/

```
shared/
├── components/        SplashScreen, SearchInput, OfflineOverlay, Footer
└── utils/             priceFormatter.js
```

## store/

```
store/
├── index.js           Redux configureStore
├── useAccountStore.js Zustand — customer account
├── useVendorStore.js  Zustand — vendor/category flow
├── useDeliveryStore.js Zustand — delivery agent
└── slices/            admin, vendor, product, order, finance, analytics, notification
```

## Complete File List

See [files/](./files/) directory — one markdown audit per source file.

Total asset files: 101
