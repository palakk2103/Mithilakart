const { SUPER_ADMIN_PERMISSION } = require('../constants/permissions');

function hasPermission(userPermissions = [], requiredPermission) {
  if (userPermissions.includes(SUPER_ADMIN_PERMISSION)) {
    return true;
  }

  return userPermissions.includes(requiredPermission);
}

function hasAnyPermission(userPermissions = [], requiredPermissions = []) {
  if (userPermissions.includes(SUPER_ADMIN_PERMISSION)) {
    return true;
  }

  return requiredPermissions.some((permission) => userPermissions.includes(permission));
}

function hasAllPermissions(userPermissions = [], requiredPermissions = []) {
  if (userPermissions.includes(SUPER_ADMIN_PERMISSION)) {
    return true;
  }

  return requiredPermissions.every((permission) => userPermissions.includes(permission));
}

function evaluatePolicy(user = null, policyFn) {
  if (typeof policyFn !== 'function') {
    return false;
  }

  return policyFn(user);
}

module.exports = {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  evaluatePolicy,
};
