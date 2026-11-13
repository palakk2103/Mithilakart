const { BaseService } = require('../../core/BaseService');
const { MARKETPLACE_TAB_VALUES } = require('../../constants/marketplace');
const { logger } = require('../../utils/logger');

class CartMergeService extends BaseService {
  constructor({ cartService }) {
    super();
    this.cartService = cartService;
  }

  /**
   * Moves a guest's carts into the customer's carts, tab by tab. A guest line
   * only ever lands in the customer's cart for the same tab, and the customer's
   * existing lines are kept (quantities add up). A line that fails validation
   * (e.g. out of stock) is skipped instead of blocking login.
   */
  async mergeGuestIntoCustomer({ guestSessionId, customerId }) {
    if (!guestSessionId || !customerId) {
      return null;
    }

    for (const tab of MARKETPLACE_TAB_VALUES) {
      const guest = await this.cartService.getCart({ sessionId: guestSessionId, userId: null, marketplaceTab: tab });
      if (!guest.items || guest.items.length === 0) continue;

      for (const it of guest.items) {
        try {
          await this.cartService.addItem({
            userId: customerId,
            sessionId: null,
            marketplaceTab: tab,
            productId: it.productId,
            listingId: it.listingId || null,
            variantId: it.variantId || null,
            quantity: it.quantity,
          });
        } catch (err) {
          logger.warn({ err, tab, productId: it.productId }, 'Guest cart line not merged');
        }
      }

      await this.cartService.clearCart({ userId: null, sessionId: guestSessionId, marketplaceTab: tab });
    }

    return true;
  }
}

module.exports = {
  CartMergeService,
};
