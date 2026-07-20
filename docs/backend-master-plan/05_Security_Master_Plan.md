# 05 — Security Master Plan

## Security Architecture Overview

Defense in depth across 5 layers: Network → Gateway → Application → Data → Audit

---

## Authentication

### JWT Strategy
| Token | Algorithm | Lifetime | Storage |
|-------|-----------|----------|---------|
| Access Token | RS256 (asymmetric) | 15 minutes | Memory (frontend) |
| Refresh Token | RS256 | 7 days | HttpOnly cookie or secure storage |
| OTP Session | — | 5 minutes | Redis only |

- Separate signing keys per portal (customer, seller, admin, delivery)
- JWT claims: `{ sub, role, portal, sellerId?, permissions?, iat, exp, jti }`
- Token blacklist in Redis on logout/revoke (key: `bl:<jti>`, TTL = remaining exp)

### Refresh Token Rotation
- Each refresh issues new access + refresh pair
- Old refresh token invalidated immediately (rotation)
- Detect refresh token reuse → revoke all sessions for user (token family invalidation)

### OTP Security
| Rule | Implementation |
|------|----------------|
| Generation | crypto.randomInt(100000, 999999) |
| Storage | Redis hash: `{ otp, attempts, createdAt }` |
| Expiry | 5 minutes TTL |
| Rate limit | 5 sends per phone/email per hour |
| Verify attempts | Max 3 attempts, then invalidate |
| Delivery | SMS via MSG91; email via SendGrid |

### Password Policy (Seller/Admin)
- Minimum 8 characters
- At least 1 uppercase, 1 lowercase, 1 digit, 1 special character
- bcrypt hash, cost factor 12
- Account lockout: 5 failed attempts → 15-minute lock
- Password history: prevent reuse of last 5 passwords

---

## Authorization (RBAC)

### Permission Matrix (38 permissions, 15 groups)

Every admin endpoint maps to required permission(s):

| Endpoint Pattern | Required Permission |
|-----------------|---------------------|
| GET /admin/dashboard/* | dashboard.view |
| GET /admin/analytics/* | dashboard.analytics |
| GET /admin/users | users.view |
| PUT /admin/users/:id | users.edit |
| PATCH /admin/users/:id/block | users.block |
| DELETE /admin/users/:id | users.delete |
| GET /admin/products | products.view |
| PATCH /admin/products/:id/approve | products.approve |
| GET /admin/orders | orders.view |
| PATCH /admin/orders/:id/status | orders.edit |
| GET /admin/finance/* | finance.view |
| POST /admin/payouts/:id/process | finance.payout |
| GET /admin/sellers | sellers.view |
| PATCH /admin/sellers/:id/approve | sellers.approve |
| GET /admin/reports/* | reports.view |
| GET /admin/reports/*/export | reports.export |
| GET/PUT /admin/settings | settings.view / settings.edit |
| GET /admin/support/tickets | tickets.view |
| GET /admin/returns | returns.view |
| PATCH /admin/returns/:id/approve | returns.approve |
| CRUD /admin/coupons | coupons.view / coupons.edit |
| POST /admin/notifications/send | notifications.send |
| CRUD /admin/roles | system.roles |
| CRUD /admin/sub-admins | system.admins |
| GET /admin/audit/logs | system.audit |

### Seller Data Isolation
- Middleware extracts `sellerId` from JWT
- Repository layer enforces `{ sellerId }` filter on ALL queries
- Integration tests verify cross-seller access returns 403/404

### Customer Resource Ownership
- Middleware verifies `req.user.id === resource.userId`
- Admin override with appropriate permission

---

## Session & Device Management

| Feature | Implementation |
|---------|----------------|
| Device tracking | `user_devices` collection with deviceId, platform, lastActive |
| Concurrent sessions | Max 5 active sessions per user; oldest evicted |
| Force logout | Admin can revoke all sessions for a user |
| Session list | User can view/revoke own sessions (future) |

---

## Rate Limiting

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| OTP send | 5 | 1 hour |
| OTP verify | 10 | 15 min |
| Auth login | 10 | 15 min |
| Public catalog | 100 | 1 min |
| Authenticated API | 200 | 1 min |
| Admin API | 300 | 1 min |
| File upload | 20 | 1 hour |
| Report export | 5 | 1 hour |

Implementation: Redis sliding window (`rate-limit-flexible` library)

---

## Input Validation

- Joi/Zod schemas at controller layer mirroring frontend validation (audit doc 14)
- Sanitize HTML in user-generated content (reviews, Q&A, ticket messages) via DOMPurify
- ObjectId validation on all `:id` params
- File upload: whitelist MIME types, max size enforcement
- SQL/NoSQL injection prevention: parameterized queries via Mongoose

---

## Encryption & Hashing

| Data | Method |
|------|--------|
| Passwords | bcrypt (cost 12) |
| JWT signing | RS256 (RSA key pair) |
| Payment tokens | Gateway-managed (never stored raw) |
| PII at rest | MongoDB encryption at rest (Atlas) |
| Data in transit | TLS 1.3 everywhere |
| OTP | Hashed in Redis (not stored plaintext) |
| Bank account numbers | AES-256-GCM encrypted field |

---

## Audit Logging

| Event | Logged Fields |
|-------|---------------|
| Admin login/logout | adminId, IP, userAgent, success/failure |
| Admin CRUD actions | adminId, action, targetType, targetId, before/after, IP |
| Payout processing | adminId, payoutId, amount, IP |
| Refund approval | adminId, refundId, amount, method |
| KYC approval | adminId, sellerId, decision |
| Role/permission changes | adminId, roleId, changes |
| User block/suspend | adminId, userId, reason |

- Immutable `audit_logs` collection
- 90-day online retention; archive to S3 (7-year retention for financial)

---

## Sensitive Operation Protection

Operations requiring re-authentication or dual approval:

| Operation | Protection |
|-----------|------------|
| Admin payout > ₹50,000 | Dual admin approval |
| Refund > ₹10,000 | Senior admin permission |
| User account deletion | Confirmation + audit |
| Seller KYC approval | `sellers.approve` + audit |
| Role/permission changes | `system.roles` + audit |
| Sub-admin creation | `system.admins` + audit |
| Platform settings change | `settings.edit` + audit |

---

## API Security

| Control | Implementation |
|---------|----------------|
| CORS | Whitelist: frontend domains only |
| Helmet | Security headers (CSP, X-Frame-Options, etc.) |
| CSRF | Token for cookie-based auth flows |
| Request size | Max 1MB JSON body; 10MB multipart |
| API keys | Internal service-to-service only (webhook verification) |
| Error responses | No stack traces in production; generic 500 message |

---

## Upload Security

| Check | Rule |
|-------|------|
| MIME validation | Whitelist: image/jpeg, image/png, image/webp, application/pdf |
| Size limit | Images: 5MB; Documents: 10MB |
| Filename | Sanitize; UUID-based storage keys |
| Storage | S3 with private ACL; CDN serves via signed URLs |
| Virus scan | Optional ClamAV integration on upload confirm |
| Image processing | Strip EXIF metadata; resize via Lambda/queue |

---

## Payment Security

- PCI-DSS compliance via Razorpay (no card data touches our servers)
- Webhook signature verification (HMAC-SHA256)
- Idempotency keys on payment initiation
- Payment amount verification server-side (never trust client amount)

---

## Delivery OTP Security

- Server-generated 4-digit crypto-random OTP
- Single-use (invalidated after verification)
- 10-minute expiry
- Max 3 verification attempts
- Separate OTP for pickup and delivery stages

---

## Security Testing Requirements

- OWASP Top 10 scan per release
- Penetration test before production launch
- Dependency vulnerability scan (npm audit) in CI
- RBAC matrix integration tests (every permission × endpoint)
- Seller isolation tests
- Rate limit verification tests
