# 13 — Buttons

Total button elements extracted: 527

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

Full button inventory per file: search `## Buttons` in [files/](./files/)
