const { BaseRepository } = require('../core/BaseRepository');
const CartItem = require('../models/CartItem');

class CartItemRepository extends BaseRepository {
  constructor() {
    super(CartItem);
  }

  async listByCartId(cartId) {
    return this.find({ cartId, deletedAt: null });
  }

  async upsertLine({ cartId, userId, sessionId, productId, sellerId, variantId = null, quantity, unitPrice, session = null }) {
    const filter = { cartId, productId, variantId, deletedAt: null };
    const update = {
      $set: {
        cartId,
        userId: userId || null,
        sessionId: sessionId || null,
        productId,
        sellerId,
        variantId,
        quantity,
        unitPrice,
        lineTotal: unitPrice * quantity,
      },
      $setOnInsert: { deletedAt: null },
      $inc: {},
    };

    const query = this.model.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
      runValidators: true,
    });

    if (session) query.session(session);
    const doc = await query.exec();
    return doc;
  }

  async setLineQuantity(cartItemId, quantity, session = null) {
    return this.updateById(cartItemId, { quantity }, session);
  }

  async deleteByCartItemId(cartItemId, session = null) {
    return this.deleteById(cartItemId, session);
  }

  async softDeleteByCartId(cartId, session = null) {
    const query = this.model.updateMany({ cartId, deletedAt: null }, { deletedAt: new Date() });
    if (session) query.session(session);
    return query.exec();
  }
}

module.exports = {
  CartItemRepository,
};

