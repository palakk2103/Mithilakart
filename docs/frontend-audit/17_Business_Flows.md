# 17 — Business Flows

## 1. Customer Registration & Authentication

```
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
```

**Signup flow:** Same OTP flow with additional name field on /signup.

## 2. Product Browsing

```
User lands on /home
  → VendorLayout renders home sections (banners, trending, categories)
  → User selects category tab (HeaderTabs)
    → useVendorStore.setSelectedCategory(category)
  → User taps category → /category-products or /categories
  → User taps product → /product-detail
  → ProductDetail shows images, price, reviews, Add to Cart, Buy Now
```

## 3. Search & Filter

```
User taps search → /search or SearchBar overlay
  → Text search OR voice (UI) OR barcode scan (mock)
  → API: GET /products/search?q=&category=&filters=
  → Results rendered as ProductCard grid
  → CategoryProducts: filter drawer (price, rating, brand)
```

## 4. Cart & Checkout

```
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
```

## 5. Wishlist

```
ProductDetail → Heart icon
  → useAccountStore.addToWishlist(product)
  → Persisted to localStorage.userWishlist
/profile/wishlist → display, remove items
```

## 6. Order Tracking

```
/profile/orders → list from useAccountStore.orders (mock seed + placed orders)
/profile/orders/:orderId → timeline: Confirmed → Shipped → Out for Delivery → Delivered
  → API: GET /orders/:id/tracking
  → Actions: Cancel, Return, Review (UI buttons)
```

## 7. Returns & Refunds (Customer)

```
OrderDetail → "Return Item"
  → Select reason, upload images
  → API: POST /orders/:id/returns { reason, items, images }
Admin: /admin/operations/returns → approve/reject
Admin: /admin/operations/refunds → process refund to wallet/source
```

## 8. Seller Onboarding

```
Seller applies (not in customer UI — admin side)
Admin: /admin/vendors/approval → review KYC documents
  → Approve → seller account activated
  → API: PATCH /admin/vendors/:id/status
Seller: /seller/login → dashboard access
```

## 9. Seller Product Management

```
/seller/products → list with search/filter
/seller/products/add → form with images, pricing, inventory
  → API: POST /seller/products
/seller/inventory → stock levels, alerts, history
```

## 10. Seller Order Fulfillment

```
/seller/orders → new orders
/seller/orders/:id → accept → pack → ship (status updates)
  → API: PATCH /seller/orders/:id/status
/seller/returns → approve/reject return requests
```

## 11. Delivery Flow

```
/delivery/auth → phone login (mock)
/delivery/dashboard → go online, view stats
/delivery/orders → available/active/completed tabs
/delivery/orders/:orderId
  → Navigate to pickup → pickup confirm
  → Navigate to customer → OTP verification (MOCK_ORDER.otp)
  → Confirm delivery → earning credited
  → API: POST /delivery/orders/:id/pickup, /deliver
```

## 12. Admin CMS (Storefront)

```
/admin/storefront/banners → CRUD hero banners
/admin/storefront/chips → category chip management
/admin/storefront/sections/:section → home section product curation
  Sections: still-looking, top-selection, spotlight, best-quality, keep-shopping
/admin/categories → category tree CRUD
```

## 13. Promotions

```
Admin creates coupon → /admin/promotions/coupons
Admin creates flash sale → /admin/promotions/flash-sale
Customer applies coupon at checkout (UI placeholder)
Wallet credits from refunds/promotions
```

## 14. Multi-Flow Commerce

| Flow | Entry Route | Branding | localStorage Flag |
|------|-------------|----------|-------------------|
| You Buy (default) | /home | Olive green | — |
| Mithilak | /mithilak | Purple/teal | isMithilakFlow |
| Quick Shop | /quick-shop | Pink/red | isQuickShopFlow |
| Fresh Grocery | /fresh-grocery | Gold/cream | isFreshGroceryFlow |

Each flow affects checkout colors, shop-now links, and header styling.
