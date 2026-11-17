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

  _loginRequiredError() {
    const err = AppError.unauthorized('Please log in to continue');
    err.details = [{ code: 'LOGIN_REQUIRED' }];
    return err;
  }

  /** Tab of the cart being acted on: query string (GET/DELETE) or body (PATCH). */
  _tabOf(req) {
    return {
      marketplaceTab: req.query?.marketplaceTab || req.body?.marketplaceTab || null,
      commerceFlow: req.query?.commerceFlow || req.body?.commerceFlow || null,
    };
  }

  /**
   * Guests have no cart. Reads return an empty one (so the badge shows 0);
   * anything that would change a cart is refused with LOGIN_REQUIRED so the
   * storefront can send the shopper to log in first.
   */
  async _guestGate(req, userId) {
    if (userId) return false;
    return this.service.isLoginRequired();
  }

  getCart = asyncHandler(async (req, res) => {
    if (await this._guestGate(req, req.user?.id || null)) {
      return ApiResponse.success(res, await this.service.getEmptyCart({
        marketplaceTab: req.query.marketplaceTab || null,
        commerceFlow: req.query.commerceFlow || null,
      }));
    }
    const { userId, sessionId } = this._resolveCartContext(req, res);
    const data = await this.service.getCart({
      userId,
      sessionId,
      commerceFlow: req.query.commerceFlow || 'standard',
      marketplaceTab: req.query.marketplaceTab || null,
      couponCode: req.query.couponCode ? String(req.query.couponCode).trim().toUpperCase() : null,
    });

    return ApiResponse.success(res, data);
  });

  addItem = asyncHandler(async (req, res) => {
    if (await this._guestGate(req, req.user?.id || null)) throw this._loginRequiredError();
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
    if (await this._guestGate(req, req.user?.id || null)) throw this._loginRequiredError();
    const { userId, sessionId } = this._resolveCartContext(req, res);
    const data = await this.service.updateItemQuantity({
      userId,
      sessionId,
      itemId: req.params.id,
      quantity: req.body.quantity,
      ...this._tabOf(req),
    });

    return ApiResponse.success(res, data);
  });

  removeItem = asyncHandler(async (req, res) => {
    if (await this._guestGate(req, req.user?.id || null)) throw this._loginRequiredError();
    const { userId, sessionId } = this._resolveCartContext(req, res);
    const data = await this.service.removeItem({
      userId,
      sessionId,
      itemId: req.params.id,
      ...this._tabOf(req),
    });

    return ApiResponse.success(res, data);
  });

  clearCart = asyncHandler(async (req, res) => {
    if (await this._guestGate(req, req.user?.id || null)) throw this._loginRequiredError();
    const { userId, sessionId } = this._resolveCartContext(req, res);
    const data = await this.service.clearCart({ userId, sessionId, ...this._tabOf(req) });
    return ApiResponse.success(res, data);
  });
}

module.exports = {
  CartController,
};

