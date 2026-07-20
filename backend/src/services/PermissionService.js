const { SUPER_ADMIN_PERMISSION, ALL_PERMISSIONS } = require('../constants/permissions');

class PermissionService {
  resolvePermissions(adminUser, role) {
    if (adminUser.isSuperAdmin) {
      return [SUPER_ADMIN_PERMISSION];
    }

    if (!role) {
      return [];
    }

    return role.permissions.filter((permission) => ALL_PERMISSIONS.includes(permission));
  }

  hasPermission(userPermissions = [], requiredPermission) {
    if (userPermissions.includes(SUPER_ADMIN_PERMISSION)) {
      return true;
    }

    return userPermissions.includes(requiredPermission);
  }

  hasAllPermissions(userPermissions = [], requiredPermissions = []) {
    if (userPermissions.includes(SUPER_ADMIN_PERMISSION)) {
      return true;
    }

    return requiredPermissions.every((permission) => userPermissions.includes(permission));
  }
}

module.exports = {
  PermissionService,
};
