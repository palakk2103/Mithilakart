# 05 — Navigation

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
