# Mithilakart Backend

## Phase 2 — Catalog & CMS

Public catalog browsing, admin category/product moderation, storefront CMS, and upload infrastructure.

### Public APIs

| Method | Endpoint |
|--------|----------|
| GET | `/api/v1/categories` |
| GET | `/api/v1/categories/:id/products` |
| GET | `/api/v1/products` |
| GET | `/api/v1/products/:id` |
| GET | `/api/v1/products/search` |
| GET | `/api/v1/storefront/home` |
| GET | `/api/v1/storefront/banners` |
| GET | `/api/v1/storefront/:flow/home` |
| GET | `/api/v1/cms/:slug` |
| GET | `/api/v1/cms/legal/:type` |
| POST | `/api/v1/uploads/presign` |
| POST | `/api/v1/uploads/confirm` |

### Admin APIs (RBAC protected)

| Method | Endpoint |
|--------|----------|
| CRUD | `/api/v1/admin/categories` |
| GET/PATCH/DELETE | `/api/v1/admin/products` (+ approve/reject/bulk) |
| CRUD | `/api/v1/admin/banners`, `/api/v1/admin/chips` |
| GET/PUT | `/api/v1/admin/sections/:sectionKey` |
| PUT | `/api/v1/admin/cms/:slug`, `/api/v1/admin/cms/legal/:type` |

### Seed catalog data

```bash
npm run seed:catalog
```

---

## Phase 1 — Identity & Auth

Implemented JWT authentication for all four portals:

| Portal | Auth method | Base routes |
|--------|-------------|-------------|
| Customer | Phone/email OTP | `/api/v1/auth/*` |
| Seller | Email/password | `/api/v1/seller/auth/*` |
| Admin | Email/password + permissions | `/api/v1/admin/auth/*` |
| Delivery | Phone OTP + signup | `/api/v1/delivery/auth/*` |

## Setup

```bash
cd backend
cp .env.example .env
npm install
npm run generate:jwt-keys
docker compose -f docker/docker-compose.yml up -d
npm run seed:auth
npm run dev
```

## Auth endpoints

**Customer**
- `POST /api/v1/auth/send-phone-otp`
- `POST /api/v1/auth/verify-phone-otp`
- `POST /api/v1/auth/send-email-otp`
- `POST /api/v1/auth/verify-email-otp`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

**Seller**
- `POST /api/v1/seller/auth/login`
- `POST /api/v1/seller/auth/refresh`
- `POST /api/v1/seller/auth/logout`

**Admin**
- `POST /api/v1/admin/auth/login`
- `POST /api/v1/admin/auth/refresh`
- `POST /api/v1/admin/auth/logout`
- `GET /api/v1/admin/auth/profile`
- `PUT /api/v1/admin/auth/password`

**Delivery**
- `POST /api/v1/delivery/auth/send-otp`
- `POST /api/v1/delivery/auth/verify-otp`
- `POST /api/v1/delivery/auth/signup`
- `POST /api/v1/delivery/auth/refresh`
- `POST /api/v1/delivery/auth/logout`

## Seed credentials

After `npm run seed:auth`:

- Admin: `admin@mithilakart.com` / `Admin@12345`
- Seller: `seller@mithilakart.com` / `Seller@12345`
- Delivery OTP phone: `+91 9123456789`

In development, OTP values are logged when `EXPOSE_OTP_IN_DEV=true`.

## Architecture notes

- JWT RS256 per portal (15m access / 7d refresh)
- Refresh token rotation with reuse detection
- OTP stored hashed in Redis with rate limits
- Access token blacklist in Redis on logout
- Session/device tracking with max 5 active sessions
- No SMS/email providers connected — OTP exposed in dev logs only

---

# Phase 0 — Platform Foundation

Enterprise backend foundation for Mithilakart. This phase provides shared infrastructure only — no business modules.

## Stack

- Node.js 18+
- Express.js
- MongoDB + Mongoose
- JavaScript (no TypeScript)

## Architecture

Clean Architecture with:

- Repository, Service, and Controller base classes
- Middleware, validation, policies, and provider abstractions
- Centralized config, logging, errors, and API responses

## Quick Start

```bash
cd backend
cp .env.example .env
npm install
npm run validate:env
npm run dev
```

Health checks:

- `GET /health` — liveness
- `GET /ready` — readiness (MongoDB)
- `GET /api/docs` — OpenAPI stub

## Folder Structure

```
src/
├── config/          # Environment and infrastructure config
├── database/        # Transaction helpers
├── core/            # Base classes and provider interfaces
├── middleware/      # Express middleware layer
├── repositories/    # Data access (Phase 1+)
├── services/        # Application services
├── controllers/     # HTTP controllers
├── routes/          # Route definitions and API versioning
├── validators/      # Joi validation schemas
├── policies/        # Authorization policy helpers
├── events/          # Domain event bus
├── queues/          # Queue abstraction (no broker connected)
├── jobs/            # Background job base classes
├── utils/           # Shared utilities
├── constants/       # Application constants
└── helpers/         # Pure helper functions
```

## Phase 0 Scope

Implemented:

- Application bootstrap and graceful shutdown
- MongoDB connection with readiness checks
- Standard API response envelope
- Global exception handling
- Auth/RBAC middleware framework (no auth logic)
- File upload infrastructure (local disk)
- Provider interfaces for future integrations

Not implemented (later phases):

- Authentication, catalog, commerce, seller, delivery, admin modules
- Redis, Razorpay, Shiprocket, Cloudinary, SMS, email, Firebase, S3

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon |
| `npm start` | Start production server |
| `npm test` | Run test suite |
| `npm run lint` | Run ESLint |
| `npm run validate:env` | Validate required env vars |

## Testing

```bash
npm test
```

Integration tests require MongoDB. Set `MONGODB_URI` in `.env` or use a local instance.
