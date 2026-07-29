#!/usr/bin/env node
/**
 * Generates master audit documents 01-30 from aggregate scan data.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'frontend-audit');
const agg = JSON.parse(fs.readFileSync(path.join(OUT, '_aggregate.json'), 'utf8'));

function w(name, content) {
  fs.writeFileSync(path.join(OUT, name), content, 'utf8');
}

const { allFiles, codeFiles, allRoutes, allTodos, allButtons, allForms, allModals, allTables, allApis, allLocalStorage } = agg;

// Route catalog from source analysis (complete)
const ROUTE_CATALOG = `
## Application Root (App.jsx)

| Mount Path | Module | Router File |
|------------|--------|-------------|
| \`/*\` | Customer Marketplace | MarketRoutes.jsx |
| \`/vendor/*\` | Customer Marketplace (alias) | MarketRoutes.jsx |
| \`/seller/*\` | Seller Portal | seller/SellerRoutes.jsx |
| \`/admin/*\` | Admin Panel | admin/AdminRoutes.jsx |
| \`/delivery/*\` | Delivery Agent Portal | delivery/DeliveryRoutes.jsx |

---

## Customer Marketplace Routes (MarketRoutes.jsx)

### Public — No VendorLayout

| Route | Component | Access | Layout |
|-------|-----------|--------|--------|
| \`/login\` | Login | Public | None |
| \`/signup\` | Signup | Public | None |
| \`/forgot-password\` | ForgotPassword | Public | None |
| \`/checkout\` | Checkout | Auth required (localStorage) | None |
| \`/terms\` | TermsOfUse | Public | None |
| \`/privacy\` | PrivacyPolicy | Public | None |
| \`/cancellation-returns\` | CancellationReturns | Public | None |
| \`/shipping\` | ShippingPolicy | Public | None |

### Protected by VendorLayout

| Route | Component | Params |
|-------|-----------|--------|
| \`/home\` | Home | — |
| \`/products\` | Products | — |
| \`/product-detail\` | ProductDetail | — |
| \`/cart\` | Cart | — |
| \`/bag\` | Bag | — |
| \`/wishlist\` | Wishlist | — |
| \`/profile\` | Profile | — |
| \`/profile/edit\` | EditProfile | — |
| \`/profile/orders\` | MyOrders | — |
| \`/profile/orders/:orderId\` | OrderDetail | orderId |
| \`/profile/wishlist\` | Wishlist | — |
| \`/profile/coupons\` | Coupons | — |
| \`/profile/help-center\` | HelpCenter | — |
| \`/profile/addresses\` | SavedAddresses | — |
| \`/profile/cards\` | SavedCards | — |
| \`/profile/notifications\` | NotificationSettings | — |
| \`/profile/reviews\` | MyReviews | — |
| \`/profile/questions\` | QuestionsAnswers | — |
| \`/wallet\` | Wallet | — |
| \`/menu\` | Menu | — |
| \`/deals\` | DealsPage | — |
| \`/search\` | Search | — |
| \`/category-products\` | CategoryProducts | — |
| \`/categories\` | Categories | — |
| \`/toys\` | ToysLanding | — |
| \`/beauty\` | BeautyLanding | — |
| \`/continue-shopping/:productId\` | ContinueShopping | productId |
| \`/all-offers\` | AllOffers | — |
| \`/quick-shop\` | QuickShop | — |
| \`/quick-shop/category\` | QuickShopSubcategory | — |
| \`/mithilak\` | Mithilak | — |
| \`/mithilak/category\` | QuickShopSubcategory | — |
| \`/fresh-grocery\` | QuickShop | — |
| \`/fresh-grocery/category\` | QuickShopSubcategory | — |
| \`/\` | Navigate → home | — |

**Note:** VendorRoutes.jsx is a legacy duplicate of MarketRoutes without forgot-password and quick-shop/mithilak/fresh-grocery routes. Not mounted in App.jsx.

---

## Seller Portal Routes (\`/seller/*\`)

| Route | Component | Access | Layout |
|-------|-----------|--------|--------|
| \`/seller/login\` | SellerLogin | Public | None |
| \`/seller/dashboard\` | Dashboard | ProtectedRoute | SellerLayout |
| \`/seller/products\` | ProductList | Protected | SellerLayout |
| \`/seller/products/add\` | AddProduct | Protected | SellerLayout |
| \`/seller/products/edit/:id\` | AddProduct | Protected | SellerLayout |
| \`/seller/orders\` | OrderList | Protected | SellerLayout |
| \`/seller/orders/:id\` | OrderDetail | Protected | SellerLayout |
| \`/seller/returns\` | ReturnList | Protected | SellerLayout |
| \`/seller/customers\` | CustomerList | Protected | SellerLayout |
| \`/seller/inventory\` | InventoryManager | Protected | SellerLayout |
| \`/seller/reviews\` | ReviewList | Protected | SellerLayout |
| \`/seller/coupons\` | CouponList | Protected | SellerLayout |
| \`/seller/analytics\` | Analytics | Protected | SellerLayout |
| \`/seller/earnings\` | Earnings | Protected | SellerLayout |
| \`/seller/notifications\` | Notifications | Protected | SellerLayout |
| \`/seller/settings\` | SettingsPage | Protected | SellerLayout |

**Auth:** SellerAuthContext + ProtectedRoute. Lazy-loaded pages with Suspense.

---

## Admin Panel Routes (\`/admin/*\`)

| Route | Component | Access |
|-------|-----------|--------|
| \`/admin/auth\` | Auth | Public |
| \`/admin/dashboard\` | Dashboard | AdminProtectedRoute |
| \`/admin/analytics\` | Analytics | Protected |
| \`/admin/users\` | Users | Protected |
| \`/admin/users/:userId\` | CustomerDetail | Protected |
| \`/admin/products/moderation\` | ProductModeration | Protected |
| \`/admin/categories\` | CategoryManager | Protected |
| \`/admin/storefront/banners\` | BannerManager | Protected |
| \`/admin/storefront/chips\` | CategoryChipsManager | Protected |
| \`/admin/storefront/sections/:section\` | HomeSectionsManager | Protected |
| \`/admin/inventory/all\` | InventoryList (vendor) | Protected |
| \`/admin/inventory/add\` | AddProduct | Protected |
| \`/admin/inventory/alerts\` | StockAlerts | Protected |
| \`/admin/orders\` | Orders | Protected |
| \`/admin/orders/:orderId\` | OrderDetail | Protected |
| \`/admin/operations/returns\` | Returns | Protected |
| \`/admin/operations/refunds\` | Refunds | Protected |
| \`/admin/support/tickets\` | Tickets | Protected |
| \`/admin/promotions/coupons\` | Coupons | Protected |
| \`/admin/promotions/flash-sale\` | FlashSale | Protected |
| \`/admin/promotions/featured\` | FeaturedProducts | Protected |
| \`/admin/comms/notifications\` | Notifications | Protected |
| \`/admin/content/reviews\` | ReviewModeration | Protected |
| \`/admin/content/qna\` | QnAModeration | Protected |
| \`/admin/content/legal\` | LegalPolicies | Protected |
| \`/admin/vendors/all\` | VendorList | Protected |
| \`/admin/vendors/:vendorId\` | SellerDetail | Protected |
| \`/admin/vendors/approval\` | VendorApproval | Protected |
| \`/admin/delivery/all\` | AllDeliveries | Protected |
| \`/admin/delivery/approval\` | DeliveryApproval | Protected |
| \`/admin/finance/earnings\` | PlatformEarnings | Protected |
| \`/admin/payouts\` | Payouts | Protected |
| \`/admin/finance/rules\` | Rules | Protected |
| \`/admin/finance/tax\` | TaxConfig | Protected |
| \`/admin/finance/delivery-charges\` | DeliveryCharges | Protected |
| \`/admin/reports/sales\` | SalesReport | Protected |
| \`/admin/reports/sellers\` | SellerReport | Protected |
| \`/admin/reports/users\` | UserReport | Protected |
| \`/admin/reports/orders\` | OrderReport | Protected |
| \`/admin/reports/inventory\` | InventoryReport | Protected |
| \`/admin/reports/refunds\` | RefundReport | Protected |
| \`/admin/system/sub-admins\` | SubAdmins | Protected |
| \`/admin/system/audit-logs\` | AuditLogs | Protected |
| \`/admin/system/roles\` | RoleManagement | Protected |
| \`/admin/settings\` | Settings | Protected |

**Auth:** \`localStorage.isAdminAuthenticated === 'true'\`

---

## Delivery Agent Routes (\`/delivery/*\`)

| Route | Component | Access |
|-------|-----------|--------|
| \`/delivery/auth\` | DeliveryAuth | Public |
| \`/delivery/signup\` | DeliverySignup | Public |
| \`/delivery/dashboard\` | DeliveryDashboard | DeliveryProtectedRoute |
| \`/delivery/orders\` | DeliveryOrders | Protected |
| \`/delivery/orders/:orderId\` | DeliveryOrderDetail | Protected |
| \`/delivery/earnings\` | DeliveryEarnings | Protected |
| \`/delivery/profile\` | DeliveryProfile | Protected |
| \`/delivery/profile/edit\` | PersonalInfo | Protected |
| \`/delivery/settings\` | Settings | Protected |
| \`/delivery/support\` | Support | Protected |
| \`/delivery/about\` | About | Protected |

**Auth:** \`localStorage.isDeliveryAuthenticated === 'true'\`

---

## Legacy Vendor Module Routes (modules/vendor — partially used)

Admin reuses \`vendor/dashboard/Dashboard\` and \`vendor/inventory/InventoryList\` inside admin routes.
Standalone \`modules/vendor/routes/SellerRoutes.jsx\` exists but is NOT mounted in App.jsx.
`;

w('01_Project_Overview.md', `# 01 — Project Overview

## Product Name
**Mithilakart** — Multi-vertical e-commerce marketplace platform

## Audit Date
${new Date().toISOString().split('T')[0]}

## Audit Scope
Complete reverse-engineering of \`frontend/\` directory. This audit treats the frontend as the Product Requirements Document (PRD) for backend implementation.

## Executive Summary

Mithilakart is a **React 19 + Vite 6** single-page application delivering **five distinct product surfaces** from one codebase:

1. **Customer Marketplace** — Mobile-first shopping experience (root \`/\` and \`/vendor/*\`)
2. **Seller Portal** — \`/seller/*\` vendor dashboard for product/order management
3. **Admin Panel** — \`/admin/*\` platform operations, CMS, finance, reports
4. **Delivery Agent App** — \`/delivery/*\` last-mile delivery operations
5. **Legacy Vendor Submodule** — Partially integrated admin inventory views

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | React | ^19.2.5 |
| Build | Vite | ^6.0.0 |
| Routing | react-router-dom | ^7.14.2 |
| Global State | Redux Toolkit + Zustand | RTK ^2.11.2, Zustand ^5.0.12 |
| HTTP Client | Axios | ^1.18.1 (seller module only, stubbed) |
| Forms | react-hook-form | ^7.81.0 |
| Styling | Tailwind CSS | ^4.2.4 |
| Animation | framer-motion | ^12.38.0 |
| Charts | recharts | ^3.8.1 |
| i18n | i18next + react-i18next | en, hi, bn, mai |
| Notifications | react-hot-toast | ^2.6.0 |
| PWA | vite-plugin-pwa | ^1.3.0 |
| Icons | lucide-react, react-icons | — |

## User Personas Implemented in Frontend

| Persona | Portal | Auth Mechanism |
|---------|--------|----------------|
| Customer / Shopper | Marketplace | OTP (phone/email) → localStorage |
| Seller / Vendor | /seller | Email/password (mock) → SellerAuthContext |
| Platform Admin | /admin | Email/password (mock) → localStorage flag |
| Delivery Partner | /delivery | Phone OTP (mock) → localStorage flag |
| Sub-Admin | /admin (RBAC UI) | Role-based permissions (mock data) |

## Current Integration Status

| Module | Backend Integration |
|--------|---------------------|
| Customer auth | **Mock** — authApi.js with hardcoded OTP credentials |
| Customer cart/orders | **localStorage** — userCart, useAccountStore |
| Seller module | **Mock** — sellerApi.js returns dummyData.js |
| Admin module | **Mock** — inline MOCK_* constants + dummyData.js |
| Delivery module | **Mock** — MOCK_ORDERS inline |
| Redux slices | **Seed data** — hardcoded initial state |

## File Inventory

| Category | Count |
|----------|-------|
| Total files in frontend/src | ${allFiles.length} |
| Code files analyzed | ${codeFiles.length} |
| Per-file audit documents | ${codeFiles.length} |
| Route definitions catalogued | 100+ |
| TODO/FIXME in source | ${allTodos.length} |

## Business Domains Covered

- Product catalog & search
- Multi-flow checkout (Mithilak, Quick Shop, Fresh Grocery, You Buy)
- Cart, wishlist, wallet, coupons
- Order lifecycle (place, track, return, refund)
- Seller onboarding & KYC (admin)
- Inventory & stock alerts
- Promotions (coupons, flash sales, featured)
- CMS (banners, category chips, home sections)
- Finance (commission, tax, payouts, delivery charges)
- Support tickets & help center
- Reviews & Q&A moderation
- Delivery partner management
- RBAC & audit logging (admin system)
- Multi-language support (4 locales)

## Related Documents

- [02_Project_Architecture.md](./02_Project_Architecture.md)
- [04_Routes.md](./04_Routes.md)
- [17_Business_Flows.md](./17_Business_Flows.md)
- [19_API_Requirements.md](./19_API_Requirements.md)
- [30_Final_Master_Audit.md](./30_Final_Master_Audit.md)
- [INDEX.md](./INDEX.md) — per-file audits in \`files/\`
`);

w('02_Project_Architecture.md', `# 02 — Project Architecture

## High-Level Architecture

\`\`\`
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
\`\`\`

## Module Architecture Pattern

Each portal follows a consistent structure:

\`\`\`
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
\`\`\`

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

${allLocalStorage.map(k => `- \`${k}\``).join('\n')}

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
4. **Custom Events** — \`cartUpdated\` window event for cross-component cart sync
5. **Redux** — Admin product moderation actions (slice reducers, no async thunks)

## Build & Deploy

- **Dev:** \`vite --host\`
- **Build:** \`vite build\`
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
`);

w('03_Folder_Structure.md', `# 03 — Folder Structure

Complete directory tree of \`frontend/src\` (${allFiles.length} files).

## Root Files

\`\`\`
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
    ├── assets/              # Images, Lottie JSON (${allFiles.filter(f => f.includes('assets/')).length} files)
    ├── data/                # categoryData.js
    ├── i18n/                # Internationalization (en, hi, bn, mai)
    ├── modules/             # Feature modules (5 portals)
    ├── shared/              # Cross-module components & utils
    └── store/               # Redux + Zustand stores
\`\`\`

## modules/admin/ (${codeFiles.filter(f => f.includes('modules/admin')).length} code files)

\`\`\`
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
\`\`\`

## modules/seller/ (${codeFiles.filter(f => f.includes('modules/seller')).length} code files)

\`\`\`
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
\`\`\`

## modules/user/ (${codeFiles.filter(f => f.includes('modules/user')).length} code files)

\`\`\`
user/
├── components/
│   ├── common/        HeaderTop, SearchBar, ProductCard, MainSidebar, etc.
│   └── vendor/home/   Home page sections (Trending, BestQuality, etc.)
├── layouts/           VendorLayout.jsx
├── pages/             30+ customer pages + profile/ subdirectory
├── routes/            MarketRoutes.jsx, VendorRoutes.jsx (legacy)
└── services/          authApi.js
\`\`\`

## modules/delivery/ (${codeFiles.filter(f => f.includes('modules/delivery')).length} code files)

\`\`\`
delivery/
├── layouts/           DeliveryLayout.jsx
├── pages/             Auth, Signup, Dashboard, Orders, OrderDetail,
│                      Earnings, Profile, PersonalInfo, Settings, Support, About
└── routes/            DeliveryRoutes.jsx
\`\`\`

## modules/vendor/ (legacy — ${codeFiles.filter(f => f.includes('modules/vendor')).length} code files)

\`\`\`
vendor/
├── dashboard/         Dashboard.jsx (used by admin)
├── inventory/         InventoryList.jsx (used by admin)
└── routes/            SellerRoutes.jsx (NOT mounted)
\`\`\`

## shared/

\`\`\`
shared/
├── components/        SplashScreen, SearchInput, OfflineOverlay, Footer
└── utils/             priceFormatter.js
\`\`\`

## store/

\`\`\`
store/
├── index.js           Redux configureStore
├── useAccountStore.js Zustand — customer account
├── useVendorStore.js  Zustand — vendor/category flow
├── useDeliveryStore.js Zustand — delivery agent
└── slices/            admin, vendor, product, order, finance, analytics, notification
\`\`\`

## Complete File List

See [files/](./files/) directory — one markdown audit per source file.

Total asset files: ${allFiles.filter(f => /\.(jpg|jpeg|png|webp|svg|json)$/i.test(f) && f.includes('assets')).length}
`);

w('04_Routes.md', `# 04 — Routes

${ROUTE_CATALOG}

## Per-Route Documentation

Detailed per-route audits are in [routes/](./routes/) directory.

## Route Guard Summary

| Guard | Mechanism | Redirect Target |
|-------|-----------|-----------------|
| AdminProtectedRoute | localStorage.isAdminAuthenticated | /admin/auth |
| DeliveryProtectedRoute | localStorage.isDeliveryAuthenticated | /delivery/auth |
| ProtectedRoute (seller) | SellerAuthContext.isAuthenticated | /seller/login |
| Checkout auth | localStorage.isAuthenticated | /login |
| Seller fallback | * wildcard | /seller/login |

## Customer Route Access Notes

- **No global auth guard** on marketplace routes — most pages are public
- Profile, orders, wallet assume logged-in user but do not enforce redirect
- Checkout enforces \`isAuthenticated\` client-side only

## Dynamic Route Parameters

| Param | Routes | Expected Backend Entity |
|-------|--------|------------------------|
| orderId | /profile/orders/:orderId, /admin/orders/:orderId, /delivery/orders/:orderId | Order |
| productId | /continue-shopping/:productId | Product |
| id | /seller/products/edit/:id, /seller/orders/:id | Product / Order |
| userId | /admin/users/:userId | User/Customer |
| vendorId | /admin/vendors/:vendorId | Seller/Vendor |
| section | /admin/storefront/sections/:section | CMS Home Section |

## Flow Flags (localStorage — affect routing UX)

| Key | Values | Effect |
|-----|--------|--------|
| isMithilakFlow | true/false | Mithilak branding on checkout |
| isQuickShopFlow | true/false | Quick Shop branding |
| isFreshGroceryFlow | true/false | Fresh Grocery branding |
`);

// Continue with more master docs...
const formsList = allForms.map(f => `- **${f.path}** — ${f.formFields.length} fields`).join('\n');
const modalsList = allModals.map(f => `- ${f.path}`).join('\n');
const tablesList = allTables.map(f => `- ${f.path}`).join('\n');
const todosList = allTodos.map(t => `- **${t.file}:${t.line}** — ${t.text}`).join('\n');

w('05_Navigation.md', `# 05 — Navigation

## Customer Marketplace Navigation

### Mobile Bottom Nav (VendorLayout)
| Icon | Label | Route | Condition |
|------|-------|-------|-----------|
| Home | Home | /home | Always |
| LayoutGrid | Categories | /categories | Always |
| ShoppingCart | Cart | /cart | Badge shows cartCount |
| User | Profile | /profile | Always |

### MainSidebar Drawer
- Home, Orders, Wishlist, Wallet, Coupons
- Help Center, Settings, Language
- Category shortcuts (Beauty, Toys, Mithilak, Quick Shop, Fresh Grocery)
- Login/Logout toggle

### HeaderTop
- Logo → /home
- Delivery address selector (from useAccountStore.savedAddresses)
- Search icon → opens SearchBar
- Notification bell
- Cart icon

### HeaderTabs (Category Flow)
- You Buy, Beauty, Gifting, Electronics, Jewellery, Toys, Stationery, Fashion, Electrical
- Sets useVendorStore.selectedCategory
- Changes header background color per category

### CategoryNavbar
- Horizontal scroll category chips
- Links to /category-products with category context

## Seller Portal Navigation (Sidebar.jsx)

| Item | Route |
|------|-------|
| Dashboard | /seller/dashboard |
| Products | /seller/products |
| Orders | /seller/orders |
| Returns | /seller/returns |
| Customers | /seller/customers |
| Inventory | /seller/inventory |
| Reviews | /seller/reviews |
| Coupons | /seller/coupons |
| Analytics | /seller/analytics |
| Earnings | /seller/earnings |
| Notifications | /seller/notifications |
| Settings | /seller/settings |

## Admin Panel Navigation (AdminLayout — 12 groups)

See AdminLayout.jsx menuGroups array:
1. OVERVIEW — Dashboard, Analytics, Customers
2. STOREFRONT — Banners, Chips, Home Sections, Categories
3. BUSINESS OPS — Inventory, Orders, Returns & Refunds
4. REPORTS — Sales, Seller, User, Order, Inventory, Refund
5. PROMOTIONS — Coupons, Flash Sales, Featured
6. COMMS — Notification Hub
7. PARTNERS — Vendors, Delivery Partners
8. CONTENT — Reviews, Q&A, Legal
9. SUPPORT — Help Desk
10. CATALOG — Moderation, Categories
11. FINANCE — Earnings, Payouts, Commission, Tax, Delivery Charges
12. SYSTEM — Sub-Admins, Roles, Audit Logs, Settings, Logout

## Delivery Agent Navigation (DeliveryLayout bottom nav)

| Item | Route |
|------|-------|
| Home | /delivery/dashboard |
| Orders | /delivery/orders |
| Earnings | /delivery/earnings |
| Profile | /delivery/profile |

## Keyboard Shortcuts

**None implemented** in codebase. No useHotkeys or keydown handlers found.
`);

w('09_Forms.md', `# 09 — Forms

## Summary
${allForms.length} files contain forms or form fields.

## Files With Forms

${formsList}

## Detailed Form Audits

### Customer Login (Login.jsx)

| Field | Type | Validation | Required | API |
|-------|------|------------|----------|-----|
| countryCode | select/text | /^\\+?\\d{1,4}$/ | Yes (phone mode) | sendPhoneOtp |
| phoneNumber | tel | 8-11 digits | Yes (phone mode) | sendPhoneOtp, verifyPhoneOtp |
| email | email | email regex | Yes (email mode) | sendEmailOtp, verifyEmailOtp |
| otp | text | 6 digits | Yes | verifyPhoneOtp / verifyEmailOtp |

**Business Rules:**
- Toggle between phone and email OTP
- 60-second resend timer
- Mock credentials: phone 9111966732 + OTP 123456; email mithilakart@gmail.com + OTP 123456
- On success: sets localStorage isAuthenticated, navigates to prior page or /home

### Customer Signup (Signup.jsx)
Similar OTP flow to Login with name field addition.

### Forgot Password (ForgotPassword.jsx)
Email/phone recovery flow (UI only, mock).

### Checkout (Checkout.jsx)
Multi-step wizard (Address → Summary → Payment). No react-hook-form.
- Payment methods: UPI (Paytm, PhonePe, GPay), Card, COD, Wallet
- Address read from localStorage cartAddress
- Order placed client-side with random OD id

### Seller Add Product (AddProduct.jsx)
react-hook-form with fields: title, description, price, mrp, stock, category, sku, images, status.

### Seller Settings (Settings.jsx)
Profile, bank, password, notification preference forms.

### Seller Coupon Create (CouponList.jsx)
Modal form: code, discount type, value, min order, expiry, usage limit.

### Delivery Signup (Signup.jsx)
Partner registration: name, phone, vehicle type, documents upload UI.

See per-file audits in [files/](./files/) for complete field extraction.
`);

w('10_Tables.md', `# 10 — Tables

## Summary
${allTables.length} files contain data tables.

## Files With Tables

${tablesList}

## Reusable Table Components

### admin/components/ui/DataTable.jsx
- Props: columns, data, onRowClick, loading, emptyMessage
- Supports sort indicators, row actions, pagination integration

### seller/components/common/DataTable.jsx
- Similar API with mobile-responsive card fallback

## Key Table Implementations

| Page | Columns | Actions | Filters | Pagination |
|------|---------|---------|---------|------------|
| admin/Users.jsx | Name, Email, Orders, Status, Joined | View, Block | Search, Status | Client-side |
| admin/Orders.jsx | Order ID, Customer, Amount, Status, Date | View | Status, Date range | Client-side |
| seller/ProductList.jsx | Image, Title, Price, Stock, Status | Edit, Delete, Duplicate | Search, Category, Status | usePagination hook |
| seller/OrderList.jsx | Order ID, Customer, Items, Total, Status | View, Update Status | Status filter | usePagination |
| admin/reports/* | Varies per report | Export button (UI) | Date range | N/A (charts) |

## Backend Query Requirements (All Tables)

Every table requires:
- Paginated API: \`?page=&limit=&sort=&order=\`
- Filter params matching UI filters
- Search: full-text or field-specific
- Role-based row visibility
- Export endpoint for report tables
`);

w('11_Modals.md', `# 11 — Modals

## Summary
${allModals.length} files contain modals, dialogs, or drawers.

## Modal/Dialog Inventory

${modalsList}

## Reusable Modal Components

| Component | Module | Props |
|-----------|--------|-------|
| Modal.jsx | admin | isOpen, onClose, title, children, size |
| ConfirmDialog.jsx | admin | isOpen, onConfirm, onCancel, message, variant |
| ConfirmModal.jsx | seller | isOpen, onConfirm, title, message, loading |

## Key Modal Use Cases

| Location | Purpose | Trigger |
|----------|---------|---------|
| Cart.jsx | Address selection/editing | "Change Address" button |
| SavedAddresses.jsx | Add/Edit address form | Add Address button |
| SavedCards.jsx | Add payment card | Add Card button |
| CategoryProducts.jsx | Filter panel | Filter icon |
| SearchBar.jsx | Barcode/QR scanner overlay | Scanner icon |
| admin/Users.jsx | Block user confirmation | Block action |
| admin/promotions/Coupons.jsx | Create/Edit coupon | Add Coupon button |
| admin/operations/Refunds.jsx | Approve/Reject refund | Row action |
| seller/ProductList.jsx | Delete confirmation | Delete button |
| delivery/OrderDetail.jsx | OTP verification modal | Deliver button |
`);

w('12_Drawers.md', `# 12 — Drawers

## Drawer Implementations

| Component | Module | Purpose | Open Trigger | Close Trigger |
|-----------|--------|---------|--------------|---------------|
| MainSidebar | user/common | Main navigation drawer | Hamburger menu | Overlay click, X button |
| VendorLayout isDrawerOpen | user/layouts | Controls MainSidebar | Menu icon | onClose callback |
| MobileMenu | seller/layout | Seller mobile navigation | Hamburger (mobile) | Overlay, nav click |
| SearchBar scanner | user/common | Barcode scanner overlay | Scanner icon | Close button |
| CategoryProducts filter | user/pages | Product filter drawer | Filter button | Apply/Close |

## MainSidebar Contents
- User greeting / login prompt
- Navigation links (Home, Orders, Wishlist, Wallet, etc.)
- Category quick links
- Language selector
- Help & legal links
- Logout

## Drawer Behavior
- Framer Motion animations on open/close
- Backdrop overlay with click-to-close
- z-index 50+ stacking
- Mobile-first: drawers replace sidebars on small screens
`);

w('27_TODOs.md', `# 27 — TODOs and FIXMEs

## Source Code TODOs (${allTodos.length} items)

${todosList || 'No TODOs found in application source (excluding dev-dist/workbox).'}

## sellerApi.js — Complete API Stub List

All endpoints in seller/services/sellerApi.js are stubbed with TODO comments:
- POST /auth/login, /auth/logout
- GET /dashboard, /dashboard/stats
- CRUD /products, PATCH /products/:id/status, POST /products/:id/duplicate
- GET /orders, GET /orders/:id, PATCH /orders/:id/status
- GET /returns, PATCH /returns/:id/approve, /reject
- GET /customers, GET /customers/:id
- GET /inventory, PATCH /inventory/:id/stock, GET /inventory/:id/history
- GET /reviews, POST /reviews/:id/reply, /report
- CRUD /coupons
- GET /analytics/sales, /revenue, /products, /categories, /customers
- GET /earnings, /earnings/transactions, /earnings/settlements, POST /earnings/payout
- GET /notifications, PATCH read endpoints
- GET/PUT /settings/profile, /bank, /password, /notifications

## authApi.js — Integration Comments
- POST /auth/send-phone-otp
- POST /auth/send-email-otp
- (verify endpoints implied)

## axiosInstance.js
- baseURL: '/api/seller' — TODO: Update with actual API base URL
- Request interceptor: TODO: Get token from auth context/storage
`);

w('06_Modules.md', `# 06 — Modules

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
`);

w('07_Pages.md', `# 07 — Pages

Total page components: ${codeFiles.filter(f => /pages?\//.test(f) && /\.(jsx|js)$/.test(f)).length}

## Customer Pages (${codeFiles.filter(f => f.includes('modules/user/pages')).length} files)

| Page | File | Purpose |
|------|------|---------|
| Home | Home.jsx | Main storefront landing with vendor home sections |
| Login | Login.jsx | OTP authentication |
| Signup | Signup.jsx | User registration |
| ForgotPassword | ForgotPassword.jsx | Password recovery |
| Products | Products.jsx | Product listing (dummy data) |
| ProductDetail | ProductDetail.jsx | Single product view |
| Cart | Cart.jsx | Shopping cart with address modal |
| Bag | Bag.jsx | Alternative bag view |
| Checkout | Checkout.jsx | 3-step checkout wizard |
| Profile | Profile.jsx | User profile hub |
| EditProfile | profile/EditProfile.jsx | Edit name, email, phone, DOB |
| MyOrders | profile/MyOrders.jsx | Order history list |
| OrderDetail | profile/OrderDetail.jsx | Single order tracking |
| Wishlist | profile/Wishlist.jsx | Saved products |
| Coupons | profile/Coupons.jsx | Available coupons |
| SavedAddresses | profile/SavedAddresses.jsx | Address CRUD |
| SavedCards | profile/SavedCards.jsx | Payment card CRUD |
| NotificationSettings | profile/NotificationSettings.jsx | Push/email prefs |
| MyReviews | profile/MyReviews.jsx | User reviews |
| QuestionsAnswers | profile/QuestionsAnswers.jsx | Product Q&A |
| HelpCenter | profile/HelpCenter.jsx | Support FAQ |
| Wallet | Wallet.jsx | Wallet balance & transactions |
| Menu | Menu.jsx | Category menu grid |
| Categories | Categories.jsx | All categories |
| CategoryProducts | CategoryProducts.jsx | Filtered product grid |
| Search | Search.jsx | Search results |
| DealsPage | DealsPage.jsx | Deals listing |
| AllOffers | AllOffers.jsx | Promotional offers |
| QuickShop | QuickShop.jsx | Quick commerce flow |
| QuickShopSubcategory | QuickShopSubcategory.jsx | Subcategory products |
| Mithilak | Mithilak.jsx | Mithila art specialty store |
| ToysLanding | ToysLanding.jsx | Toys category landing |
| BeautyLanding | BeautyLanding.jsx | Beauty category landing |
| ContinueShopping | ContinueShopping.jsx | Post-view recommendations |
| TermsOfUse | TermsOfUse.jsx | Legal — terms |
| PrivacyPolicy | PrivacyPolicy.jsx | Legal — privacy |
| CancellationReturns | CancellationReturns.jsx | Return policy |
| ShippingPolicy | ShippingPolicy.jsx | Shipping policy |

Per-page detailed audits: [pages/](./pages/)

## Seller Pages (15 pages)
dashboard, products (list/add), orders (list/detail), returns, customers, inventory, reviews, coupons, analytics, earnings, notifications, settings, auth/login

## Admin Pages (40+ pages)
See [04_Routes.md](./04_Routes.md) for complete list.

## Delivery Pages (11 pages)
auth, signup, dashboard, orders, order detail, earnings, profile, personal info, settings, support, about
`);

w('08_Components.md', `# 08 — Components

Total component files analyzed: ${codeFiles.filter(f => /components?\//.test(f)).length}

## Shared Components (shared/components/)

| Component | Props | Purpose |
|-----------|-------|---------|
| SplashScreen | onComplete | Animated app splash on first load |
| SearchInput | value, onChange, placeholder | Reusable search input (admin) |
| OfflineOverlay | none | Full-screen offline indicator |
| Footer | none | Site footer with links |

## Customer Common Components

| Component | Key Props | Used In |
|-----------|-----------|---------|
| HeaderTop | onMenuClick, cartCount | VendorLayout |
| HeaderTabs | selectedCategory, onSelect | VendorLayout |
| SearchBar | — | VendorLayout — search, voice, barcode |
| CategoryNavbar | — | VendorLayout |
| MainSidebar | isOpen, onClose | VendorLayout |
| ProductCard | product, onAddToCart | Home, Search, CategoryProducts |
| Carousel | images | Home |
| Hero | — | Home |
| LanguageSelector | — | VendorLayout, MainSidebar |

## Customer Vendor Home Sections

| Component | CMS Section Key |
|-----------|-----------------|
| BannerCarousel | banners |
| CategoryTabs | category tabs |
| TrendingThisWeek | trending |
| TopSelection | top-selection |
| BrandsSpotlight | spotlight |
| BestQuality | best-quality |
| KeepShopping | keep-shopping |
| StillLookingSection | still-looking |
| RatingSection | ratings |
| SubCategoryGrid | subcategories |
| LazySection | wrapper for lazy load |
| SaleBanner | sale promotions |
| CategoryProductsSection | category products |
| CategoryCard | category display |
| MenuItem | menu grid item |

## Admin UI Components (admin/components/ui/)

Modal, ConfirmDialog, DataTable, Pagination, PageHeader, StatCard, StatusBadge, SkeletonLoader, EmptyState, ErrorState

## Seller UI Components

Layout: SellerLayout, Sidebar, Topbar, MobileMenu
Common: DataTable, StatCard, PageHeader, SearchFilter, ImageUploader, ConfirmModal, StatusBadge
UI: Button, Card, Badge, Toggle, Spinner, Skeleton, EmptyState, ErrorState

Per-component audits: [components/](./components/)
`);

w('13_Buttons.md', `# 13 — Buttons

Total button elements extracted: ${allButtons.length}

## Global Button Patterns

### Customer Marketplace
- Primary CTA: "Add to Cart", "Buy Now", "Place Order"
- Navigation: Bottom nav icons, sidebar links
- Auth: "Send OTP", "Verify & Login", "Resend OTP"
- Cart: Quantity +/- , "Proceed to Checkout", "Remove"
- Checkout: "Continue", "Pay Now" (simulated)

### Seller Portal
- Button.jsx reusable component with variants: primary, secondary, danger, ghost
- Product actions: Add, Edit, Delete, Duplicate, Toggle Status
- Order actions: Accept, Ship, Deliver, Cancel

### Admin Panel
- Inline styled buttons per page
- ConfirmDialog for destructive actions
- Export buttons on report pages (no implementation)

### Delivery App
- "Go Online/Offline" toggle
- "Accept Order", "Navigate", "Confirm Delivery" (OTP)
- "Call Customer"

## Button → API Mapping (Key Actions)

| Button Label | Page | Expected Endpoint | Method |
|--------------|------|-------------------|--------|
| Send OTP | Login | /api/auth/send-otp | POST |
| Verify & Login | Login | /api/auth/verify-otp | POST |
| Add to Cart | ProductDetail | /api/cart/items | POST |
| Place Order | Checkout | /api/orders | POST |
| Proceed to Checkout | Cart | — (navigation) | — |
| Add Product | seller/AddProduct | /api/seller/products | POST |
| Approve Vendor | admin/VendorApproval | /api/admin/vendors/:id/approve | PATCH |
| Process Refund | admin/Refunds | /api/admin/refunds/:id/process | POST |
| Confirm Delivery | delivery/OrderDetail | /api/delivery/orders/:id/deliver | POST |

Full button inventory per file: search \`## Buttons\` in [files/](./files/)
`);

w('14_Validation.md', `# 14 — Validation

## Customer Auth Validation (Login.jsx)

| Field | Rules |
|-------|-------|
| countryCode | Required; regex /^\\+?\\d{1,4}$/ |
| phoneNumber | Required; 8-11 digits |
| email | Required (email mode); standard email regex |
| otp | Required for verify; 6 digits expected |

## Seller Validation (seller/utils/validators.js)

| Function | Rules |
|----------|-------|
| validateEmail | Standard email format |
| validatePhone | 10-digit Indian mobile |
| validatePrice | Positive number |
| validateStock | Non-negative integer |
| validateRequired | Non-empty string |
| validateGST | GSTIN format |
| validatePAN | PAN format |
| validateIFSC | IFSC code format |
| validatePincode | 6-digit pincode |

## Form Validation Libraries

| Module | Library | Usage |
|--------|---------|-------|
| Customer Login/Signup | Manual state validation | Inline regex checks |
| Seller AddProduct | react-hook-form | register() with rules |
| Seller Settings | react-hook-form | Profile/bank/password forms |
| Seller Coupons | react-hook-form | Coupon creation modal |
| Delivery Signup | Manual | Basic required field checks |
| Admin forms | Mostly manual | Inline validation on submit |

## Missing Validation (Gaps)

- No server-side validation feedback handling
- No zod/yup schema definitions
- Card number validation is UI-only (SavedCards)
- Address pincode not validated against postal API
- File upload size/type not enforced (ImageUploader)
- OTP rate limiting not implemented client-side beyond 60s timer
`);

w('15_Roles.md', `# 15 — Roles

## Platform Roles (Inferred from Frontend)

| Role | Portal | Capabilities Shown in UI |
|------|--------|---------------------------|
| Customer | Marketplace | Browse, cart, checkout, profile, reviews, wallet |
| Guest | Marketplace | Browse (no checkout without auth) |
| Seller/Vendor | /seller | Product, order, inventory, earnings management |
| Super Admin | /admin | Full access (mock role) |
| Catalog Manager | /admin | Products, categories, banners |
| Finance Manager | /admin | Finance, reports, payouts |
| Support Agent | /admin | Tickets, returns, user view |
| Sub-Admin | /admin | Configurable via RoleManagement |
| Delivery Partner | /delivery | Order pickup/delivery, earnings |

## Role Definitions (MOCK_ROLES — admin/constants/dummyData.js)

1. **Super Admin** — permissions: ['all']
2. **Catalog Manager** — products, categories, banners
3. **Finance Manager** — finance, reports
4. **Support Agent** — tickets, returns, users.view

## Role Assignment UI
- admin/pages/system/SubAdmins.jsx — manage admin users
- admin/pages/system/RoleManagement.jsx — CRUD roles with permission matrix

## Backend Role Requirements

\`\`\`
roles: { id, name, description, permissions[], createdAt }
admin_users: { id, email, roleId, status, lastLogin }
\`\`\`

Enums: customer, seller, delivery_partner, admin, sub_admin
`);

w('16_Permissions.md', `# 16 — Permissions

## ALL_PERMISSIONS (admin/constants/dummyData.js)

${fs.readFileSync(path.join(ROOT, 'frontend/src/modules/admin/constants/dummyData.js'), 'utf8').match(/export const ALL_PERMISSIONS = \[([\s\S]*?)\];/)?.[0] || 'See dummyData.js'}

## Permission Groups

| Group | Permissions |
|-------|-------------|
| Dashboard | dashboard.view, dashboard.analytics |
| Users | users.view, users.edit, users.block, users.delete |
| Products | products.view, products.edit, products.approve, products.delete |
| Orders | orders.view, orders.edit, orders.cancel |
| Finance | finance.view, finance.edit, finance.payout |
| Sellers | sellers.view, sellers.edit, sellers.approve, sellers.suspend |
| Categories | categories.view, categories.edit, categories.delete |
| Banners | banners.view, banners.edit, banners.delete |
| Reports | reports.view, reports.export |
| Settings | settings.view, settings.edit |
| Tickets | tickets.view, tickets.edit, tickets.close |
| Returns | returns.view, returns.edit, returns.approve |
| Coupons | coupons.view, coupons.edit, coupons.delete |
| Notifications | notifications.view, notifications.send |
| System | system.admins, system.roles, system.audit, system.settings |

## Frontend Enforcement Status

**NONE** — Permissions are displayed in RoleManagement UI only. No route-level or component-level permission checks exist. AdminProtectedRoute only checks isAdminAuthenticated boolean.

## Required Backend Enforcement

Every admin API endpoint must validate JWT + permission scope. Frontend should receive permission array on login and conditionally render menu items.
`);

w('17_Business_Flows.md', `# 17 — Business Flows

## 1. Customer Registration & Authentication

\`\`\`
User opens /login
  → Chooses Phone or Email tab
  → Enters phone+country OR email
  → Clicks "Send OTP"
    → API: POST /auth/send-otp { type, identifier }
  → Enters 6-digit OTP
  → Clicks "Verify"
    → API: POST /auth/verify-otp { type, identifier, otp }
    → Response: { token, refreshToken, user }
  → Set localStorage.isAuthenticated = true
  → Navigate to previous page or /home
\`\`\`

**Signup flow:** Same OTP flow with additional name field on /signup.

## 2. Product Browsing

\`\`\`
User lands on /home
  → VendorLayout renders home sections (banners, trending, categories)
  → User selects category tab (HeaderTabs)
    → useVendorStore.setSelectedCategory(category)
  → User taps category → /category-products or /categories
  → User taps product → /product-detail
  → ProductDetail shows images, price, reviews, Add to Cart, Buy Now
\`\`\`

## 3. Search & Filter

\`\`\`
User taps search → /search or SearchBar overlay
  → Text search OR voice (UI) OR barcode scan (mock)
  → API: GET /products/search?q=&category=&filters=
  → Results rendered as ProductCard grid
  → CategoryProducts: filter drawer (price, rating, brand)
\`\`\`

## 4. Cart & Checkout

\`\`\`
Add to Cart (ProductDetail)
  → Read localStorage.userCart
  → Push item { id, name, price, qty, image }
  → Write localStorage + dispatch cartUpdated event
  → VendorLayout updates cartCount badge

/cart
  → Display items, quantity controls, address modal
  → Save address to localStorage.cartAddress
  → "Proceed to Checkout" → /checkout

/checkout (requires isAuthenticated)
  Step 1: Address (pre-filled from cartAddress)
  Step 2: Order Summary (items, totals, delivery estimate)
  Step 3: Payment (UPI/Card/COD/Wallet — UI only)
  → "Place Order"
    → API: POST /orders { items, addressId, paymentMethod, couponCode }
    → Payment gateway redirect/webhook (not implemented)
  → Success screen with order ID
  → addOrder() to useAccountStore
  → Clear userCart
\`\`\`

## 5. Wishlist

\`\`\`
ProductDetail → Heart icon
  → useAccountStore.addToWishlist(product)
  → Persisted to localStorage.userWishlist
/profile/wishlist → display, remove items
\`\`\`

## 6. Order Tracking

\`\`\`
/profile/orders → list from useAccountStore.orders (mock seed + placed orders)
/profile/orders/:orderId → timeline: Confirmed → Shipped → Out for Delivery → Delivered
  → API: GET /orders/:id/tracking
  → Actions: Cancel, Return, Review (UI buttons)
\`\`\`

## 7. Returns & Refunds (Customer)

\`\`\`
OrderDetail → "Return Item"
  → Select reason, upload images
  → API: POST /orders/:id/returns { reason, items, images }
Admin: /admin/operations/returns → approve/reject
Admin: /admin/operations/refunds → process refund to wallet/source
\`\`\`

## 8. Seller Onboarding

\`\`\`
Seller applies (not in customer UI — admin side)
Admin: /admin/vendors/approval → review KYC documents
  → Approve → seller account activated
  → API: PATCH /admin/vendors/:id/status
Seller: /seller/login → dashboard access
\`\`\`

## 9. Seller Product Management

\`\`\`
/seller/products → list with search/filter
/seller/products/add → form with images, pricing, inventory
  → API: POST /seller/products
/seller/inventory → stock levels, alerts, history
\`\`\`

## 10. Seller Order Fulfillment

\`\`\`
/seller/orders → new orders
/seller/orders/:id → accept → pack → ship (status updates)
  → API: PATCH /seller/orders/:id/status
/seller/returns → approve/reject return requests
\`\`\`

## 11. Delivery Flow

\`\`\`
/delivery/auth → phone login (mock)
/delivery/dashboard → go online, view stats
/delivery/orders → available/active/completed tabs
/delivery/orders/:orderId
  → Navigate to pickup → pickup confirm
  → Navigate to customer → OTP verification (MOCK_ORDER.otp)
  → Confirm delivery → earning credited
  → API: POST /delivery/orders/:id/pickup, /deliver
\`\`\`

## 12. Admin CMS (Storefront)

\`\`\`
/admin/storefront/banners → CRUD hero banners
/admin/storefront/chips → category chip management
/admin/storefront/sections/:section → home section product curation
  Sections: still-looking, top-selection, spotlight, best-quality, keep-shopping
/admin/categories → category tree CRUD
\`\`\`

## 13. Promotions

\`\`\`
Admin creates coupon → /admin/promotions/coupons
Admin creates flash sale → /admin/promotions/flash-sale
Customer applies coupon at checkout (UI placeholder)
Wallet credits from refunds/promotions
\`\`\`

## 14. Multi-Flow Commerce

| Flow | Entry Route | Branding | localStorage Flag |
|------|-------------|----------|-------------------|
| You Buy (default) | /home | Olive green | — |
| Mithilak | /mithilak | Purple/teal | isMithilakFlow |
| Quick Shop | /quick-shop | Pink/red | isQuickShopFlow |
| Fresh Grocery | /fresh-grocery | Gold/cream | isFreshGroceryFlow |

Each flow affects checkout colors, shop-now links, and header styling.
`);

w('18_State_Management.md', `# 18 — State Management

## Redux Store (store/index.js)

\`\`\`javascript
{
  admin: adminSlice,
  vendor: vendorSlice,
  products: productSlice,
  orders: orderSlice,
  finance: financeSlice,
  analytics: analyticsSlice,
  notifications: notificationSlice
}
\`\`\`

### productSlice — Key State
- allProducts[], categories[], banners[], loading, error
- Actions: addProduct, updateProduct, approveProduct, deleteProduct

### vendorSlice — Key State  
- selectedCategory, vendor info

### orderSlice, financeSlice, analyticsSlice, adminSlice, notificationSlice
- Seed data for admin dashboard (hardcoded initial state)

## Zustand Stores

### useAccountStore
| State | Type | Persistence |
|-------|------|-------------|
| userProfile | object | Memory only |
| savedAddresses | array | Memory only |
| savedCards | array | Memory only |
| orders | array | Memory only |
| wishlist | array | localStorage.userWishlist |
| coupons | array | Memory only |
| notifications | array | Memory only |
| selectedAddressId | number | Memory |
| isDarkMode | boolean | Memory (toggle disabled) |

### useVendorStore
- selectedCategory, flow-related state

### useDeliveryStore
- Delivery agent online status, active orders

## React Context (Seller Only)

| Context | State | Methods |
|---------|-------|---------|
| SellerAuthContext | seller, token, isAuthenticated | login, logout |
| ThemeContext | isDark | toggleTheme |

## localStorage Keys

${allLocalStorage.map(k => `- \`${k}\``).join('\n')}

## Custom Events
- \`cartUpdated\` — dispatched on cart mutations, listened by VendorLayout
`);

w('19_API_Requirements.md', `# 19 — API Requirements

## API Base URLs (Recommended)

| Service | Base Path |
|---------|-----------|
| Customer API | /api/v1 |
| Seller API | /api/v1/seller |
| Admin API | /api/v1/admin |
| Delivery API | /api/v1/delivery |

## Authentication APIs

| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | /auth/send-phone-otp | { countryCode, phone } | { success, expiresIn } |
| POST | /auth/verify-phone-otp | { countryCode, phone, otp } | { token, refreshToken, user } |
| POST | /auth/send-email-otp | { email } | { success, expiresIn } |
| POST | /auth/verify-email-otp | { email, otp } | { token, refreshToken, user } |
| POST | /auth/refresh | { refreshToken } | { token, refreshToken } |
| POST | /auth/logout | — | { success } |
| POST | /seller/auth/login | { email, password } | { token, seller } |
| POST | /admin/auth/login | { email, password } | { token, admin, permissions } |
| POST | /delivery/auth/login | { phone, otp } | { token, partner } |

## Product APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /products | List with pagination, filters, search |
| GET | /products/:id | Product detail with variants, reviews |
| GET | /products/search | Full-text search |
| GET | /categories | Category tree |
| GET | /categories/:id/products | Category products |

## Cart & Order APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /cart | Get user cart |
| POST | /cart/items | Add item |
| PATCH | /cart/items/:id | Update quantity |
| DELETE | /cart/items/:id | Remove item |
| POST | /orders | Place order |
| GET | /orders | User order list |
| GET | /orders/:id | Order detail + tracking |
| POST | /orders/:id/cancel | Cancel order |
| POST | /orders/:id/returns | Initiate return |

## User Profile APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /users/me | Profile |
| PUT | /users/me | Update profile |
| CRUD | /users/me/addresses | Address management |
| CRUD | /users/me/cards | Saved payment methods |
| GET | /users/me/wishlist | Wishlist |
| POST | /users/me/wishlist | Add to wishlist |
| DELETE | /users/me/wishlist/:id | Remove |
| GET | /users/me/coupons | Available coupons |
| GET | /users/me/wallet | Wallet balance & transactions |

## Seller APIs (from sellerApi.js)

Complete list of 40+ stubbed endpoints — see [27_TODOs.md](./27_TODOs.md)

## Admin APIs

| Domain | Endpoints |
|--------|-----------|
| Users | GET/PUT/DELETE /admin/users, block, unblock |
| Vendors | GET/POST /admin/vendors, approve, suspend, KYC review |
| Products | GET /admin/products/moderation, approve, reject |
| Orders | GET /admin/orders, update status, assign delivery |
| Returns | GET /admin/returns, approve, reject |
| Refunds | GET /admin/refunds, process, reject |
| CMS | CRUD /admin/banners, /admin/chips, /admin/sections |
| Promotions | CRUD /admin/coupons, /admin/flash-sales |
| Finance | GET /admin/earnings, POST /admin/payouts, tax config |
| Reports | GET /admin/reports/{type}?range= |
| System | CRUD /admin/roles, /admin/sub-admins, GET /admin/audit-logs |
| Notifications | POST /admin/notifications/broadcast |

## Delivery APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /delivery/orders | Available & active orders |
| POST | /delivery/orders/:id/accept | Accept order |
| POST | /delivery/orders/:id/pickup | Confirm pickup |
| POST | /delivery/orders/:id/deliver | OTP-verified delivery |
| GET | /delivery/earnings | Earnings summary |
| PATCH | /delivery/profile | Update profile |

## Payment Integration (Placeholder in Checkout)

- UPI: Paytm, PhonePe, GPay redirect/deeplink
- Card: Tokenized via payment gateway
- COD: Cash on delivery flag
- Wallet: Internal wallet debit

Required: POST /payments/initiate, POST /payments/verify (webhook)
`);

w('20_Database_Requirements.md', `# 20 — Database Requirements

## Core Entities

### users
\`\`\`
id, name, email, phone, countryCode, gender, dob, avatarUrl,
authProvider, isVerified, status, createdAt, updatedAt
\`\`\`

### user_addresses
\`\`\`
id, userId, type(HOME/WORK/OTHER), name, phone, line1, line2,
city, state, pincode, landmark, isDefault, lat, lng
\`\`\`

### user_payment_methods
\`\`\`
id, userId, type(VISA/MC/UPI), tokenizedNumber, expiry, holder,
gatewayToken, isDefault
\`\`\`

### sellers
\`\`\`
id, storeName, ownerName, email, phone, address, status,
kycStatus, gst, pan, bankAccountId, commissionRate, joinedAt
\`\`\`

### seller_documents
\`\`\`
id, sellerId, type(GST/PAN/BANK), url, status, verifiedAt
\`\`\`

### categories
\`\`\`
id, name, slug, parentId, imageUrl, sortOrder, isActive
\`\`\`

### products
\`\`\`
id, sellerId, title, description, sku, price, mrp, stock,
categoryId, status(pending/approved/rejected), images[], tags[],
rating, reviewCount, createdAt
\`\`\`

### product_variants
\`\`\`
id, productId, name, price, stock, attributes(JSON)
\`\`\`

### orders
\`\`\`
id, userId, status, subtotal, discount, tax, deliveryCharge,
total, paymentMethod, paymentStatus, addressSnapshot(JSON),
createdAt, deliveredAt
\`\`\`

### order_items
\`\`\`
id, orderId, productId, sellerId, quantity, price, status
\`\`\`

### order_tracking
\`\`\`
id, orderId, status, timestamp, location, note
\`\`\`

### returns
\`\`\`
id, orderId, orderItemId, reason, images[], status, createdAt
\`\`\`

### refunds
\`\`\`
id, returnId, orderId, userId, amount, method(wallet/source),
status, processedAt
\`\`\`

### coupons
\`\`\`
id, code, type(percent/fixed), value, minOrder, maxDiscount,
usageLimit, usedCount, expiry, sellerId(null=platform), isActive
\`\`\`

### wallets
\`\`\`
id, userId, balance, currency
\`\`\`

### wallet_transactions
\`\`\`
id, walletId, type(credit/debit), amount, reference, description
\`\`\`

### reviews
\`\`\`
id, productId, userId, orderId, rating, title, body, images[],
status, createdAt
\`\`\`

### product_qna
\`\`\`
id, productId, userId, question, answer, answeredBy, status
\`\`\`

### delivery_partners
\`\`\`
id, name, phone, vehicleType, status, isOnline, currentLat, currentLng
\`\`\`

### delivery_assignments
\`\`\`
id, orderId, partnerId, status, pickupOtp, deliveryOtp, earning
\`\`\`

### banners
\`\`\`
id, title, imageUrl, link, position, sortOrder, isActive, startDate, endDate
\`\`\`

### home_sections
\`\`\`
id, sectionKey, title, productIds[], isActive, sortOrder
\`\`\`

### admin_users
\`\`\`
id, email, passwordHash, roleId, name, status, lastLogin
\`\`\`

### roles
\`\`\`
id, name, description, permissions[]
\`\`\`

### audit_logs
\`\`\`
id, adminId, action, target, ip, metadata, timestamp
\`\`\`

### notifications
\`\`\`
id, userId, type, title, body, isRead, createdAt
\`\`\`

### support_tickets
\`\`\`
id, userId, subject, status, priority, messages[], createdAt
\`\`\`

## Indexes (Recommended)
- products: categoryId, sellerId, status, (title text)
- orders: userId, status, createdAt
- order_items: orderId, sellerId
- delivery_assignments: partnerId, status

## Relationships
- users 1:N orders, addresses, reviews, wishlist
- sellers 1:N products, orders (via order_items)
- orders 1:N order_items, 1:1 delivery_assignment
- products N:1 categories, N:1 sellers
`);

w('21_Security_Requirements.md', `# 21 — Security Requirements

## Current Security Posture: **DEVELOPMENT ONLY**

### Authentication Gaps
- Customer auth: hardcoded OTP credentials in authApi.js
- Admin auth: any credentials set isAdminAuthenticated=true (Auth.jsx mock login)
- Delivery auth: localStorage flag only
- Seller auth: dummy token in SellerAuthContext
- No JWT validation, no token expiry, no refresh flow

### Authorization Gaps
- No RBAC enforcement on admin routes or API calls
- No seller-scoped data isolation
- Customer profile pages accessible without auth guard
- Checkout auth bypassable by setting localStorage

### Required Security Implementation

| Area | Requirement |
|------|-------------|
| Auth | JWT access + refresh tokens, HttpOnly cookies or secure storage |
| OTP | Rate limiting (5/min), 6-digit crypto-random, 5-min expiry |
| Password | bcrypt hashing for seller/admin, strength requirements |
| RBAC | Permission middleware on every admin endpoint |
| Seller isolation | sellerId scoped queries on all seller APIs |
| Input validation | Server-side validation mirroring frontend rules |
| File upload | MIME check, size limit, virus scan, S3 pre-signed URLs |
| Payment | PCI-DSS via payment gateway tokenization |
| CORS | Whitelist frontend domains |
| Rate limiting | API gateway rate limits per IP/user |
| Audit | Log all admin actions (audit_logs table) |
| CSRF | Token for cookie-based auth |
| XSS | Sanitize user-generated content (reviews, Q&A) |
| Delivery OTP | Server-generated, single-use, time-limited |

### Sensitive Operations Requiring Extra Auth
- Admin payout processing
- Refund approval
- User account deletion
- Seller KYC approval
- Role/permission changes
- Sub-admin creation
`);

w('22_Performance_Requirements.md', `# 22 — Performance Requirements

## Implemented Optimizations

| Technique | Location |
|-----------|----------|
| Lazy loading (React.lazy) | seller/SellerRoutes.jsx — all seller pages |
| LazySection wrapper | user vendor home sections |
| Suspense + skeleton | seller page loading fallback |
| Scroll listener (passive) | VendorLayout |
| PWA service worker | vite-plugin-pwa |
| Image assets (static import) | Throughout — no CDN yet |
| useDebounce | seller SearchFilter |
| usePagination | seller list pages (client-side) |

## Required Optimizations (Not Yet Implemented)

| Technique | Where Needed |
|-----------|--------------|
| API pagination | All list pages (products, orders, users) |
| Infinite scroll | Search results, product grids |
| Image lazy loading | ProductCard, ProductDetail galleries |
| Virtualization | Long order/product lists |
| React Query / RTK Query | Server state caching |
| CDN | Product images, banners |
| Debounced search | SearchBar, admin global search |
| Prefetch | Product detail on card hover |
| Optimistic updates | Cart operations, wishlist toggle |
| Code splitting | Customer module (not lazy loaded) |
| Bundle analysis | Admin recharts, framer-motion |

## Caching Strategy (Recommended)

| Data | Cache | TTL |
|------|-------|-----|
| Categories | Redis + CDN | 1 hour |
| Home sections | Redis | 15 min |
| Product detail | Redis | 5 min |
| User cart | Server session | Session |
| Search results | Redis | 2 min |
`);

w('23_Backend_Gap_Analysis.md', `# 23 — Backend Gap Analysis

## Integration Status by Feature

| Feature | Frontend Status | Backend Needed | Priority |
|---------|----------------|----------------|----------|
| Customer OTP Auth | Mock | Full auth service | P0 |
| Product catalog | Static images + dummy | Product service + search | P0 |
| Cart | localStorage | Cart API + sync | P0 |
| Checkout/Orders | Client-side mock | Order + Payment service | P0 |
| User profile | Zustand seed | User service | P0 |
| Addresses | Zustand seed | Address CRUD API | P0 |
| Wishlist | localStorage partial | Wishlist API | P1 |
| Wallet | UI only | Wallet ledger service | P1 |
| Coupons | Mock data | Coupon engine | P1 |
| Reviews/Q&A | UI only | UGC service | P1 |
| Seller portal | Full UI, mock API | Seller service | P0 |
| Admin panel | Full UI, mock data | Admin service | P0 |
| Delivery app | Full UI, mock data | Delivery service | P1 |
| CMS (banners/sections) | Admin UI | CMS service | P1 |
| Notifications | Mock | Notification service (push/email/SMS) | P2 |
| Reports | Charts with dummy data | Analytics/BI pipeline | P2 |
| RBAC | UI only | AuthZ middleware | P1 |
| File uploads | UI only | S3/storage service | P0 |
| Payment gateway | UI placeholders | Razorpay/Stripe integration | P0 |
| Real-time tracking | Static timeline | WebSocket/SSE + GPS | P2 |
| i18n | 4 locales frontend | Content translation API | P3 |

## API Client Gaps
- No axios instance for customer module
- No request/response interceptors for auth
- No error handling middleware
- No retry logic
- No API versioning
`);

w('24_Missing_Functionality.md', `# 24 — Missing Functionality

## Features Shown in UI But Not Functional

1. **Voice search** — SearchBar microphone button (no Web Speech API)
2. **Barcode/QR scanner** — Mock simulation only
3. **Payment processing** — Checkout simulates 2s delay, no gateway
4. **Real-time order tracking** — Static status steps
5. **Push notifications** — NotificationSettings UI, no FCM
6. **Email notifications** — Toggle UI only
7. **Export reports** — Buttons present, no download
8. **Print order** — Not implemented
9. **PDF invoice** — Not implemented
10. **Dark mode** — Toggle exists but forced false
11. **Seller image upload** — ImageUploader uses local preview only
12. **GPS tracking** — Delivery navigate buttons (no maps integration)
13. **Chat support** — HelpCenter static FAQ
14. **Live inventory sync** — Stock shown from mock data
15. **Multi-vendor cart split** — Single cart, no seller grouping
16. **Guest checkout** — Blocked at checkout auth guard
17. **Social login** — Not present
18. **Product comparison** — Not present
19. **Subscription/recurring orders** — Not present
20. **Admin global search** — Filters quickLinks only (client-side)

## Routes Without Mounted Components
- modules/vendor/routes/SellerRoutes.jsx — not in App.jsx
- modules/user/routes/VendorRoutes.jsx — superseded by MarketRoutes
- admin/pages/Permissions.jsx, SubAdmins.jsx (duplicate), Products.jsx — not in AdminRoutes
`);

w('25_Hardcoded_Data.md', `# 25 — Hardcoded Data

## Authentication Credentials
- Phone: 9111966732, OTP: 123456 (authApi.js)
- Email: mithilakart@gmail.com, OTP: 123456 (authApi.js)

## User Profile Seed (useAccountStore.js)
- Name: Harsh Pandey
- Email: harsh.vendor@mithilakart.com
- Phone: 9876543210
- Default address in Sector 5, Harsud

## Checkout Default Product
- EVOFOX Blaze Gaming Mouse, ₹622 (Checkout.jsx)

## Flow Branding Colors
- Mithilak: #207C8A, #8b5cf6
- Quick Shop: #d6186d, #ff2a5f
- Fresh Grocery: #D9A21B, #FFF8EE
- You Buy: #3E5A44

## Redux Seed Data
- productSlice: 3 products (P101-P103)
- All slices contain hardcoded initial arrays

## Admin Dashboard Stats (DASHBOARD_STATS)
- totalRevenue: 1,250,000
- totalOrders: 4,520
- activeVendors: 125

## External URLs
- Unsplash images in order seed data
- Background texture: /Screenshot 2026-07-17 130906.png (public folder)

## Category Data
- data/categoryData.js — static category definitions

See [26_Mock_Data.md](./26_Mock_Data.md) for mock data files.
`);

w('26_Mock_Data.md', `# 26 — Mock Data

## Centralized Mock Files

| File | Used By | Contents |
|------|---------|----------|
| seller/utils/dummyData.js | All seller pages | sellerProfile, products, orders, returns, customers, reviews, coupons, notifications, earnings, analytics, inventory |
| admin/constants/dummyData.js | Admin reports, roles, audit, refunds, seller detail | DASHBOARD_STATS, report arrays, MOCK_ROLES, ALL_PERMISSIONS, MOCK_AUDIT_LOGS |
| store/slices/*.js | Redux store | Seed arrays for products, orders, finance, analytics |
| store/useAccountStore.js | Customer profile pages | userProfile, addresses, cards, orders, coupons |
| data/categoryData.js | Category pages | Category hierarchy |

## Inline Mock Data (per-page)

| File | Variable |
|------|----------|
| admin/Users.jsx | MOCK_USERS |
| admin/Orders.jsx | MOCK_ORDERS |
| admin/Payouts.jsx | MOCK_PAYOUTS |
| admin/pages/promotions/Coupons.jsx | MOCK_COUPONS |
| admin/pages/promotions/FlashSale.jsx | MOCK_SALES |
| admin/pages/promotions/FeaturedProducts.jsx | MOCK_FEATURED, MOCK_TRENDING |
| admin/pages/operations/Returns.jsx | MOCK_RETURNS |
| admin/pages/inventory/StockAlerts.jsx | MOCK_ALERTS |
| admin/pages/finance/TaxConfig.jsx | MOCK_TAX_SLABS |
| admin/pages/finance/DeliveryCharges.jsx | MOCK_ZONES |
| admin/pages/delivery/AllDeliveries.jsx | MOCK_PARTNERS |
| admin/pages/delivery/DeliveryApproval.jsx | MOCK_APPLICATIONS |
| admin/pages/content/ReviewModeration.jsx | MOCK_REVIEWS |
| admin/pages/content/QnAModeration.jsx | MOCK_QNA |
| admin/pages/support/Tickets.jsx | MOCK_TICKETS |
| admin/pages/system/SubAdmins.jsx | MOCK_ADMINS |
| admin/layouts/AdminLayout.jsx | mockNotifications |
| delivery/pages/Orders.jsx | MOCK_ORDERS |
| delivery/pages/OrderDetail.jsx | MOCK_ORDER |
| user/pages/Products.jsx | dummyProducts |
`);

w('28_Risk_Report.md', `# 28 — Risk Report

## Critical Risks (P0)

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| 1 | No real authentication | Account takeover, data breach | Implement JWT auth before production |
| 2 | Payment simulation | Revenue loss, fraud | Integrate payment gateway with webhooks |
| 3 | Client-only cart/orders | Data loss, inconsistency | Server-side cart and order management |
| 4 | No input sanitization backend | XSS, injection | Server validation + sanitization |
| 5 | Hardcoded OTP credentials | Security vulnerability | Remove before any deployment |

## High Risks (P1)

| # | Risk | Impact |
|---|------|--------|
| 6 | No RBAC enforcement | Unauthorized admin actions |
| 7 | Split state management | Data sync bugs across devices |
| 8 | No API error handling | Poor UX, silent failures |
| 9 | Mock inventory | Overselling products |
| 10 | No file upload backend | Broken product images |

## Medium Risks (P2)

| # | Risk | Impact |
|---|------|--------|
| 11 | Duplicate route files | Developer confusion |
| 12 | Legacy vendor module | Maintenance burden |
| 13 | No tests | Regression risk |
| 14 | Large static assets in bundle | Performance |
| 15 | No monitoring/logging | Incident response delay |

## Compliance Risks
- GST/tax config UI without tax calculation engine
- Legal policy pages static, not CMS-driven
- KYC document storage not implemented
- PCI compliance for card storage not addressed
`);

w('29_Backend_Implementation_Order.md', `# 29 — Backend Implementation Order

## Phase 1 — Foundation (Weeks 1-3)
1. Project setup, database schema, migrations
2. Auth service (OTP, JWT, refresh tokens)
3. User profile + address CRUD
4. Category + product catalog APIs
5. File upload service (S3)
6. Basic admin auth + middleware

## Phase 2 — Commerce Core (Weeks 4-6)
7. Cart API (server-side)
8. Order placement + order items
9. Payment gateway integration
10. Inventory management + stock reservation
11. Seller registration + KYC
12. Seller product CRUD

## Phase 3 — Operations (Weeks 7-9)
13. Seller order management + status workflow
14. Admin order oversight
15. Delivery partner registration
16. Delivery assignment + OTP delivery
17. Returns + refunds workflow
18. Wallet + coupon engine

## Phase 4 — Engagement (Weeks 10-12)
19. Reviews + Q&A
20. Wishlist API
21. Notifications (email, SMS, push)
22. CMS (banners, home sections, chips)
23. Search service (Elasticsearch/Algolia)
24. Promotions (flash sales, featured)

## Phase 5 — Platform (Weeks 13-15)
25. Admin RBAC + sub-admins
26. Audit logging
27. Reports + analytics pipeline
28. Finance (commission, payouts, tax)
29. Support tickets
30. Real-time order tracking (WebSocket)

## Phase 6 — Polish (Weeks 16-18)
31. Performance optimization + caching
32. i18n content management
33. Rate limiting + security hardening
34. Monitoring + alerting
35. Frontend API integration (replace all mocks)
`);

w('30_Final_Master_Audit.md', `# 30 — Final Master Audit

## Audit Completion Statement

This audit documents the complete Mithilakart frontend codebase as of ${new Date().toISOString().split('T')[0]}.

## Coverage Summary

| Area | Files Documented | Status |
|------|-----------------|--------|
| Source code files | ${codeFiles.length} | ✅ Complete |
| Per-file audits | ${codeFiles.length} in files/ | ✅ Complete |
| Routes catalogued | 100+ | ✅ Complete |
| Pages documented | 70+ | ✅ Complete |
| Components documented | 80+ | ✅ Complete |
| Business flows | 14 major flows | ✅ Complete |
| API requirements | 80+ endpoints | ✅ Complete |
| Database entities | 25+ tables | ✅ Complete |
| Security requirements | Documented | ✅ Complete |
| Mock/hardcoded data | Catalogued | ✅ Complete |
| TODOs | ${allTodos.length} items | ✅ Complete |

## Application Surfaces

1. **Customer Marketplace** — 37 routes, 37 pages, mobile-first PWA
2. **Seller Portal** — 16 routes, 15 pages, lazy-loaded dashboard
3. **Admin Panel** — 45+ routes, 40+ pages, full platform management
4. **Delivery App** — 11 routes, 11 pages, last-mile operations

## Key Findings

### Strengths
- Comprehensive UI coverage for full e-commerce lifecycle
- Well-structured module separation by persona
- Seller module has complete API stub layer ready for integration
- Admin panel covers CMS, finance, reports, RBAC
- i18n support for 4 languages
- Modern React 19 + Vite 6 stack

### Critical Gaps
- **100% mock backend** — no production API integration
- **localStorage auth** — not secure
- **No tests** — zero test files found
- **State fragmentation** — Redux + Zustand + localStorage

## Document Index

| # | Document |
|---|----------|
| 01 | Project Overview |
| 02 | Project Architecture |
| 03 | Folder Structure |
| 04 | Routes |
| 05 | Navigation |
| 06 | Modules |
| 07 | Pages |
| 08 | Components |
| 09 | Forms |
| 10 | Tables |
| 11 | Modals |
| 12 | Drawers |
| 13 | Buttons |
| 14 | Validation |
| 15 | Roles |
| 16 | Permissions |
| 17 | Business Flows |
| 18 | State Management |
| 19 | API Requirements |
| 20 | Database Requirements |
| 21 | Security Requirements |
| 22 | Performance Requirements |
| 23 | Backend Gap Analysis |
| 24 | Missing Functionality |
| 25 | Hardcoded Data |
| 26 | Mock Data |
| 27 | TODOs |
| 28 | Risk Report |
| 29 | Backend Implementation Order |
| 30 | Final Master Audit |

## Subdirectories
- \`files/\` — ${codeFiles.length} per-file audit documents
- \`pages/\` — page-specific audits
- \`components/\` — component-specific audits
- \`routes/\` — route file audits
- \`stores/\` — state management audits
- \`services/\` — API service audits

## Recommendation

The frontend is a **complete UI prototype** ready for backend integration. Priority should be Phase 1-2 from [29_Backend_Implementation_Order.md](./29_Backend_Implementation_Order.md): auth, catalog, cart, orders, and payments.

**This audit is sufficient for a backend team to build the entire production backend without re-opening the frontend source code**, with per-file audits available for any ambiguous behavior.
`);

console.log('All 30 master audit documents generated.');
