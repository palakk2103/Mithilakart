# 24 — Missing Functionality

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
- See [supplementary/34_Unrouted_Admin_Pages.md](./supplementary/34_Unrouted_Admin_Pages.md) for full orphan admin page inventory

## Search Page Gap
- `Search.jsx` ProductCard results do not navigate to product-detail on tap
