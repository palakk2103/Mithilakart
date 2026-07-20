# 01 — Project Overview

## Product Name
**Mithilakart** — Multi-vertical e-commerce marketplace platform

## Audit Date
2026-07-20

## Audit Scope
Complete reverse-engineering of `frontend/` directory. This audit treats the frontend as the Product Requirements Document (PRD) for backend implementation.

## Executive Summary

Mithilakart is a **React 19 + Vite 6** single-page application delivering **five distinct product surfaces** from one codebase:

1. **Customer Marketplace** — Mobile-first shopping experience (root `/` and `/vendor/*`)
2. **Seller Portal** — `/seller/*` vendor dashboard for product/order management
3. **Admin Panel** — `/admin/*` platform operations, CMS, finance, reports
4. **Delivery Agent App** — `/delivery/*` last-mile delivery operations
5. **Legacy Vendor Submodule** — Partially integrated admin inventory views

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | React | ^19.2.5 |
| Build | Vite | ^6.0.0 |
| Routing | react-router-dom | ^7.14.2 |
| Global State | Redux Toolkit + Zustand | RTK ^2.11.2, Zustand ^5.0.12 |
| HTTP Client | Axios | ^1.18.1 (seller module only, stubbed) |
| Forms | react-hook-form | ^7.81.0 |
| Styling | Tailwind CSS | ^4.2.4 |
| Animation | framer-motion | ^12.38.0 |
| Charts | recharts | ^3.8.1 |
| i18n | i18next + react-i18next | en, hi, bn, mai |
| Notifications | react-hot-toast | ^2.6.0 |
| PWA | vite-plugin-pwa | ^1.3.0 |
| Icons | lucide-react, react-icons | — |

## User Personas Implemented in Frontend

| Persona | Portal | Auth Mechanism |
|---------|--------|----------------|
| Customer / Shopper | Marketplace | OTP (phone/email) → localStorage |
| Seller / Vendor | /seller | Email/password (mock) → SellerAuthContext |
| Platform Admin | /admin | Email/password (mock) → localStorage flag |
| Delivery Partner | /delivery | Phone OTP (mock) → localStorage flag |
| Sub-Admin | /admin (RBAC UI) | Role-based permissions (mock data) |

## Current Integration Status

| Module | Backend Integration |
|--------|---------------------|
| Customer auth | **Mock** — authApi.js with hardcoded OTP credentials |
| Customer cart/orders | **localStorage** — userCart, useAccountStore |
| Seller module | **Mock** — sellerApi.js returns dummyData.js |
| Admin module | **Mock** — inline MOCK_* constants + dummyData.js |
| Delivery module | **Mock** — MOCK_ORDERS inline |
| Redux slices | **Seed data** — hardcoded initial state |

## File Inventory

| Category | Count |
|----------|-------|
| Total files in frontend/src | 324 |
| Code files analyzed | 224 |
| Per-file audit documents | 224 |
| Route definitions catalogued | 100+ |
| TODO/FIXME in source | 49 |

## Business Domains Covered

- Product catalog & search
- Multi-flow checkout (Mithilak, Quick Shop, Fresh Grocery, You Buy)
- Cart, wishlist, wallet, coupons
- Order lifecycle (place, track, return, refund)
- Seller onboarding & KYC (admin)
- Inventory & stock alerts
- Promotions (coupons, flash sales, featured)
- CMS (banners, category chips, home sections)
- Finance (commission, tax, payouts, delivery charges)
- Support tickets & help center
- Reviews & Q&A moderation
- Delivery partner management
- RBAC & audit logging (admin system)
- Multi-language support (4 locales)

## Related Documents

- [02_Project_Architecture.md](./02_Project_Architecture.md)
- [04_Routes.md](./04_Routes.md)
- [17_Business_Flows.md](./17_Business_Flows.md)
- [19_API_Requirements.md](./19_API_Requirements.md)
- [30_Final_Master_Audit.md](./30_Final_Master_Audit.md)
- [INDEX.md](./INDEX.md) — per-file audits in `files/`
