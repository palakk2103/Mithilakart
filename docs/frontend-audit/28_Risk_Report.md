# 28 — Risk Report

## Critical Risks (P0)

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| 1 | No real authentication | Account takeover, data breach | Implement JWT auth before production |
| 2 | Payment simulation | Revenue loss, fraud | Integrate payment gateway with webhooks |
| 3 | Client-only cart/orders | Data loss, inconsistency | Server-side cart and order management |
| 4 | No input sanitization backend | XSS, injection | Server validation + sanitization |
| 5 | Hardcoded OTP credentials | Security vulnerability | Remove before any deployment |

## High Risks (P1)

| # | Risk | Impact |
|---|------|--------|
| 6 | No RBAC enforcement | Unauthorized admin actions |
| 7 | Split state management | Data sync bugs across devices |
| 8 | No API error handling | Poor UX, silent failures |
| 9 | Mock inventory | Overselling products |
| 10 | No file upload backend | Broken product images |

## Medium Risks (P2)

| # | Risk | Impact |
|---|------|--------|
| 11 | Duplicate route files | Developer confusion |
| 12 | Legacy vendor module | Maintenance burden |
| 13 | No tests | Regression risk |
| 14 | Large static assets in bundle | Performance |
| 15 | No monitoring/logging | Incident response delay |

## Compliance Risks
- GST/tax config UI without tax calculation engine
- Legal policy pages static, not CMS-driven
- KYC document storage not implemented
- PCI compliance for card storage not addressed
