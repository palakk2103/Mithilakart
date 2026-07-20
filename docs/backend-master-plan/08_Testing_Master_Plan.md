# 08 — Testing Master Plan

## Testing Pyramid

```
         ┌─────────┐
         │  E2E    │  ~20 flows
         │  Tests  │
        ┌┴─────────┴┐
        │ Integration│  ~150 tests
        │   Tests    │
       ┌┴────────────┴┐
       │  Unit Tests   │  ~400 tests
       │              │
       └──────────────┘
```

**Target Coverage:** 80% line coverage on services and repositories

---

## Unit Testing

| Layer | What to Test | Framework |
|-------|-------------|-----------|
| Services | Business logic, state transitions, calculations | Jest |
| Validators | Schema validation, edge cases | Jest |
| Utilities | Pagination, price formatting, OTP generation | Jest |
| Domain | Order status machine, coupon rules, commission calc | Jest |

### Key Unit Test Suites
- `OrderService.placeOrder` — happy path, out of stock, invalid coupon
- `CouponValidationService.validate` — expiry, usage limit, min order
- `WalletService.debit` — insufficient balance, concurrent debit
- `OtpService.generate` — format, uniqueness
- `CommissionService.calculate` — rule matching, edge cases
- `PricingService.calculate` — tax, delivery, discount stacking
- `PermissionService.hasPermission` — all 38 permissions

---

## Integration Testing

| Area | Tests | Setup |
|------|-------|-------|
| Auth flows | Login, OTP, refresh, logout per portal | Testcontainers (MongoDB + Redis) |
| CRUD operations | Create/read/update/delete per entity | Seeded test database |
| Order flow | Cart → order → payment → status | Mock payment gateway |
| Return/refund | Return → approve → refund → wallet credit | Transaction verification |
| RBAC | Each permission × endpoint matrix | Multiple admin tokens |
| Seller isolation | Cross-seller access attempts | Two seller accounts |
| File upload | Presign → upload → confirm | Mock S3 |

### Integration Test Patterns
```javascript
describe('POST /api/v1/orders', () => {
  beforeEach(async () => { await seedTestData(); });
  
  it('should place order with valid cart and address', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ addressId, paymentMethod: 'cod' });
    expect(res.status).toBe(201);
    expect(res.body.data.orderNumber).toBeDefined();
  });

  it('should reject order with insufficient stock', async () => {
    // ...
    expect(res.status).toBe(409);
  });
});
```

---

## API Testing

| Portal | Test Count (est.) |
|--------|-------------------|
| Customer | 40 |
| Seller | 35 |
| Admin | 50 |
| Delivery | 15 |
| Webhooks | 5 |
| **Total** | **~145** |

- Every endpoint has at least: success case, auth failure (401), validation failure (422)
- Admin endpoints additionally test: permission denied (403)
- Seller endpoints additionally test: cross-seller isolation

---

## Business Flow Testing

End-to-end flow tests covering all 14 audited business flows:

| # | Flow | Steps Tested |
|---|------|-------------|
| 1 | Customer Registration | Send OTP → verify → JWT issued → profile created |
| 2 | Product Browsing | Categories → products → detail → reviews visible |
| 3 | Search & Filter | Search query → filters → paginated results |
| 4 | Cart & Checkout | Add to cart → checkout → place order → payment → confirmation |
| 5 | Wishlist | Add → list → remove |
| 6 | Order Tracking | List orders → detail → timeline events |
| 7 | Returns & Refunds | Initiate return → seller approve → admin refund → wallet credit |
| 8 | Seller Onboarding | Admin approve KYC → seller login → dashboard access |
| 9 | Seller Product Mgmt | Create → submit → admin approve → visible in catalog |
| 10 | Seller Order Fulfillment | Receive order → accept → pack → ship |
| 11 | Delivery Flow | Accept → pickup OTP → delivery OTP → earning credited |
| 12 | Admin CMS | Create banner → visible on home page |
| 13 | Promotions | Create coupon → apply at checkout → discount applied |
| 14 | Multi-Flow Commerce | Mithilak products filtered → checkout with flow tag |

---

## Security Testing

| Test | Method |
|------|--------|
| OWASP Top 10 | Automated scan (OWASP ZAP) |
| JWT tampering | Modified token → 401 |
| Expired token | Old token → 401 |
| RBAC bypass | Missing permission → 403 |
| Seller isolation | Access other seller's data → 403/404 |
| Rate limiting | Exceed limit → 429 |
| SQL/NoSQL injection | Malicious input → sanitized/rejected |
| XSS in reviews | Script tag → stripped |
| File upload bypass | Executable MIME → rejected |
| Payment amount tampering | Modified amount → server recalculates |

---

## Performance Testing

| Scenario | Tool | Target |
|----------|------|--------|
| Product browse load | k6 | 1000 RPS, p95 < 200ms |
| Search load | k6 | 500 RPS, p95 < 200ms |
| Order placement | k6 | 100 RPS, p95 < 2s |
| Concurrent stock deduction | k6 | No overselling |
| Admin report generation | k6 | 50 RPS, p95 < 500ms |

Run before each major release and after infrastructure changes.

---

## Regression Testing

- Full integration test suite runs on every PR (CI)
- E2E flow tests run on staging before production deploy
- Contract tests validate API responses match OpenAPI spec
- Snapshot tests for report output formats

---

## Production Readiness Checklist

### Infrastructure
- [ ] MongoDB replica set (3 nodes) provisioned
- [ ] Redis cluster provisioned
- [ ] S3 bucket + CloudFront CDN configured
- [ ] SSL/TLS certificates installed
- [ ] Environment variables set (no defaults in production)
- [ ] Docker images built and scanned
- [ ] CI/CD pipeline green
- [ ] Health check endpoints responding
- [ ] Monitoring dashboards configured
- [ ] Alerting rules configured
- [ ] Log aggregation configured
- [ ] Backup strategy verified (MongoDB Atlas automated backups)

### Security
- [ ] JWT keys rotated from development keys
- [ ] Rate limiting enabled on all endpoints
- [ ] CORS whitelist configured for production domains
- [ ] Helmet security headers enabled
- [ ] RBAC permissions seeded and verified
- [ ] Default admin password changed
- [ ] Payment webhook secret configured
- [ ] OTP providers configured (SMS + email)
- [ ] File upload MIME validation active
- [ ] Audit logging verified
- [ ] Penetration test completed (no critical findings)

### Data
- [ ] Database indexes created and verified
- [ ] Seed data loaded (roles, permissions, categories, commerce flows)
- [ ] Migration scripts tested on staging
- [ ] Archival jobs scheduled

### Application
- [ ] All 217 API endpoints functional
- [ ] All 14 business flows pass E2E tests
- [ ] All 4 portal auth flows working
- [ ] Payment gateway live (not sandbox)
- [ ] Notification channels configured (push, SMS, email)
- [ ] Search index populated
- [ ] Queue workers running
- [ ] Scheduled jobs running

### Frontend Integration
- [ ] Customer module connected to live APIs (no mock)
- [ ] Seller module connected (all sellerApi.js TODOs resolved)
- [ ] Admin module connected (all api.js endpoints live)
- [ ] Delivery module connected
- [ ] Error handling displays server validation messages
- [ ] Token refresh flow working in all portals
- [ ] Cart syncs server-side
- [ ] Checkout completes with real payment

### Performance
- [ ] Load test passed (targets met)
- [ ] Redis caching verified for hot paths
- [ ] CDN serving product images
- [ ] API p95 latency within targets
- [ ] Database query performance verified (no full collection scans)

### Documentation
- [ ] OpenAPI spec published at `/api/docs`
- [ ] Runbook for common operations
- [ ] Incident response playbook
- [ ] Deployment guide
- [ ] Environment variable documentation

---

## Test Environment Setup

```javascript
// tests/setup.js
const { MongoMemoryServer } = require('mongodb-memory-server');
const Redis = require('ioredis-mock');

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.REDIS_URL = 'redis://localhost:6379';
  // Seed test data
});

afterAll(async () => {
  await mongod.stop();
});
```

---

## Test Data Management

| Fixture | Contents |
|---------|----------|
| `users.fixture.js` | 5 test customers (active, blocked, suspended) |
| `sellers.fixture.js` | 3 sellers (approved, pending, suspended) |
| `products.fixture.js` | 20 products across categories and flows |
| `orders.fixture.js` | Orders in each status |
| `admin.fixture.js` | Super admin + sub-admins with different roles |
| `delivery.fixture.js` | 2 delivery partners (approved, pending) |
