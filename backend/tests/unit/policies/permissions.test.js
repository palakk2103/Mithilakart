const {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
} = require('../../../src/policies');

describe('permission policies', () => {
  it('grants super admin all permissions', () => {
    expect(hasPermission(['all'], 'users.delete')).toBe(true);
    expect(hasAllPermissions(['all'], ['users.delete', 'orders.view'])).toBe(true);
  });

  it('checks individual permissions', () => {
    const permissions = ['users.view', 'orders.view'];

    expect(hasPermission(permissions, 'users.view')).toBe(true);
    expect(hasPermission(permissions, 'users.delete')).toBe(false);
    expect(hasAnyPermission(permissions, ['users.delete', 'orders.view'])).toBe(true);
    expect(hasAllPermissions(permissions, ['users.view', 'orders.view'])).toBe(true);
  });
});
