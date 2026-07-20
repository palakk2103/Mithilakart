# 02 — Project Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (PWA-capable)                     │
├─────────────────────────────────────────────────────────────────┤
│  main.jsx                                                        │
│    ├── Redux Provider (store/index.js)                          │
│    ├── i18n (i18n/index.js)                                     │
│    ├── App.jsx (BrowserRouter)                                  │
│    │     ├── SplashScreen (first load)                          │
│    │     ├── Toaster (react-hot-toast)                          │
│    │     └── Route Mounts:                                      │
│    │           /delivery/*  → DeliveryRoutes                    │
│    │           /seller/*    → SellerRoutes (+ Auth/Theme Ctx)   │
│    │           /admin/*     → AdminRoutes                       │
│    │           /*           → MarketRoutes (Customer)           │
│    └── OfflineOverlay (network status)                          │
└─────────────────────────────────────────────────────────────────┘
```

## Module Architecture Pattern

Each portal follows a consistent structure:

```
modules/{portal}/
  routes/       — Route definitions + guards
  layouts/      — Shell layouts (sidebar, header)
  pages/        — Route-level page components
  components/   — Portal-specific UI
  services/     — API layer (mostly stubs)
  context/      — React Context (seller only)
  hooks/        — Custom hooks (seller only)
  utils/        — Validators, formatters, dummy data
  constants/    — Static config
```

## State Management Architecture

### Redux Toolkit (Global — wired in main.jsx)

| Slice | File | Purpose |
|-------|------|---------|
| admin | adminSlice.js | Admin dashboard state |
| vendor | vendorSlice.js | Vendor selection, category flow |
| products | productSlice.js | Product catalog seed for admin |
| orders | orderSlice.js | Order management seed |
| finance | financeSlice.js | Financial data seed |
| analytics | analyticsSlice.js | Analytics seed |
| notifications | notificationSlice.js | Notification seed |

### Zustand (Module-local — imported per component)

| Store | File | Purpose |
|-------|------|---------|
| useAccountStore | useAccountStore.js | User profile, addresses, cards, orders, wishlist |
| useVendorStore | useVendorStore.js | Category selection, vendor flow state |
| useDeliveryStore | useDeliveryStore.js | Delivery agent state |

### localStorage Keys (Cross-cutting persistence)

- `user_language`
- `isAdminAuthenticated`
- `adminToken`
- `isDeliveryAuthenticated`
- `seller_token`
- `seller_data`
- `seller_theme`
- `isMithilakFlow`
- `isQuickShopFlow`
- `isFreshGroceryFlow`
- `userCart`
- `isAuthenticated`
- `cartAddress`
- `userWishlist`
- `userToken`
- `forceShopClosed`

## Authentication Architecture (Current — Frontend Only)

| Portal | Storage Key | Guard Component |
|--------|-------------|-----------------|
| Customer | isAuthenticated | Checkout useEffect redirect |
| Seller | sellerToken (context) | ProtectedRoute.jsx |
| Admin | isAdminAuthenticated | AdminProtectedRoute |
| Delivery | isDeliveryAuthenticated | DeliveryProtectedRoute |

**Critical Gap:** No JWT refresh, no server-side session validation, no RBAC enforcement on routes.

## Layout Hierarchy

### Customer (VendorLayout.jsx)
- MainSidebar (drawer)
- HeaderTop / HeaderTabs / SearchBar / CategoryNavbar
- LanguageSelector
- Outlet (page content)
- Footer (conditional)
- Bottom navigation (mobile)
- Flow-aware theming (Mithilak / Quick Shop / Fresh Grocery / You Buy)

### Seller (SellerLayout.jsx)
- Sidebar + Topbar + MobileMenu
- ThemeContext (dark/light)
- Lazy-loaded page content

### Admin (AdminLayout.jsx)
- Collapsible sidebar with 12 menu groups
- Global search, notifications dropdown
- Outlet

### Delivery (DeliveryLayout.jsx)
- Mobile-first bottom nav
- Outlet

## Data Flow Patterns

1. **Static/Mock Data** — Component state initialized from dummyData.js or inline arrays
2. **localStorage Sync** — Cart, wishlist, auth flags, flow flags, addresses
3. **Zustand Actions** — Profile updates, wishlist mutations (partial localStorage sync)
4. **Custom Events** — `cartUpdated` window event for cross-component cart sync
5. **Redux** — Admin product moderation actions (slice reducers, no async thunks)

## Build & Deploy

- **Dev:** `vite --host`
- **Build:** `vite build`
- **Deploy:** vercel.json present
- **PWA:** vite-plugin-pwa configured

## Cross-Cutting Concerns

| Concern | Implementation |
|---------|----------------|
| i18n | react-i18next, 4 locales |
| Price formatting | shared/utils/priceFormatter.js |
| Offline detection | OfflineOverlay.jsx |
| Splash screen | SplashScreen.jsx on app load |
| Toast notifications | react-hot-toast (global + per-module) |

## Architectural Risks

1. **Dual route files** — VendorRoutes.jsx unused duplicate of MarketRoutes
2. **Split state** — Redux + Zustand + localStorage without single source of truth
3. **No API client for customer module** — Only seller has axiosInstance stub
4. **Auth flags in localStorage** — Trivially bypassable
5. **Legacy vendor module** — Partially integrated, creates confusion
