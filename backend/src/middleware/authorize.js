const { AppError } = require('../utils/AppError');
const { hasAllPermissions, hasAnyPermission } = require('../policies');

function authorize(requiredPermissions = [], options = {}) {
  const { mode = 'all' } = options;

  return (req, res, next) => {
    if (!req.auth || !req.auth.token) {
      return next(AppError.unauthorized('Authentication required'));
    }

    if (!req.user) {
      return next(AppError.unauthorized('User context is not available'));
    }

    const userPermissions = req.user.permissions || [];

    if (requiredPermissions.length === 0) {
      return next();
    }

    const allowed = mode === 'any'
      ? hasAnyPermission(userPermissions, requiredPermissions)
      : hasAllPermissions(userPermissions, requiredPermissions);

    if (!allowed) {
      return next(AppError.forbidden('Insufficient permissions', {
        requiredPermissions: requiredPermissions,
      }));
    }

    return next();
  };
}

function authorizeAny(requiredPermissions = []) {
  return authorize(requiredPermissions, { mode: 'any' });
}

function authorizePolicy(policyFn) {
  return (req, res, next) => {
    if (!req.auth || !req.auth.token) {
      return next(AppError.unauthorized('Authentication required'));
    }

    if (!req.user) {
      return next(AppError.unauthorized('User context is not available'));
    }

    try {
      const allowed = policyFn(req.user, req);

      if (!allowed) {
        return next(AppError.forbidden('Policy check failed'));
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = {
  authorize,
  authorizeAny,
  authorizePolicy,
};
