# 14 — Validation

## Customer Auth Validation (Login.jsx)

| Field | Rules |
|-------|-------|
| countryCode | Required; regex /^\+?\d{1,4}$/ |
| phoneNumber | Required; 8-11 digits |
| email | Required (email mode); standard email regex |
| otp | Required for verify; 6 digits expected |

## Seller Validation (seller/utils/validators.js)

| Function | Rules |
|----------|-------|
| validateEmail | Standard email format |
| validatePhone | 10-digit Indian mobile |
| validatePrice | Positive number |
| validateStock | Non-negative integer |
| validateRequired | Non-empty string |
| validateGST | GSTIN format |
| validatePAN | PAN format |
| validateIFSC | IFSC code format |
| validatePincode | 6-digit pincode |

## Form Validation Libraries

| Module | Library | Usage |
|--------|---------|-------|
| Customer Login/Signup | Manual state validation | Inline regex checks |
| Seller AddProduct | react-hook-form | register() with rules |
| Seller Settings | react-hook-form | Profile/bank/password forms |
| Seller Coupons | react-hook-form | Coupon creation modal |
| Delivery Signup | Manual | Basic required field checks |
| Admin forms | Mostly manual | Inline validation on submit |

## Missing Validation (Gaps)

- No server-side validation feedback handling
- No zod/yup schema definitions
- Card number validation is UI-only (SavedCards)
- Address pincode not validated against postal API
- File upload size/type not enforced (ImageUploader)
- OTP rate limiting not implemented client-side beyond 60s timer
