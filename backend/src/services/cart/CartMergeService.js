const { BaseService } = require('../../core/BaseService');

class CartMergeService extends BaseService {
  constructor({ cartService }) {
    super();
    this.cartService = cartService;
  }

  async mergeGuestIntoCustomer({ guestSessionId, customerId, commerceFlow = 'standard' }) {
    if (!guestSessionId || !customerId) {
      return null;
    }

    // Load both states.
    const guest = await this.cartService.getCart({ sessionId: guestSessionId, userId: null, commerceFlow });
    const customer = await this.cartService.getCart({ sessionId: null, userId: customerId, commerceFlow });

    if (!guest.items || guest.items.length === 0) {
      return customer;
    }

    // Merge by itemKey (productId:variantId).
    const map = new Map();
    customer.items.forEach((it) => {
      const itemKey = `${it.productId}:${it.variantId || ''}`;
      map.set(itemKey, { ...it });
    });

    guest.items.forEach((it) => {
      const itemKey = `${it.productId}:${it.variantId || ''}`;
      const existing = map.get(itemKey);
      if (existing) {
        existing.quantity += it.quantity;
      } else {
        map.set(itemKey, { ...it });
      }
    });

    // Validate stock by re-using addItem logic per line.
    await this.cartService.clearCart({ userId: customerId, sessionId: null });

    for (const it of map.values()) {
      await this.cartService.addItem({
        userId: customerId,
        sessionId: null,
        commerceFlow,
        productId: it.productId,
        variantId: it.variantId || null,
        quantity: it.quantity,
      });
    }

    // Clear guest cart key.
    await this.cartService.clearCart({ userId: null, sessionId: guestSessionId });

    return this.cartService.getCart({ userId: customerId, sessionId: null, commerceFlow });
  }
}

module.exports = {
  CartMergeService,
};

