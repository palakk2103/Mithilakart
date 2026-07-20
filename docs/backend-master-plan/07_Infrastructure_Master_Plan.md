# 07 — Infrastructure Master Plan

## Clean Architecture Layers

```
┌─────────────────────────────────────────────────┐
│              Presentation Layer                  │
│  Routes → Controllers → Middleware → Validators  │
├─────────────────────────────────────────────────┤
│              Application Layer                   │
│  Services → DTOs → Use Cases → Event Handlers   │
├─────────────────────────────────────────────────┤
│                Domain Layer                      │
│  Entities → Value Objects → Domain Events        │
│  Repository Interfaces → Domain Services         │
├─────────────────────────────────────────────────┤
│             Infrastructure Layer                 │
│  Repository Implementations → Database Models    │
│  External Services → Queue Workers → Cache       │
│  File Storage → Email/SMS/Push Providers         │
└─────────────────────────────────────────────────┘
```

**Dependency Rule:** Dependencies point inward. Domain layer has zero external dependencies.

---

## Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── index.js              # Config loader with env validation
│   │   ├── database.js           # MongoDB connection
│   │   ├── redis.js              # Redis connection
│   │   ├── aws.js                # S3/CloudFront config
│   │   └── swagger.js            # OpenAPI spec
│   │
│   ├── shared/
│   │   ├── utils/
│   │   │   ├── ApiResponse.js    # Standard response wrapper
│   │   │   ├── AppError.js       # Custom error class
│   │   │   ├── asyncHandler.js   # Async route wrapper
│   │   │   ├── pagination.js     # Pagination helpers
│   │   │   └── logger.js         # Winston/Pino logger
│   │   ├── middleware/
│   │   │   ├── authenticate.js   # JWT verification (multi-portal)
│   │   │   ├── authorize.js      # RBAC permission check
│   │   │   ├── validate.js       # Joi/Zod schema validation
│   │   │   ├── rateLimiter.js    # Redis rate limiting
│   │   │   ├── requestId.js      # Correlation ID
│   │   │   ├── errorHandler.js   # Global error handler
│   │   │   ├── sellerScope.js    # Seller data isolation
│   │   │   └── uploadGuard.js    # File upload validation
│   │   ├── constants/
│   │   │   ├── permissions.js    # 38 permission constants
│   │   │   ├── orderStatus.js    # Order state machine
│   │   │   └── errorCodes.js     # Error code enum
│   │   └── events/
│   │       ├── EventEmitter.js   # Domain event bus
│   │       └── eventTypes.js     # Event type constants
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── customer/
│   │   │   │   ├── auth.controller.js
│   │   │   │   ├── auth.service.js
│   │   │   │   ├── auth.routes.js
│   │   │   │   ├── auth.validator.js
│   │   │   │   └── auth.repository.js
│   │   │   ├── seller/
│   │   │   ├── admin/
│   │   │   └── delivery/
│   │   │
│   │   ├── catalog/
│   │   │   ├── category/
│   │   │   ├── product/
│   │   │   └── search/
│   │   │
│   │   ├── commerce/
│   │   │   ├── cart/
│   │   │   ├── order/
│   │   │   ├── payment/
│   │   │   └── pricing/
│   │   │
│   │   ├── user/
│   │   │   ├── profile/
│   │   │   ├── address/
│   │   │   ├── wallet/
│   │   │   ├── wishlist/
│   │   │   └── payment-method/
│   │   │
│   │   ├── seller/
│   │   │   ├── dashboard/
│   │   │   ├── product/
│   │   │   ├── order/
│   │   │   ├── inventory/
│   │   │   ├── return/
│   │   │   ├── customer/
│   │   │   ├── coupon/
│   │   │   ├── analytics/
│   │   │   ├── earnings/
│   │   │   └── settings/
│   │   │
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   ├── user/
│   │   │   ├── vendor/
│   │   │   ├── order/
│   │   │   ├── finance/
│   │   │   ├── report/
│   │   │   ├── cms/
│   │   │   ├── promotion/
│   │   │   ├── rbac/
│   │   │   ├── audit/
│   │   │   ├── support/
│   │   │   └── settings/
│   │   │
│   │   ├── delivery/
│   │   │   ├── auth/
│   │   │   ├── order/
│   │   │   ├── assignment/
│   │   │   └── earnings/
│   │   │
│   │   ├── engagement/
│   │   │   ├── review/
│   │   │   ├── qna/
│   │   │   └── coupon/
│   │   │
│   │   ├── cms/
│   │   │   ├── banner/
│   │   │   ├── chip/
│   │   │   ├── home-section/
│   │   │   └── legal/
│   │   │
│   │   ├── notification/
│   │   │   ├── notification.service.js
│   │   │   ├── template.service.js
│   │   │   └── channels/ (push, sms, email)
│   │   │
│   │   ├── upload/
│   │   │   ├── upload.controller.js
│   │   │   ├── upload.service.js
│   │   │   └── image-processor.js
│   │   │
│   │   └── returns/
│   │       ├── return/
│   │       └── refund/
│   │
│   ├── models/                   # Mongoose schemas
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   └── ... (62 model files)
│   │
│   ├── jobs/                     # BullMQ workers & schedulers
│   │   ├── workers/
│   │   │   ├── otpWorker.js
│   │   │   ├── notificationWorker.js
│   │   │   ├── orderWorker.js
│   │   │   ├── searchIndexWorker.js
│   │   │   ├── imageWorker.js
│   │   │   ├── reportWorker.js
│   │   │   └── payoutWorker.js
│   │   └── schedulers/
│   │       ├── orderAutoCancel.js
│   │       ├── flashSaleToggle.js
│   │       ├── stockAlert.js
│   │       ├── reportSnapshot.js
│   │       └── archival.js
│   │
│   ├── routes/
│   │   ├── index.js              # Route aggregator
│   │   ├── v1/
│   │   │   ├── customer.routes.js
│   │   │   ├── seller.routes.js
│   │   │   ├── admin.routes.js
│   │   │   ├── delivery.routes.js
│   │   │   └── webhook.routes.js
│   │   └── health.routes.js
│   │
│   ├── app.js                    # Express app setup
│   └── server.js                 # Entry point
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
│
├── migrations/
│   ├── 001_initial_schema.js
│   ├── 002_seed_roles.js
│   └── 003_seed_categories.js
│
├── seeds/
│   ├── roles.seed.js
│   ├── admin.seed.js
│   └── categories.seed.js
│
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── docker-compose.prod.yml
│
├── .env.example
├── .eslintrc.js
├── jest.config.js
├── package.json
└── README.md
```

---

## Repository Pattern

```javascript
// Interface (domain layer)
class ProductRepository {
  async findById(id) {}
  async findByCategory(categoryId, filters, pagination) {}
  async create(data) {}
  async update(id, data) {}
  async softDelete(id) {}
}

// Implementation (infrastructure layer)
class MongoProductRepository extends ProductRepository {
  constructor(ProductModel) { this.model = ProductModel; }
  async findByCategory(categoryId, filters, pagination) {
    return this.model.find({ categoryId, deletedAt: null, ...filters })
      .skip(pagination.skip).limit(pagination.limit);
  }
}
```

---

## Service Pattern

```javascript
class OrderService {
  constructor(orderRepo, cartService, paymentService, inventoryService, eventBus) {
    this.orderRepo = orderRepo;
    this.cartService = cartService;
    // ...
  }

  async placeOrder(userId, orderData) {
    // 1. Validate cart
    // 2. Check inventory
    // 3. Calculate pricing
    // 4. Begin transaction
    // 5. Create order + deduct stock
    // 6. Initiate payment
    // 7. Commit transaction
    // 8. Emit order.placed event
    // 9. Clear cart
  }
}
```

---

## Dependency Injection Strategy

- Manual DI via factory functions (no heavy DI framework)
- Each module exports a `createXxxModule(deps)` factory
- App bootstrap wires dependencies in `app.js`:

```javascript
const productRepo = new MongoProductRepository(ProductModel);
const productService = new ProductService(productRepo, cacheService, eventBus);
const productController = new ProductController(productService);
```

- Enables easy mocking in tests

---

## Config Management

```javascript
// config/index.js — validated on boot
module.exports = {
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10) || 3000,
  mongodb: { uri: required('MONGODB_URI') },
  redis: { url: required('REDIS_URL') },
  jwt: {
    customer: { privateKey, publicKey, accessExpiry: '15m', refreshExpiry: '7d' },
    seller: { ... },
    admin: { ... },
    delivery: { ... },
  },
  aws: { region, bucket, cloudfrontDomain },
  razorpay: { keyId, keySecret, webhookSecret },
  sms: { provider, apiKey },
  email: { provider, apiKey, fromAddress },
  fcm: { projectId, credentials },
};
```

- `.env.example` with all required variables documented
- Fail fast on missing required config

---

## Environment Management

| Environment | Purpose | Database | External Services |
|-------------|---------|----------|-------------------|
| development | Local dev | Docker MongoDB | Mock/stub providers |
| staging | Integration testing | Atlas staging cluster | Sandbox payment/SMS |
| production | Live | Atlas production (3-node) | Live providers |

---

## Logging

| Level | Usage |
|-------|-------|
| error | Unhandled exceptions, payment failures |
| warn | Rate limit hits, retry attempts |
| info | Request/response (method, path, status, duration) |
| debug | Query details, cache hits/misses |

- Structured JSON logging (Pino)
- Request correlation ID in every log entry
- Sensitive data redaction (passwords, tokens, card numbers)

---

## Monitoring

| Tool | Purpose |
|------|---------|
| Prometheus | Metrics collection (request count, latency, error rate) |
| Grafana | Dashboards |
| Sentry | Error tracking and alerting |
| BullMQ Board | Queue monitoring |
| MongoDB Atlas | Database monitoring |
| Uptime monitor | Health check polling |

---

## Health Checks

| Endpoint | Checks |
|----------|--------|
| `GET /health` | Server alive (200) |
| `GET /ready` | MongoDB connected, Redis connected, queues healthy |

---

## Exception Handling

```javascript
// Global error handler middleware
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return ApiResponse.error(res, err.statusCode, err.code, err.message, err.details);
  }
  logger.error({ err, requestId: req.id });
  return ApiResponse.error(res, 500, 'INTERNAL_ERROR', 'Something went wrong');
}
```

---

## Standard Response Utility

```javascript
class ApiResponse {
  static success(res, data, meta, statusCode = 200) {
    return res.status(statusCode).json({ success: true, data, meta, requestId: res.locals.requestId });
  }
  static error(res, statusCode, code, message, details) {
    return res.status(statusCode).json({ success: false, error: { code, message, details }, requestId: res.locals.requestId });
  }
  static paginated(res, data, { page, limit, total }) {
    return this.success(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
  }
}
```

---

## Validation Layer

- Joi schemas co-located with each module: `{module}.validator.js`
- Middleware: `validate(schema, source='body')` 
- Returns 422 with field-level errors matching API error structure

---

## Transaction Layer

```javascript
// shared/utils/transaction.js
async function withTransaction(callback) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

Used for: order placement, refunds, wallet operations, payouts

---

## WebSocket Gateway (Phase 9)

```
backend/src/
  gateway/
    socketServer.js       # Socket.io or ws setup
    orderTracking.js      # Room: order:{orderId}
    deliveryTracking.js   # Room: delivery:{partnerId}
```

Events: `order:statusUpdated`, `delivery:locationUpdated`

---

## CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
steps:
  - lint (ESLint)
  - unit tests (Jest)
  - integration tests (Jest + testcontainers)
  - build Docker image
  - push to ECR (staging/production)
  - deploy to ECS/EKS
  - smoke test health endpoints
```

---

## Deployment Architecture

```
                    ┌──────────────┐
                    │  CloudFront  │
                    │    (CDN)     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │     ALB      │
                    │ (Load Bal.)  │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌───▼─────┐ ┌───▼─────┐
        │  API Pod  │ │ API Pod │ │ API Pod │
        │  (Node)   │ │  (Node) │ │  (Node) │
        └─────┬─────┘ └────┬────┘ └────┬────┘
              │            │            │
        ┌─────▼────────────▼────────────▼─────┐
        │  MongoDB Atlas  │  Redis  │  S3     │
        │  (Replica Set)  │ Cluster │ Bucket  │
        └───────────────────────────────────┘
              │
        ┌─────▼─────┐
        │  BullMQ   │
        │  Workers  │
        └───────────┘
```
