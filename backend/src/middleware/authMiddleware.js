const { PORTALS } = require('../constants/portals');
const { SELLER_STATUS, KYC_STATUS, DELIVERY_STATUS } = require('../constants/auth');
const { AppError } = require('../utils/AppError');
const { extractBearerToken } = require('./authenticate');

let sellerRepositoryRef = null;
let deliveryPartnerRepositoryRef = null;

function createAuthMiddleware({ tokenService, sellerRepository, deliveryPartnerRepository }) {
  sellerRepositoryRef = sellerRepository || sellerRepositoryRef;
  deliveryPartnerRepositoryRef = deliveryPartnerRepository || deliveryPartnerRepositoryRef;

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
          sellerId: decoded.sellerId || decoded.sub,
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
  return async (req, res, next) => {
    if (!req.user || req.user.portal !== PORTALS.SELLER || !req.user.sellerId) {
      return next(AppError.forbidden('Seller context required'));
    }

    if (!sellerRepositoryRef) {
      return next();
    }

    try {
      const seller = await sellerRepositoryRef.findById(req.user.sellerId);
      if (!seller || seller.deletedAt) {
        return next(AppError.forbidden('Seller account not found'));
      }
      if (seller.status !== SELLER_STATUS.ACTIVE) {
        return next(AppError.forbidden('Seller account is not active'));
      }
      if (seller.kycStatus !== KYC_STATUS.APPROVED) {
        return next(AppError.forbidden('Seller KYC is not approved'));
      }
      req.seller = seller;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

function requireApprovedPartner() {
  return async (req, res, next) => {
    if (!req.user || req.user.portal !== PORTALS.DELIVERY) {
      return next(AppError.forbidden('Delivery partner context required'));
    }

    if (!deliveryPartnerRepositoryRef) {
      return next();
    }

    try {
      const partner = await deliveryPartnerRepositoryRef.findById(req.user.id);
      if (!partner || partner.deletedAt) {
        return next(AppError.forbidden('Delivery partner not found'));
      }
      if (partner.status === DELIVERY_STATUS.REJECTED) {
        return next(AppError.forbidden('Delivery partner application was rejected'));
      }
      if (partner.status === DELIVERY_STATUS.SUSPENDED) {
        return next(AppError.forbidden('Delivery partner account is suspended'));
      }
      if (partner.status !== DELIVERY_STATUS.APPROVED) {
        return next(AppError.forbidden('Delivery partner account is pending approval'));
      }
      req.partner = partner;
      return next();
    } catch (error) {
      return next(error);
    }
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
