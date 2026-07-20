const { AppError } = require('../utils/AppError');
const { PORTAL_VALUES } = require('../constants/portals');

function extractBearerToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  return token || null;
}

function authenticate(options = {}) {
  const { optional = false, portal = null } = options;

  return (req, res, next) => {
    const token = extractBearerToken(req);

    if (!token) {
      if (optional) {
        req.auth = { verified: false, token: null, portal: portal || null };
        req.user = null;
        return next();
      }

      return next(AppError.unauthorized('Missing or invalid authorization token'));
    }

    req.auth = {
      token,
      verified: false,
      portal: portal || null,
    };

    req.user = null;

    return next();
  };
}

function requirePortal(portal) {
  if (!PORTAL_VALUES.includes(portal)) {
    throw new Error(`Invalid portal: ${portal}`);
  }

  return (req, res, next) => {
    if (!req.auth || !req.auth.token) {
      return next(AppError.unauthorized('Authentication required'));
    }

    if (req.auth.portal && req.auth.portal !== portal) {
      return next(AppError.forbidden('Invalid portal context'));
    }

    req.auth.portal = portal;
    return next();
  };
}

function requireAuthenticatedUser() {
  return (req, res, next) => {
    if (!req.auth || !req.auth.token) {
      return next(AppError.unauthorized('Authentication required'));
    }

    if (!req.user) {
      return next(AppError.unauthorized('User context is not available'));
    }

    return next();
  };
}

module.exports = {
  authenticate,
  requirePortal,
  requireAuthenticatedUser,
  extractBearerToken,
};
