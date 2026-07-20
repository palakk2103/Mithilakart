const { PORTALS } = require('../constants/portals');
const { AppError } = require('../utils/AppError');
const { extractBearerToken } = require('./authenticate');

function createAuthMiddleware({ tokenService }) {
  function authenticatePortal(portal, options = {}) {
    const { optional = false } = options;

    return async (req, res, next) => {
      const token = extractBearerToken(req);

      if (!token) {
        if (optional) {
          req.auth = { verified: false, token: null, portal };
          req.user = null;
          return next();
        }

        return next(AppError.unauthorized('Missing or invalid authorization token'));
      }

      try {
        const decoded = await tokenService.verifyAccessToken(token, portal);

        req.auth = {
          token,
          verified: true,
          portal,
          jti: decoded.jti,
        };

        req.user = {
          id: decoded.sub,
          role: decoded.role,
          portal,
          sellerId: decoded.sellerId || null,
          permissions: decoded.permissions || [],
        };

        return next();
      } catch (error) {
        if (optional) {
          req.auth = { verified: false, token, portal };
          req.user = null;
          return next();
        }

        return next(error);
      }
    };
  }

  return {
    authenticateCustomer: (options) => authenticatePortal(PORTALS.CUSTOMER, options),
    authenticateSeller: (options) => authenticatePortal(PORTALS.SELLER, options),
    authenticateAdmin: (options) => authenticatePortal(PORTALS.ADMIN, options),
    authenticateDelivery: (options) => authenticatePortal(PORTALS.DELIVERY, options),
    optionalAuth: () => authenticatePortal(PORTALS.CUSTOMER, { optional: true }),
  };
}

function requireActiveSeller() {
  return (req, res, next) => {
    if (!req.user || req.user.portal !== PORTALS.SELLER || !req.user.sellerId) {
      return next(AppError.forbidden('Seller context required'));
    }

    return next();
  };
}

function requireApprovedPartner() {
  return (req, res, next) => {
    if (!req.user || req.user.portal !== PORTALS.DELIVERY) {
      return next(AppError.forbidden('Delivery partner context required'));
    }

    return next();
  };
}

function requirePermission(...permissions) {
  const { authorize } = require('./authorize');
  return authorize(permissions);
}

module.exports = {
  createAuthMiddleware,
  requireActiveSeller,
  requireApprovedPartner,
  requirePermission,
};
