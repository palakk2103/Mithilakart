const { AppError } = require('../utils/AppError');

function requireDeliveryContext() {
  return (req, res, next) => {
    if (!req.user?.id) {
      return next(AppError.forbidden('Delivery partner context required'));
    }

    req.partnerId = req.user.id;
    return next();
  };
}

module.exports = {
  requireDeliveryContext,
};
