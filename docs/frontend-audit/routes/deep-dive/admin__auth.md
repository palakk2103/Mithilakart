# Route Deep-Dive: `/admin/auth`

**Page:** `admin/pages/Auth.jsx` | **Router:** `AdminRoutes.jsx`

## Purpose
Admin panel login. Sets `isAdminAuthenticated` and redirects to dashboard.

## Business Flow
1. Username/phone + password required.
2. Hardcoded check: `9111966732` / `123456`.
3. Success → `localStorage.isAdminAuthenticated = 'true'` → `/admin/dashboard`.
4. `AdminProtectedRoute` guards all other `/admin/*` routes.

## Expected APIs
`POST /admin/auth/login` — **Not wired**

## Permissions
- Auth page: Public
- Dashboard+: requires `isAdminAuthenticated`

## Errors
Empty fields; invalid credentials — inline banners.
