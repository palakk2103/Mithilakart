# 06 — Performance Master Plan

## Performance Targets

| Metric | Target |
|--------|--------|
| API p95 latency (read) | < 300ms |
| API p95 latency (write) | < 500ms |
| Search p95 | < 200ms |
| Order placement E2E | < 2s |
| Uptime | 99.9% |
| Concurrent users | 10,000+ |

---

## Redis Caching Strategy

| Data | Key Pattern | TTL | Invalidation |
|------|-------------|-----|--------------|
| Categories tree | `cache:categories:tree` | 1 hour | On category CRUD |
| Home sections | `cache:home:sections` | 15 min | On section update |
| Product detail | `cache:product:{id}` | 5 min | On product update |
| Product list (category) | `cache:products:cat:{catId}:p:{page}` | 5 min | On product CRUD in category |
| Search results | `cache:search:{hash}` | 2 min | TTL expiry |
| Seller dashboard stats | `cache:seller:{id}:stats` | 5 min | On order/inventory change |
| Admin dashboard stats | `cache:admin:dashboard` | 5 min | On significant events |
| User cart | `cart:{userId\|sessionId}` | Session | On cart mutation |
| OTP sessions | `otp:{phone\|email}` | 5 min | TTL expiry |
| Rate limits | `rl:{ip\|userId}:{endpoint}` | Window-based | TTL expiry |
| JWT blacklist | `bl:{jti}` | Token remaining exp | TTL expiry |
| Flash sale prices | `cache:flashsale:active` | 1 min | On flash sale change |

### Cache-Aside Pattern
1. Check Redis → hit: return
2. Miss → query MongoDB → store in Redis → return
3. On write → invalidate related keys

---

## Queue System (BullMQ)

| Queue | Purpose | Concurrency | Retry |
|-------|---------|-------------|-------|
| `otp-send` | SMS/email OTP delivery | 10 | 3x exponential |
| `notification-send` | Push/SMS/email notifications | 20 | 3x |
| `notification-broadcast` | Admin mass notifications | 5 | 2x |
| `order-process` | Post-order side effects | 10 | 3x |
| `payment-reconcile` | Failed webhook retry | 5 | 5x |
| `search-index` | Product search reindex | 5 | 3x |
| `image-process` | Thumbnail/resize | 3 | 2x |
| `report-generate` | Report snapshot generation | 2 | 2x |
| `email-send` | Transactional emails | 10 | 3x |
| `inventory-alert` | Low stock notifications | 5 | 2x |
| `payout-process` | Seller payout execution | 2 | 3x |
| `archival` | Data archival to S3 | 1 | 2x |
| `analytics-aggregate` | Nightly stats computation | 1 | 2x |

---

## Background Jobs (Scheduled)

| Job | Schedule | Purpose |
|-----|----------|---------|
| Auto-cancel unpaid orders | Every 5 min | Cancel orders pending > 30 min |
| Flash sale activation | Every 1 min | Activate/deactivate flash sales |
| Low stock check | Every 15 min | Generate stock alerts |
| Report snapshots | Daily 2 AM | Pre-aggregate report data |
| Seller stats aggregation | Daily 3 AM | Compute seller analytics |
| Search index sync | Every 10 min | Catch missed index updates |
| Orphan file cleanup | Daily 4 AM | Remove unreferenced uploads |
| Soft delete purge | Weekly | Hard delete records > 90 days |
| Audit log archival | Daily 5 AM | Archive logs > 90 days to S3 |
| Token cleanup | Daily | Remove expired refresh tokens |
| Delivery location purge | Daily | Remove GPS data > 7 days |
| Wallet reconciliation | Daily 6 AM | Verify wallet balance integrity |
| Coupon expiry | Hourly | Deactivate expired coupons |

**Total scheduled jobs: 13**

---

## MongoDB Optimization

| Strategy | Application |
|----------|-------------|
| Indexes | See Database Master Plan (30+ indexes) |
| Projection | List APIs return only needed fields |
| Aggregation pipelines | Dashboard stats, reports, analytics |
| Read replicas | Route read-heavy queries to secondary |
| Connection pooling | Max 100 connections per instance |
| Write concern | `w: majority` for financial operations |
| Read preference | `primaryPreferred` for reads, `secondaryPreferred` for reports |
| Bucket pattern | Order tracking events grouped |
| Document size limit | Monitor; split if approaching 16MB |

---

## Aggregation Strategy

| Use Case | Pipeline |
|----------|----------|
| Seller dashboard | `$match(sellerId)` → `$group` by status → `$count` |
| Admin revenue chart | `$match(dateRange)` → `$group` by day → `$sum(total)` |
| Product rating | `$match(productId)` → `$group` → `$avg(rating)` |
| Report snapshots | Pre-computed daily; live only for dashboard |
| Seller analytics | `$match` → `$group` by category/date → `$sort` |

---

## Pagination Strategy

| Context | Method |
|---------|--------|
| Admin lists (orders, users) | Offset: `page` + `limit` |
| Product grids (customer) | Cursor-based for infinite scroll |
| Search results | Cursor-based with relevance score |
| Wallet transactions | Offset with date filter |
| Audit logs | Cursor-based (timestamp cursor) |

---

## Search Strategy

| Phase | Implementation |
|-------|----------------|
| Phase 1 (MVP) | MongoDB text index on products |
| Phase 2 (Scale) | MongoDB Atlas Search or Elasticsearch |
| Index fields | title (weight 10), tags (5), brand (3), description (1) |
| Filters | category, price range, rating, commerceFlow, sellerId |
| Autocomplete | Prefix match on title (Atlas Search autocomplete) |
| Sync | Event-driven reindex on product CRUD via BullMQ |

---

## Image Optimization

| Stage | Action |
|-------|--------|
| Upload | Accept original; queue processing |
| Processing | Generate thumbnails: 150px, 400px, 800px (WebP) |
| Storage | S3 with lifecycle policy |
| Delivery | CloudFront CDN with cache headers (1 year) |
| Lazy loading | Frontend responsibility; backend provides srcset URLs |

---

## CDN Strategy

| Asset Type | CDN | Cache TTL |
|------------|-----|-----------|
| Product images | CloudFront | 1 year |
| Banner images | CloudFront | 1 hour |
| Category images | CloudFront | 1 day |
| User avatars | CloudFront | 1 day |
| API responses | No CDN (Redis cache instead) |

---

## API Response Optimization

| Technique | Application |
|-----------|-------------|
| Field selection | `?fields=title,price,images` |
| Compression | gzip/brotli on responses > 1KB |
| ETag | Cacheable GET endpoints |
| Conditional requests | If-None-Match support for catalog |
| Batch endpoints | Admin bulk operations |
| Connection keep-alive | HTTP/2 enabled |

---

## Monitoring & Alerting

| Metric | Alert Threshold |
|--------|----------------|
| API p95 latency | > 500ms for 5 min |
| Error rate | > 1% for 5 min |
| Queue depth | > 1000 jobs |
| Redis memory | > 80% |
| MongoDB connections | > 80% pool |
| Disk usage | > 85% |
| Payment webhook failures | > 3 in 10 min |

Tools: Prometheus + Grafana, Sentry for errors, BullMQ dashboard

---

## Load Testing Plan

| Scenario | Target |
|----------|--------|
| Product browse | 1000 RPS, p95 < 200ms |
| Search | 500 RPS, p95 < 200ms |
| Cart operations | 200 RPS, p95 < 300ms |
| Order placement | 100 RPS, p95 < 2s |
| Admin dashboard | 50 RPS, p95 < 500ms |

Tool: k6 or Artillery; run before each major release
