# 21 — Security Requirements

## Current Security Posture: **DEVELOPMENT ONLY**

### Authentication Gaps
- Customer auth: hardcoded OTP credentials in authApi.js
- Admin auth: any credentials set isAdminAuthenticated=true (Auth.jsx mock login)
- Delivery auth: localStorage flag only
- Seller auth: dummy token in SellerAuthContext
- No JWT validation, no token expiry, no refresh flow

### Authorization Gaps
- No RBAC enforcement on admin routes or API calls
- No seller-scoped data isolation
- Customer profile pages accessible without auth guard
- Checkout auth bypassable by setting localStorage

### Required Security Implementation

| Area | Requirement |
|------|-------------|
| Auth | JWT access + refresh tokens, HttpOnly cookies or secure storage |
| OTP | Rate limiting (5/min), 6-digit crypto-random, 5-min expiry |
| Password | bcrypt hashing for seller/admin, strength requirements |
| RBAC | Permission middleware on every admin endpoint |
| Seller isolation | sellerId scoped queries on all seller APIs |
| Input validation | Server-side validation mirroring frontend rules |
| File upload | MIME check, size limit, virus scan, S3 pre-signed URLs |
| Payment | PCI-DSS via payment gateway tokenization |
| CORS | Whitelist frontend domains |
| Rate limiting | API gateway rate limits per IP/user |
| Audit | Log all admin actions (audit_logs table) |
| CSRF | Token for cookie-based auth |
| XSS | Sanitize user-generated content (reviews, Q&A) |
| Delivery OTP | Server-generated, single-use, time-limited |

### Sensitive Operations Requiring Extra Auth
- Admin payout processing
- Refund approval
- User account deletion
- Seller KYC approval
- Role/permission changes
- Sub-admin creation
