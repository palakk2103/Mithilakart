# 08 — Components

Total component files analyzed: 60

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
