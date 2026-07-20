const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { CART } = require('../../constants/commerce');

class CartService extends BaseService {
  constructor({ redisClient, productRepository, pricingService }) {
    super();
    this.redis = redisClient;
    this.productRepository = productRepository;
    this.pricingService = pricingService;
  }

  _cartKey({ userId, sessionId }) {
    if (userId) return `cart:customer:${userId}`;
    return `cart:guest:${sessionId}`;
  }

  _serialize(state) {
    return JSON.stringify(state);
  }

  _deserialize(raw) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_e) {
      return null;
    }
  }

  async getCart({ userId, sessionId, commerceFlow = 'standard', couponCode = null }) {
    const key = this._cartKey({ userId, sessionId });
    const raw = await this.redis.get(key);
    const state = this._deserialize(raw);

    const items = state?.items || [];
    const pricing = await this.pricingService.calculateTotals({
      items,
      couponCode: couponCode || state?.couponCode || null,
      userId,
    });

    return {
      userId: userId || null,
      sessionId: sessionId || null,
      commerceFlow: state?.commerceFlow || commerceFlow,
      couponCode: couponCode || state?.couponCode || null,
      items,
      ...pricing,
    };
  }

  async addItem({ userId, sessionId, commerceFlow = 'standard', productId, variantId = null, quantity }) {
    const product = await this.productRepository.findPublicById(productId);
    if (!product) throw AppError.notFound('Product not found');

    if (product.stock < quantity) {
      throw AppError.conflict('Requested quantity exceeds available stock', [
        { field: 'quantity', message: 'Insufficient stock', availableQuantity: product.stock },
      ]);
    }

    const key = this._cartKey({ userId, sessionId });
    const raw = await this.redis.get(key);
    const state = this._deserialize(raw) || { commerceFlow, items: [] };

    const itemKey = `${productId}:${variantId || ''}`;
    const existing = state.items.find((it) => it.itemKey === itemKey);
    const nextQty = existing ? existing.quantity + quantity : quantity;

    if (product.stock < nextQty) {
      throw AppError.conflict('Insufficient stock', [
        { field: 'quantity', message: 'Insufficient stock', availableQuantity: product.stock },
      ]);
    }

    const sellerId = product.sellerId;
    const unitPrice = product.price;

    if (existing) {
      existing.quantity = nextQty;
      existing.unitPrice = unitPrice;
      existing.sellerId = sellerId;
      existing.variantId = variantId || null;
    } else {
      state.items.push({
        itemKey,
        productId,
        variantId: variantId || null,
        sellerId,
        quantity,
        unitPrice,
      });
    }

    state.commerceFlow = commerceFlow;
    state.updatedAt = new Date().toISOString();

    await this.redis.set(key, this._serialize(state), 'EX', CART.CART_KEY_TTL_SECONDS);

    return this.getCart({ userId, sessionId, commerceFlow, couponCode: state.couponCode });
  }

  async updateItemQuantity({ userId, sessionId, commerceFlow = 'standard', productId, variantId = null, quantity }) {
    const product = await this.productRepository.findPublicById(productId);
    if (!product) throw AppError.notFound('Product not found');

    const key = this._cartKey({ userId, sessionId });
    const raw = await this.redis.get(key);
    const state = this._deserialize(raw) || { commerceFlow, items: [] };

    const itemKey = `${productId}:${variantId || ''}`;
    const item = state.items.find((it) => it.itemKey === itemKey);
    if (!item) throw AppError.notFound('Cart item not found');

    if (quantity > product.stock) {
      throw AppError.conflict('Requested quantity exceeds available stock', [
        { field: 'quantity', message: 'Insufficient stock', availableQuantity: product.stock },
      ]);
    }

    item.quantity = quantity;
    item.unitPrice = product.price;
    item.sellerId = product.sellerId;
    item.variantId = variantId || null;

    state.commerceFlow = commerceFlow;
    state.updatedAt = new Date().toISOString();

    await this.redis.set(key, this._serialize(state), 'EX', CART.CART_KEY_TTL_SECONDS);

    return this.getCart({ userId, sessionId, commerceFlow, couponCode: state.couponCode });
  }

  async removeItem({ userId, sessionId, commerceFlow = 'standard', productId, variantId = null }) {
    const key = this._cartKey({ userId, sessionId });
    const raw = await this.redis.get(key);
    const state = this._deserialize(raw) || { commerceFlow, items: [] };

    const itemKey = `${productId}:${variantId || ''}`;
    state.items = state.items.filter((it) => it.itemKey !== itemKey);
    state.updatedAt = new Date().toISOString();

    await this.redis.set(key, this._serialize(state), 'EX', CART.CART_KEY_TTL_SECONDS);

    return this.getCart({ userId, sessionId, commerceFlow, couponCode: state.couponCode });
  }

  async clearCart({ userId, sessionId }) {
    const key = this._cartKey({ userId, sessionId });
    await this.redis.del(key);
    return this.getCart({ userId, sessionId });
  }

  async persistCartSnapshot({ userId, sessionId, cartRepository, cartItemRepository, session = null }) {
    const cart = await this.getCart({ userId, sessionId });
    const mongoCart = await cartRepository.upsertActiveCart(
      {
        userId,
        sessionId: null,
        commerceFlow: cart.commerceFlow,
        currency: CART.DEFAULT_CURRENCY,
      },
      session
    );

    await cartRepository.updateById(
      mongoCart._id,
      {
        subtotal: cart.subtotal,
        shippingFee: cart.deliveryCharge,
        total: cart.total,
        status: 'inactive',
        lastActiveAt: new Date(),
      },
      session
    );

    await cartItemRepository.softDeleteByCartId(mongoCart._id, session);

    for (const item of cart.items) {
      await cartItemRepository.upsertLine({
        cartId: mongoCart._id,
        userId,
        sessionId: null,
        productId: item.productId,
        sellerId: item.sellerId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        session,
      });
    }

    return mongoCart;
  }
}

module.exports = {
  CartService,
};
