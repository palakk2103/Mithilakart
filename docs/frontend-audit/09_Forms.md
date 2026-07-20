# 09 — Forms

## Summary
44 files contain forms or form fields.

## Files With Forms

- **frontend/src/modules/admin/catalog/BannerManager.jsx** — 6 fields
- **frontend/src/modules/admin/catalog/CategoryChipsManager.jsx** — 4 fields
- **frontend/src/modules/admin/catalog/HomeSectionsManager.jsx** — 7 fields
- **frontend/src/modules/admin/components/ui/Pagination.jsx** — 1 fields
- **frontend/src/modules/admin/dashboard/Dashboard.jsx** — 1 fields
- **frontend/src/modules/admin/pages/AddProduct.jsx** — 26 fields
- **frontend/src/modules/admin/pages/Auth.jsx** — 2 fields
- **frontend/src/modules/admin/pages/comms/Notifications.jsx** — 2 fields
- **frontend/src/modules/admin/pages/content/LegalPolicies.jsx** — 1 fields
- **frontend/src/modules/admin/pages/content/QnAModeration.jsx** — 1 fields
- **frontend/src/modules/admin/pages/finance/DeliveryCharges.jsx** — 2 fields
- **frontend/src/modules/admin/pages/finance/TaxConfig.jsx** — 1 fields
- **frontend/src/modules/admin/pages/promotions/Coupons.jsx** — 6 fields
- **frontend/src/modules/admin/pages/promotions/FlashSale.jsx** — 4 fields
- **frontend/src/modules/admin/pages/reports/SalesReport.jsx** — 1 fields
- **frontend/src/modules/admin/pages/Settings.jsx** — 12 fields
- **frontend/src/modules/admin/pages/support/Tickets.jsx** — 1 fields
- **frontend/src/modules/admin/pages/system/RoleManagement.jsx** — 3 fields
- **frontend/src/modules/admin/pages/system/SubAdmins.jsx** — 3 fields
- **frontend/src/modules/admin/pages/Users.jsx** — 4 fields
- **frontend/src/modules/delivery/pages/Auth.jsx** — 2 fields
- **frontend/src/modules/delivery/pages/OrderDetail.jsx** — 1 fields
- **frontend/src/modules/delivery/pages/PersonalInfo.jsx** — 4 fields
- **frontend/src/modules/delivery/pages/Signup.jsx** — 30 fields
- **frontend/src/modules/seller/components/common/DataTable.jsx** — 1 fields
- **frontend/src/modules/seller/components/common/ImageUploader.jsx** — 1 fields
- **frontend/src/modules/seller/components/common/SearchFilter.jsx** — 1 fields
- **frontend/src/modules/seller/components/layout/Topbar.jsx** — 1 fields
- **frontend/src/modules/seller/pages/auth/SellerLogin.jsx** — 2 fields
- **frontend/src/modules/seller/pages/coupons/CouponList.jsx** — 7 fields
- **frontend/src/modules/seller/pages/products/AddProduct.jsx** — 22 fields
- **frontend/src/modules/seller/pages/reviews/ReviewList.jsx** — 1 fields
- **frontend/src/modules/seller/pages/settings/Settings.jsx** — 12 fields
- **frontend/src/modules/user/components/common/SearchBar.jsx** — 1 fields
- **frontend/src/modules/user/pages/Cart.jsx** — 3 fields
- **frontend/src/modules/user/pages/ForgotPassword.jsx** — 1 fields
- **frontend/src/modules/user/pages/Login.jsx** — 4 fields
- **frontend/src/modules/user/pages/Products.jsx** — 7 fields
- **frontend/src/modules/user/pages/profile/EditProfile.jsx** — 6 fields
- **frontend/src/modules/user/pages/profile/MyOrders.jsx** — 1 fields
- **frontend/src/modules/user/pages/profile/SavedAddresses.jsx** — 3 fields
- **frontend/src/modules/user/pages/profile/SavedCards.jsx** — 4 fields
- **frontend/src/modules/user/pages/Signup.jsx** — 5 fields
- **frontend/src/shared/components/SearchInput.jsx** — 1 fields

## Detailed Form Audits

### Customer Login (Login.jsx)

| Field | Type | Validation | Required | API |
|-------|------|------------|----------|-----|
| countryCode | select/text | /^\+?\d{1,4}$/ | Yes (phone mode) | sendPhoneOtp |
| phoneNumber | tel | 8-11 digits | Yes (phone mode) | sendPhoneOtp, verifyPhoneOtp |
| email | email | email regex | Yes (email mode) | sendEmailOtp, verifyEmailOtp |
| otp | text | 6 digits | Yes | verifyPhoneOtp / verifyEmailOtp |

**Business Rules:**
- Toggle between phone and email OTP
- 60-second resend timer
- Mock credentials: phone 9111966732 + OTP 123456; email mithilakart@gmail.com + OTP 123456
- On success: sets localStorage isAuthenticated, navigates to prior page or /home

### Customer Signup (Signup.jsx)
Similar OTP flow to Login with name field addition.

### Forgot Password (ForgotPassword.jsx)
Email/phone recovery flow (UI only, mock).

### Checkout (Checkout.jsx)
Multi-step wizard (Address → Summary → Payment). No react-hook-form.
- Payment methods: UPI (Paytm, PhonePe, GPay), Card, COD, Wallet
- Address read from localStorage cartAddress
- Order placed client-side with random OD id

### Seller Add Product (AddProduct.jsx)
react-hook-form with fields: title, description, price, mrp, stock, category, sku, images, status.

### Seller Settings (Settings.jsx)
Profile, bank, password, notification preference forms.

### Seller Coupon Create (CouponList.jsx)
Modal form: code, discount type, value, min order, expiry, usage limit.

### Delivery Signup (Signup.jsx)
Partner registration: name, phone, vehicle type, documents upload UI.

See per-file audits in [files/](./files/) for complete field extraction.
