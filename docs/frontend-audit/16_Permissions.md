# 16 — Permissions

## ALL_PERMISSIONS (admin/constants/dummyData.js)

export const ALL_PERMISSIONS = [
  { group: 'Dashboard', items: ['dashboard.view', 'dashboard.analytics'] },
  { group: 'Users', items: ['users.view', 'users.edit', 'users.block', 'users.delete'] },
  { group: 'Products', items: ['products.view', 'products.edit', 'products.approve', 'products.delete'] },
  { group: 'Orders', items: ['orders.view', 'orders.edit', 'orders.cancel'] },
  { group: 'Finance', items: ['finance.view', 'finance.edit', 'finance.payout'] },
  { group: 'Sellers', items: ['sellers.view', 'sellers.edit', 'sellers.approve', 'sellers.suspend'] },
  { group: 'Categories', items: ['categories.view', 'categories.edit', 'categories.delete'] },
  { group: 'Banners', items: ['banners.view', 'banners.edit', 'banners.delete'] },
  { group: 'Reports', items: ['reports.view', 'reports.export'] },
  { group: 'Settings', items: ['settings.view', 'settings.edit'] },
  { group: 'Tickets', items: ['tickets.view', 'tickets.edit', 'tickets.close'] },
  { group: 'Returns', items: ['returns.view', 'returns.edit', 'returns.approve'] },
  { group: 'Coupons', items: ['coupons.view', 'coupons.edit', 'coupons.delete'] },
  { group: 'Notifications', items: ['notifications.view', 'notifications.send'] },
  { group: 'System', items: ['system.admins', 'system.roles', 'system.audit', 'system.settings'] },
];

## Permission Groups

| Group | Permissions |
|-------|-------------|
| Dashboard | dashboard.view, dashboard.analytics |
| Users | users.view, users.edit, users.block, users.delete |
| Products | products.view, products.edit, products.approve, products.delete |
| Orders | orders.view, orders.edit, orders.cancel |
| Finance | finance.view, finance.edit, finance.payout |
| Sellers | sellers.view, sellers.edit, sellers.approve, sellers.suspend |
| Categories | categories.view, categories.edit, categories.delete |
| Banners | banners.view, banners.edit, banners.delete |
| Reports | reports.view, reports.export |
| Settings | settings.view, settings.edit |
| Tickets | tickets.view, tickets.edit, tickets.close |
| Returns | returns.view, returns.edit, returns.approve |
| Coupons | coupons.view, coupons.edit, coupons.delete |
| Notifications | notifications.view, notifications.send |
| System | system.admins, system.roles, system.audit, system.settings |

## Frontend Enforcement Status

**NONE** — Permissions are displayed in RoleManagement UI only. No route-level or component-level permission checks exist. AdminProtectedRoute only checks isAdminAuthenticated boolean.

## Required Backend Enforcement

Every admin API endpoint must validate JWT + permission scope. Frontend should receive permission array on login and conditionally render menu items.
