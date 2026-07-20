const { AppError } = require('../utils/AppError');

function requireSellerContext() {
  return (req, res, next) => {
    if (!req.user?.sellerId) {
      return next(AppError.forbidden('Seller context required'));
    }

    req.sellerId = req.user.sellerId;
    return next();
  };
}

function assertSellerResource(resourceSellerId, requestSellerId) {
  if (String(resourceSellerId) !== String(requestSellerId)) {
    throw AppError.forbidden('Access denied to seller resource');
  }
}

module.exports = {
  requireSellerContext,
  assertSellerResource,
};
