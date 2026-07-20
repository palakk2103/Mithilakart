const PERMISSION_GROUPS = [
  {
    group: 'Dashboard',
    items: ['dashboard.view', 'dashboard.analytics'],
  },
  {
    group: 'Users',
    items: ['users.view', 'users.edit', 'users.block', 'users.delete'],
  },
  {
    group: 'Products',
    items: ['products.view', 'products.edit', 'products.approve', 'products.delete'],
  },
  {
    group: 'Orders',
    items: ['orders.view', 'orders.edit', 'orders.cancel'],
  },
  {
    group: 'Finance',
    items: ['finance.view', 'finance.edit', 'finance.payout'],
  },
  {
    group: 'Sellers',
    items: ['sellers.view', 'sellers.edit', 'sellers.approve', 'sellers.suspend'],
  },
  {
    group: 'Categories',
    items: ['categories.view', 'categories.edit', 'categories.delete'],
  },
  {
    group: 'Banners',
    items: ['banners.view', 'banners.edit', 'banners.delete'],
  },
  {
    group: 'Reports',
    items: ['reports.view', 'reports.export'],
  },
  {
    group: 'Settings',
    items: ['settings.view', 'settings.edit'],
  },
  {
    group: 'Tickets',
    items: ['tickets.view', 'tickets.edit', 'tickets.close'],
  },
  {
    group: 'Returns',
    items: ['returns.view', 'returns.edit', 'returns.approve'],
  },
  {
    group: 'Coupons',
    items: ['coupons.view', 'coupons.edit', 'coupons.delete'],
  },
  {
    group: 'Notifications',
    items: ['notifications.view', 'notifications.send'],
  },
  {
    group: 'System',
    items: ['system.admins', 'system.roles', 'system.audit', 'system.settings'],
  },
];

const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((entry) => entry.items);

const SUPER_ADMIN_PERMISSION = 'all';

module.exports = {
  PERMISSION_GROUPS,
  ALL_PERMISSIONS,
  SUPER_ADMIN_PERMISSION,
};
