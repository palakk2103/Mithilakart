# 00 — Executive Summary

## Mission

Build a production-grade backend for **Mithilakart** — a Marketplace + E-Commerce + Quick Commerce platform — that supports 100% of the audited frontend across four panels: Customer, Seller, Admin, and Delivery Partner.

This document set is the **definitive implementation blueprint**. No architectural redesign should be required after following this plan.

## Scope Boundaries

| In Scope | Out of Scope |
|----------|--------------|
| Backend architecture, modules, APIs (planned) | Backend code implementation |
| Database schema design | Frontend changes |
| Security, performance, infra strategy | Re-auditing frontend |
| Phase ordering and dependencies | Writing actual controllers/routes |

## Platform Surfaces (from Frontend Audit)

| Panel | Routes | Pages | Auth Model |
|-------|--------|-------|------------|
| Customer Marketplace | 37 | 38 | OTP (phone/email) → JWT |
| Seller Portal | 16 | 15 | Email/password → JWT |
| Admin Panel | 45+ | 40+ | Email/password → JWT + RBAC |
| Delivery App | 11 | 11 | Phone OTP → JWT |

## Commerce Flows (Multi-Brand UX)

> **⚠️ CR-001 Amendment:** The model below is superseded by the **Master Product + Marketplace Listing** architecture. See [`docs/change-requests/CR-001/`](../../change-requests/CR-001/README.md). During migration, `commerceFlows[]` remains as legacy; target state uses `marketplace_listings` per tab.

| Flow | Entry Route | Backend Flag (Legacy) | CR-001 Tab Key |
|------|-------------|----------------------|----------------|
| Mithilakart (General) | `/home` | `commerceFlow: standard` | `mithilakart` |
| Mithilak (Exclusive) | `/mithilak` | `commerceFlow: mithilak` | `mithilak` |
| Quick Shop | `/quick-shop` | `commerceFlow: quick_shop` | `quick_shop` |
| Groceries & Fresh | `/fresh-grocery` | `commerceFlow: fresh_grocery` | `groceries_fresh` |

Legacy: backend tagged products, categories, banners with `commerceFlows[]`.  
**CR-001 target:** Delivery promise and per-tab pricing live on `marketplace_listings`; categories use `visibleTabs[]`.

## Architectural Principles

1. **Clean Architecture** — Domain → Application → Infrastructure → Presentation layers
2. **Single Source of Truth** — MongoDB for transactional data; Redis for cache/sessions; S3 for files
3. **Portal Isolation** — Separate route namespaces: `/api/v1`, `/api/v1/seller`, `/api/v1/admin`, `/api/v1/delivery`
4. **Seller Data Isolation** — Every seller query scoped by `sellerId` from JWT
5. **RBAC on Admin** — Permission middleware on every admin endpoint (38 permissions, 15 groups)
6. **Event-Driven Side Effects** — Orders, payments, notifications via BullMQ queues
7. **Idempotent Payments** — Webhook handlers with idempotency keys
8. **Audit Everything Sensitive** — Admin actions, payouts, refunds, KYC approvals

## Recommended Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20 LTS |
| Framework | Express.js or Fastify |
| Database | MongoDB 7.x (replica set) |
| Cache/Session | Redis 7.x |
| Queue | BullMQ |
| Search | MongoDB Atlas Search or Elasticsearch |
| File Storage | AWS S3 + CloudFront CDN |
| Payment | Razorpay (UPI, Card, Wallet) |
| OTP/SMS | MSG91 or Twilio |
| Email | SendGrid or AWS SES |
| Push | Firebase Cloud Messaging |
| Monitoring | Prometheus + Grafana, Sentry |

## Team Ownership Matrix

| Domain | Primary Architect |
|--------|-------------------|
| Auth & Identity | Principal Security Architect |
| Catalog & Search | Principal API Architect |
| Orders & Payments | Principal Backend Architect |
| Seller & Finance | Principal Solution Architect |
| Admin & RBAC | Principal Software Architect |
| Delivery & Logistics | Principal Cloud Architect |
| Database | Principal Database Architect |
| Performance | Principal Performance Engineer |
| DevOps & CI/CD | Principal DevOps Architect |
| QA Strategy | Principal QA Architect |

## Success Criteria

Backend is production-ready when:

1. All 109+ frontend routes have working API backing
2. All 14 business flows execute end-to-end
3. All 38 admin permissions enforced server-side
4. All 49 seller API stubs replaced with live endpoints
5. Payment gateway live with webhook verification
6. Zero mock data dependencies in frontend integration phase
