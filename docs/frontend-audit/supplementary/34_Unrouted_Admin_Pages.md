# 34 — Unrouted Admin Pages (Orphan Components)

These admin page components exist in the codebase but are **not registered** in `AdminRoutes.jsx` and are therefore unreachable via navigation or direct URL.

| File | Likely Purpose | Recommendation |
|------|----------------|----------------|
| `admin/pages/Products.jsx` | Legacy product list | Remove or wire to `/admin/products` |
| `admin/pages/Permissions.jsx` | Permission management UI | Merge into `system/RoleManagement.jsx` or add route |
| `admin/pages/SubAdmins.jsx` | Duplicate sub-admin page | Superseded by `pages/system/SubAdmins.jsx` (routed) |
| `admin/pages/vendors/AddVendor.jsx` | Add vendor form | Add route `/admin/vendors/add` |
| `admin/pages/vendors/AllVendors.jsx` | Vendor list duplicate | Superseded by `vendors/VendorList.jsx` (routed) |
| `admin/pages/delivery/AddDelivery.jsx` | Add delivery partner | Add route `/admin/delivery/add` |
| `admin/dashboard/Dashboard.jsx` | Legacy dashboard | Superseded by `pages/Dashboard.jsx` (routed) |

## Impact

- Dead code increases maintenance burden
- Backend team may discover UI requirements only by grepping source
- Navigation in AdminLayout does not link to these pages

## Routed Alternatives (Use These)

| Orphan | Active Replacement | Route |
|--------|-------------------|-------|
| `pages/SubAdmins.jsx` | `pages/system/SubAdmins.jsx` | `/admin/system/sub-admins` |
| `pages/vendors/AllVendors.jsx` | `vendors/VendorList.jsx` | `/admin/vendors/all` |
| `dashboard/Dashboard.jsx` | `pages/Dashboard.jsx` | `/admin/dashboard` |
