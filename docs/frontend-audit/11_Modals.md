# 11 — Modals

## Summary
26 files contain modals, dialogs, or drawers.

## Modal/Dialog Inventory

- frontend/src/modules/admin/catalog/CategoryManager.jsx
- frontend/src/modules/admin/components/ui/ConfirmDialog.jsx
- frontend/src/modules/admin/components/ui/index.js
- frontend/src/modules/admin/components/ui/Modal.jsx
- frontend/src/modules/admin/pages/operations/Refunds.jsx
- frontend/src/modules/admin/pages/promotions/Coupons.jsx
- frontend/src/modules/admin/pages/promotions/FlashSale.jsx
- frontend/src/modules/admin/pages/system/RoleManagement.jsx
- frontend/src/modules/admin/pages/Users.jsx
- frontend/src/modules/delivery/pages/OrderDetail.jsx
- frontend/src/modules/delivery/pages/PersonalInfo.jsx
- frontend/src/modules/seller/components/common/ConfirmModal.jsx
- frontend/src/modules/seller/components/common/index.js
- frontend/src/modules/seller/components/layout/MobileMenu.jsx
- frontend/src/modules/seller/components/layout/SellerLayout.jsx
- frontend/src/modules/seller/pages/coupons/CouponList.jsx
- frontend/src/modules/seller/pages/products/ProductList.jsx
- frontend/src/modules/seller/pages/returns/ReturnList.jsx
- frontend/src/modules/user/components/common/SearchBar.jsx
- frontend/src/modules/user/layouts/VendorLayout.jsx
- frontend/src/modules/user/pages/Cart.jsx
- frontend/src/modules/user/pages/CategoryProducts.jsx
- frontend/src/modules/user/pages/Checkout.jsx
- frontend/src/modules/user/pages/profile/MyOrders.jsx
- frontend/src/modules/user/pages/profile/SavedAddresses.jsx
- frontend/src/modules/user/pages/profile/SavedCards.jsx

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
