# Route Deep-Dive: `/home` · `/vendor/home`

**Page:** `Home.jsx` | **Layout:** `VendorLayout` | **Router:** `MarketRoutes.jsx`

## Purpose
Primary storefront landing page. Surfaces category navigation, promotional banners, curated product sections, today's deals, and tab-filtered product grids.

## Components
| Component | Role |
|-----------|------|
| `VendorLayout` | Shell with HeaderTop, HeaderTabs, SearchBar, CategoryNavbar, MainSidebar, bottom nav |
| Inline category row | 9 horizontal category chips |
| Fashion sale banner | Promo banner → `/category-products?category=Fashion` |
| `SubCategoryGrid` | Shop-by-categories grid |
| `TrendingThisWeek` | Trending products carousel |
| Today's Special Deals | Hardcoded 3-item deal grid with inline add-to-cart |
| `LazySection` | Lazy-load wrapper for below-fold sections |
| `TopSelection`, `BrandsSpotlight`, `BestQuality` | From `useVendorStore.homeSections` |
| `CategoryTabs` | Bottom tab bar |
| `CategoryProductsSection` | Dynamic product grid by `activeTab` / `selectedCategory` |
| `useVendorStore` | `selectedCategory`, `homeSections`, `setSelectedCategory` |
| `react-hot-toast` | Quick add-to-cart feedback |

## Business Flow
1. User lands on `/home` (redirect from `/`).
2. Category row tap → category route or stays on home for "You Buy".
3. `selectedCategory` You Buy/Home → full home content; else category-only `CategoryProductsSection`.
4. Deal card tap → `/product-detail` with router state.
5. Deal "+" → `localStorage.userCart` + `cartUpdated` event + toast.
6. "View All" deals → `/deals`.

## Expected APIs
| Endpoint | Method | Current State |
|----------|--------|---------------|
| `GET /storefront/home-sections` | GET | Mock — `useVendorStore.homeSections` |
| `GET /storefront/banners` | GET | Mock — hardcoded `categoryBanners` |
| `GET /storefront/deals/today` | GET | Mock — inline array |
| `GET /products?category={tab}` | GET | Mock — `CategoryProductsSection` |
| `GET /categories` | GET | Mock — hardcoded list |
| `POST /cart/items` | POST | Not wired — localStorage |

## Permissions
- **View / add to cart:** Public (localStorage cart)

## Errors
| Scenario | Handling |
|----------|----------|
| Cart localStorage parse failure | Not handled on Home |
| Missing product image | Bundled asset fallback |
| Failed API (future) | Static store fallback |
| Missing product-detail state | ProductDetail default fallback |
