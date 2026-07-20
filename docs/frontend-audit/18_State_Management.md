# 18 — State Management

## Redux Store (store/index.js)

```javascript
{
  admin: adminSlice,
  vendor: vendorSlice,
  products: productSlice,
  orders: orderSlice,
  finance: financeSlice,
  analytics: analyticsSlice,
  notifications: notificationSlice
}
```

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

## Custom Events
- `cartUpdated` — dispatched on cart mutations, listened by VendorLayout
