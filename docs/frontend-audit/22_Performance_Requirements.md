# 22 — Performance Requirements

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
