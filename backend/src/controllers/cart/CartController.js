const { BaseController } = require('../../core/BaseController');
const { ApiResponse } = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');
const { CART } = require('../../constants/commerce');
const { randomUuid } = require('../../utils/cryptoHelper');
const { AppError } = require('../../utils/AppError');

class CartController extends BaseController {
  constructor(cartService) {
    super(cartService);
    this.bindMethods(['getCart', 'addItem', 'updateItem', 'removeItem', 'clearCart']);
  }

  _resolveCartContext(req, res) {
    const userId = req.user?.id || null;

    let sessionId = req.cookies?.[CART.SESSION_COOKIE_NAME] || null;
    if (!userId && !sessionId) {
      sessionId = randomUuid();
      res.cookie(CART.SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: CART.SESSION_COOKIE_MAX_AGE_MS,
      });
    }

    if (!userId && !sessionId) {
      throw AppError.unauthorized('Cart session required');
    }

    return {
      userId,
      sessionId,
    };
  }

  getCart = asyncHandler(async (req, res) => {
    const { userId, sessionId } = this._resolveCartContext(req, res);
    const data = await this.service.getCart({
      userId,
      sessionId,
      commerceFlow: req.query.commerceFlow || 'standard',
      marketplaceTab: req.query.marketplaceTab || null,
    });

    return ApiResponse.success(res, data);
  });

  addItem = asyncHandler(async (req, res) => {
    const { userId, sessionId } = this._resolveCartContext(req, res);
    const data = await this.service.addItem({
      userId,
      sessionId,
      commerceFlow: req.body.commerceFlow || 'standard',
      marketplaceTab: req.body.marketplaceTab || null,
      productId: req.body.productId,
      listingId: req.body.listingId || null,
      variantId: req.body.variantId || null,
      quantity: req.body.quantity,
    });

    return ApiResponse.success(res, data);
  });

  updateItem = asyncHandler(async (req, res) => {
    const { userId, sessionId } = this._resolveCartContext(req, res);
    const data = await this.service.updateItemQuantity({
      userId,
      sessionId,
      commerceFlow: req.body.commerceFlow || 'standard',
      productId: req.params.id,
      quantity: req.body.quantity,
    });

    return ApiResponse.success(res, data);
  });

  removeItem = asyncHandler(async (req, res) => {
    const { userId, sessionId } = this._resolveCartContext(req, res);
    const data = await this.service.removeItem({
      userId,
      sessionId,
      commerceFlow: req.query.commerceFlow || 'standard',
      productId: req.params.id,
      variantId: null,
    });

    return ApiResponse.success(res, data);
  });

  clearCart = asyncHandler(async (req, res) => {
    const { userId, sessionId } = this._resolveCartContext(req, res);
    const data = await this.service.clearCart({ userId, sessionId });
    return ApiResponse.success(res, data);
  });
}

module.exports = {
  CartController,
};

