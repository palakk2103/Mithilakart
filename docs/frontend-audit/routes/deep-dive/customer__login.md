# Route Deep-Dive: `/login` · `/vendor/login`

**Page:** `Login.jsx` | **Layout:** None

## Purpose
Customer OTP authentication (phone or email). Redirects to prior page after success.

## Components
Phone/email toggle, country code select, OTP input, 60s resend timer, `authApi` service, framer-motion.

## Business Flow
1. Send OTP → validate → `sendPhoneOtp` / `sendEmailOtp`.
2. Verify OTP → `verifyPhoneOtp` / `verifyEmailOtp`.
3. Success → `localStorage.isAuthenticated = 'true'` → redirect `location.state.from` (default `/home`).

## Expected APIs
| Endpoint | Mock Credentials |
|----------|------------------|
| Phone verify | `9111966732` + OTP `123456` |
| Email verify | `mithilakart@gmail.com` + OTP `123456` |

## Permissions
- **Public**; post-login redirect unrestricted

## Errors
| Scenario | Message |
|----------|---------|
| Invalid email/phone/OTP | Inline validation messages |
| API failure | err.message or generic OTP error |

**Security note:** Mock OTP credentials must be removed before production.
