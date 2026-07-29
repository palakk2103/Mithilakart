# Mithilakart — Backend Execution Master Plan

**Version:** 1.1 (CR-001 amendment pending)  
**Date:** 2026-07-20  
**Source of Truth:** `docs/frontend-audit/` (691+ audit files)  
**Status:** Implementation in progress — **CR-001 architecture review required before catalog/commerce changes**

## Change Requests

| ID | Title | Status | Documents |
|----|-------|--------|-----------|
| **CR-001** | Multi-Marketplace Listing Model (Master Product + Marketplace Listings) | Approved — Architecture Integration | [`docs/change-requests/CR-001/`](../../change-requests/CR-001/README.md) |

> **CR-001 supersedes** the commerce flow tagging model (`commerceFlows[]` on Product) documented in Phases 2–10. Existing implementation is preserved via migration. **Do not modify catalog/commerce code until CR-001 docs are approved.**

## Document Index

| # | Document | Contents |
|---|----------|----------|
| 00 | [Executive Summary](./00_Executive_Summary.md) | Mission, scope, principles, team ownership |
| 01 | [Implementation Phases](./01_Implementation_Phases.md) | 10 phases with goals, deliverables, risks, testing |
| 02 | [Module Definitions](./02_Module_Definitions.md) | All 32 backend modules — full specification |
| 03 | [Database Master Plan](./03_Database_Master_Plan.md) | 42 collections, ER, indexes, transactions |
| 04 | [API Master Plan](./04_API_Master_Plan.md) | Versioning, standards, endpoint catalog (~210 APIs) |
| 05 | [Security Master Plan](./05_Security_Master_Plan.md) | JWT, RBAC, encryption, audit, upload security |
| 06 | [Performance Master Plan](./06_Performance_Master_Plan.md) | Redis, queues, caching, search, CDN |
| 07 | [Infrastructure Master Plan](./07_Infrastructure_Master_Plan.md) | Clean architecture, folder structure, DI |
| 08 | [Testing Master Plan](./08_Testing_Master_Plan.md) | Unit, integration, E2E, production checklist |
| 09 | [Frontend Coverage Matrix](./09_Frontend_Coverage_Matrix.md) | Every route → backend module mapping |
| 10 | [Summary Metrics](./10_Summary_Metrics.md) | Roadmap, dependency graph, readiness score |

## Quick Reference

- **Panels:** Customer (37 routes), Seller (16 routes), Admin (45+ routes), Delivery (11 routes)
- **Build order:** Phase 0 → Phase 10 (18–22 weeks estimated)
- **Tech stack (recommended):** Node.js + Express/Fastify, MongoDB, Redis, BullMQ, S3, Razorpay

## Critical Rule

Every audited frontend feature has a corresponding backend implementation strategy in this plan. Cross-reference [09_Frontend_Coverage_Matrix.md](./09_Frontend_Coverage_Matrix.md) for 100% route coverage.
