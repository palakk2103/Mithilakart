const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { CART } = require('../../constants/commerce');
const { resolveTabFromQuery, toLegacyCommerceFlow } = require('../../utils/marketplaceTab');

class CartService extends BaseService {
  constructor({ redisClient, productRepository, pricingService, marketplaceListingService = null }) {
    super();
    this.redis = redisClient;
    this.productRepository = productRepository;
    this.pricingService = pricingService;
    this.marketplaceListingService = marketplaceListingService;
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

  async _hydrateCartItems(items = []) {
    if (!items.length) return [];

    return Promise.all(
      items.map(async (item) => {
        if (item.listingId && this.marketplaceListingService) {
          try {
            const { listing, product } = await this.marketplaceListingService.resolveListingForCart(item.listingId);
            const availableStock = this.productRepository.getAvailableStock(product);
            const imageUrl = product.images?.[0]?.url || null;
            return {
              ...item,
              productId: String(product._id),
              listingId: String(listing._id),
              name: product.title,
              title: product.title,
              brand: product.brand || '',
              mrp: listing.mrp,
              unitPrice: listing.price,
              price: listing.price,
              deliveryPromiseMinutes: listing.deliveryPromiseMinutes,
              marketplaceTab: listing.marketplaceTab,
              image: imageUrl,
              imageUrl,
              availableStock,
            };
          } catch {
            return { ...item, name: 'Product', title: 'Product' };
          }
        }

        const product = await this.productRepository.findPublicById(item.productId);
        if (!product) {
          return { ...item, name: 'Product', title: 'Product' };
        }

        const availableStock = this.productRepository.getAvailableStock(product);
        const imageUrl = product.images?.[0]?.url || null;

        return {
          ...item,
          name: product.title,
          title: product.title,
          brand: product.brand || '',
          mrp: product.mrp,
          image: imageUrl,
          imageUrl,
          availableStock,
        };
      })
    );
  }

  async getCart({ userId, sessionId, commerceFlow = 'standard', marketplaceTab = null, couponCode = null }) {
    const tab = marketplaceTab || resolveTabFromQuery({ commerceFlow }) || null;
    const key = this._cartKey({ userId, sessionId });
    const raw = await this.redis.get(key);
    const state = this._deserialize(raw);

    const rawItems = state?.items || [];
    const items = await this._hydrateCartItems(rawItems);
    const pricing = await this.pricingService.calculateTotals({
      items: rawItems,
      couponCode: couponCode || state?.couponCode || null,
      userId,
    });

    return {
      userId: userId || null,
      sessionId: sessionId || null,
      commerceFlow: state?.commerceFlow || commerceFlow,
      marketplaceTab: state?.marketplaceTab || tab,
      couponCode: couponCode || state?.couponCode || null,
      items,
      ...pricing,
    };
  }

  async addItem({
    userId,
    sessionId,
    commerceFlow = 'standard',
    marketplaceTab = null,
    productId,
    listingId = null,
    variantId = null,
    quantity,
  }) {
    const tab = marketplaceTab || resolveTabFromQuery({ commerceFlow });

    if (listingId && this.marketplaceListingService) {
      const { listing, product } = await this.marketplaceListingService.resolveListingForCart(listingId);

      if (tab && listing.marketplaceTab !== tab) {
        throw AppError.conflict('Listing does not belong to active marketplace tab', [
          { code: 'CART_TAB_MISMATCH' },
        ]);
      }

      const availableStock = this.productRepository.getAvailableStock(product);
      if (availableStock < quantity) {
        throw AppError.conflict('Insufficient stock', [
          { field: 'quantity', message: 'Insufficient stock', availableQuantity: availableStock },
        ]);
      }

      const key = this._cartKey({ userId, sessionId });
      const raw = await this.redis.get(key);
      const state = this._deserialize(raw) || { items: [] };

      if (state.marketplaceTab && state.marketplaceTab !== listing.marketplaceTab) {
        throw AppError.conflict('Cart contains items from a different marketplace tab', [
          { code: 'CART_TAB_MISMATCH' },
        ]);
      }

      const itemKey = `listing:${listingId}`;
      const existing = state.items.find((it) => it.itemKey === itemKey);
      const nextQty = existing ? existing.quantity + quantity : quantity;

      if (availableStock < nextQty) {
        throw AppError.conflict('Insufficient stock', [
          { field: 'quantity', message: 'Insufficient stock', availableQuantity: availableStock },
        ]);
      }

      const line = {
        itemKey,
        listingId: String(listing._id),
        productId: String(product._id),
        variantId: variantId || null,
        sellerId: String(product.sellerId),
        quantity: nextQty,
        unitPrice: listing.price,
        deliveryPromiseMinutes: listing.deliveryPromiseMinutes,
        marketplaceTab: listing.marketplaceTab,
      };

      if (existing) {
        Object.assign(existing, line);
      } else {
        state.items.push(line);
      }

      state.marketplaceTab = listing.marketplaceTab;
      state.commerceFlow = toLegacyCommerceFlow(listing.marketplaceTab) || commerceFlow;
      state.updatedAt = new Date().toISOString();

      await this.redis.set(key, this._serialize(state), 'EX', CART.CART_KEY_TTL_SECONDS);
      return this.getCart({ userId, sessionId, marketplaceTab: listing.marketplaceTab, couponCode: state.couponCode });
    }

    const product = await this.productRepository.findPublicById(productId);
    if (!product) throw AppError.notFound('Product not found');

    const availableStock = this.productRepository.getAvailableStock(product);

    if (availableStock < quantity) {
      throw AppError.conflict('Requested quantity exceeds available stock', [
        { field: 'quantity', message: 'Insufficient stock', availableQuantity: availableStock },
      ]);
    }

    const key = this._cartKey({ userId, sessionId });
    const raw = await this.redis.get(key);
    const state = this._deserialize(raw) || { commerceFlow, items: [] };

    const itemKey = `${productId}:${variantId || ''}`;
    const existing = state.items.find((it) => it.itemKey === itemKey);
    const nextQty = existing ? existing.quantity + quantity : quantity;

    if (availableStock < nextQty) {
      throw AppError.conflict('Insufficient stock', [
        { field: 'quantity', message: 'Insufficient stock', availableQuantity: availableStock },
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
    if (tab) state.marketplaceTab = tab;
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

    const availableStock = this.productRepository.getAvailableStock(product);

    if (quantity > availableStock) {
      throw AppError.conflict('Requested quantity exceeds available stock', [
        { field: 'quantity', message: 'Insufficient stock', availableQuantity: availableStock },
      ]);
    }

    item.quantity = quantity;
    item.unitPrice = product.price;
    item.sellerId = product.sellerId;
    item.variantId = variantId || null;

    state.commerceFlow = commerceFlow;
    if (tab) state.marketplaceTab = tab;
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
