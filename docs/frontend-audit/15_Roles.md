# 15 — Roles

## Platform Roles (Inferred from Frontend)

| Role | Portal | Capabilities Shown in UI |
|------|--------|---------------------------|
| Customer | Marketplace | Browse, cart, checkout, profile, reviews, wallet |
| Guest | Marketplace | Browse (no checkout without auth) |
| Seller/Vendor | /seller | Product, order, inventory, earnings management |
| Super Admin | /admin | Full access (mock role) |
| Catalog Manager | /admin | Products, categories, banners |
| Finance Manager | /admin | Finance, reports, payouts |
| Support Agent | /admin | Tickets, returns, user view |
| Sub-Admin | /admin | Configurable via RoleManagement |
| Delivery Partner | /delivery | Order pickup/delivery, earnings |

## Role Definitions (MOCK_ROLES — admin/constants/dummyData.js)

1. **Super Admin** — permissions: ['all']
2. **Catalog Manager** — products, categories, banners
3. **Finance Manager** — finance, reports
4. **Support Agent** — tickets, returns, users.view

## Role Assignment UI
- admin/pages/system/SubAdmins.jsx — manage admin users
- admin/pages/system/RoleManagement.jsx — CRUD roles with permission matrix

## Backend Role Requirements

```
roles: { id, name, description, permissions[], createdAt }
admin_users: { id, email, roleId, status, lastLogin }
```

Enums: customer, seller, delivery_partner, admin, sub_admin
