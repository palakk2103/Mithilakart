# Production Runbook

Operational guide for Mithilakart backend (Phase 10).

## Health checks

| Endpoint | Purpose | Expected |
|----------|---------|----------|
| `GET /health` | Liveness | `200`, `data.status: ok` |
| `GET /ready` | Readiness (MongoDB, Redis, queues) | `200`, `data.isReady: true` |
| `GET /metrics` | Prometheus scrape target | `200`, Prometheus text format |

## Required environment (production)

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
CORS_ORIGIN=https://mithilakart.com,https://seller.mithilakart.com,https://admin.mithilakart.com
RATE_LIMIT_ENABLED=true
METRICS_ENABLED=true
CDN_BASE_URL=https://cdn.mithilakart.com
LOG_LEVEL=info
LOG_PRETTY=false
```

Generate JWT keys: `node scripts/generate-jwt-keys.js`

## Deployment steps

1. Run `npm ci && npm test && npm run lint`
2. Build and deploy Docker image (see `backend/docker/`)
3. Run database seeds if fresh environment: `npm run seed:auth`, `npm run seed:catalog`
4. Smoke test:
   - `curl -f $BASE_URL/health`
   - `curl -f $BASE_URL/ready`
   - `curl -f $BASE_URL/api/v1` (expect `phase: 10`)
5. Configure Prometheus to scrape `/metrics`
6. Set uptime monitor on `/health`

## Rate limiting

Redis-backed sliding window per IP or authenticated user. Limits:

| Category | Limit | Window |
|----------|-------|--------|
| Public catalog | 100 | 1 min |
| Authenticated | 200 | 1 min |
| Admin | 300 | 1 min |
| Auth login | 10 | 15 min |
| Uploads | 20 | 1 hour |
| Report export | 5 | 1 hour |

429 responses include `Retry-After` and `X-RateLimit-*` headers.

## Caching

Hot paths cached in Redis:

- Category tree (1h)
- Home sections (15m)
- Product detail (5m)
- Search results (2m)

Invalidate on write via `CacheService.del` / `delByPattern('cache:search:*')`.

## Load testing

Requires [k6](https://k6.io/) installed:

```bash
cd backend
k6 run load-tests/catalog-search.k6.js
# against staging:
BASE_URL=https://staging-api.mithilakart.com k6 run load-tests/catalog-search.k6.js
```

Targets (from Performance Master Plan):

- Product browse: p95 < 200ms at 1000 RPS (scale test)
- Search: p95 < 200ms at 500 RPS

## Incident response

### API 5xx spike

1. Check `/ready` — identify failing dependency (database, redis, queues)
2. Inspect logs by `requestId` from client error responses
3. Check Prometheus: `mithilakart_http_request_duration_seconds`, error rate by route
4. Roll back deployment if regression confirmed

### Redis down

- Readiness fails → load balancer should stop routing traffic
- OTP/auth blacklist degraded — restore Redis urgently

### MongoDB slow queries

1. Check Atlas metrics / slow query log
2. Verify indexes per Database Master Plan
3. Increase cache TTL temporarily for catalog reads

## Security

- Helmet enabled with CSP/HSTS in production
- CORS whitelist enforced (no `*` in production)
- No stack traces in 500 responses
- Run `npm audit` in CI before release

## Production readiness checklist

- [ ] All health/metrics endpoints green
- [ ] CORS origins set to production domains
- [ ] Redis and MongoDB on managed clusters
- [ ] JWT keys rotated and stored securely
- [ ] Rate limiting enabled
- [ ] Load test baseline recorded
- [ ] Frontend portals connected (see FRONTEND_INTEGRATION.md)
- [ ] Monitoring alerts configured (latency, error rate, Redis memory)
