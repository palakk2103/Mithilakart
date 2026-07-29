# 12 — Drawers

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
