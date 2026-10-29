const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { CART } = require('../../constants/commerce');
const { resolveTabFromQuery, toLegacyCommerceFlow } = require('../../utils/marketplaceTab');

const TAB_LABELS = {
  mithilakart: 'Mithilakart',
  mithilak: 'Mithilak',
  quick_shop: 'Quick Shop',
  groceries_fresh: 'Groceries & Fresh',
};

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
          unitPrice: product.price,
          price: product.price,
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
      items,
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
      const { listing, product } = await this.marketplaceListingService.resolveListingForCart(listingId, tab);

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

      this._resetTabIfEmpty(state);
      if (state.marketplaceTab && state.marketplaceTab !== listing.marketplaceTab) {
        throw this._tabMismatchError(state.marketplaceTab, listing.marketplaceTab);
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

    // Screens that add by product id still go through the tab's listing, so
    // the line carries that tab's price and delivery promise. Products with
    // no listing in the tab (legacy data) keep the plain product path.
    if (tab && this.marketplaceListingService) {
      let resolved = null;
      try {
        resolved = await this.marketplaceListingService.resolveListingForCart(productId, tab);
      } catch (err) {
        if (err?.statusCode !== 404) throw err;
      }
      if (resolved?.listing?.marketplaceTab === tab) {
        return this.addItem({
          userId, sessionId, commerceFlow, marketplaceTab: tab, listingId: String(resolved.listing._id), variantId, quantity,
        });
      }
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
    this._resetTabIfEmpty(state);
    if (tab && state.marketplaceTab && state.marketplaceTab !== tab) {
      throw this._tabMismatchError(state.marketplaceTab, tab);
    }

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

  /**
   * Finds a cart line by the itemKey the cart hands out ("listing:<id>" or
   * "<productId>:<variantId>"). Older clients send a bare listing/product id.
   * Matching only "<productId>:" broke +/− and Remove for every listing line.
   */
  _findLine(state, itemId) {
    const id = String(itemId || '');
    const bare = id.replace(/^listing:/, '').split(':')[0];
    return state.items.find((it) => it.itemKey === id)
      || state.items.find((it) => it.listingId && String(it.listingId) === bare)
      || state.items.find((it) => String(it.productId) === bare);
  }

  /** An emptied cart forgets its tab, so the next item may come from any tab. */
  _resetTabIfEmpty(state) {
    if (state.items.length) return;
    delete state.marketplaceTab;
    delete state.commerceFlow;
  }

  _tabMismatchError(cartTab, newTab) {
    const label = (tab) => TAB_LABELS[tab] || tab;
    return AppError.conflict(
      `Your cart has items from ${label(cartTab)}. Place that order or clear your cart before adding items from ${label(newTab)}.`,
      [{ code: 'CART_TAB_MISMATCH', cartTab, newTab }]
    );
  }

  async updateItemQuantity({ userId, sessionId, itemId, productId, quantity }) {
    const key = this._cartKey({ userId, sessionId });
    const raw = await this.redis.get(key);
    const state = this._deserialize(raw) || { items: [] };

    const item = this._findLine(state, itemId || productId);
    if (!item) throw AppError.notFound('Cart item not found');

    const product = await this.productRepository.findPublicById(item.productId);
    if (!product) throw AppError.notFound('Product not found');

    const availableStock = this.productRepository.getAvailableStock(product);

    if (quantity > availableStock) {
      throw AppError.conflict('Requested quantity exceeds available stock', [
        { field: 'quantity', message: 'Insufficient stock', availableQuantity: availableStock },
      ]);
    }

    item.quantity = quantity;
    item.sellerId = String(product.sellerId);
    // Listing lines are priced by their listing (refreshed on every read).
    if (!item.listingId) item.unitPrice = product.price;

    state.updatedAt = new Date().toISOString();

    await this.redis.set(key, this._serialize(state), 'EX', CART.CART_KEY_TTL_SECONDS);

    return this.getCart({ userId, sessionId, couponCode: state.couponCode });
  }

  async removeItem({ userId, sessionId, itemId, productId }) {
    const key = this._cartKey({ userId, sessionId });
    const raw = await this.redis.get(key);
    const state = this._deserialize(raw) || { items: [] };

    const item = this._findLine(state, itemId || productId);
    if (item) state.items = state.items.filter((it) => it !== item);
    this._resetTabIfEmpty(state);
    state.updatedAt = new Date().toISOString();

    await this.redis.set(key, this._serialize(state), 'EX', CART.CART_KEY_TTL_SECONDS);

    return this.getCart({ userId, sessionId, couponCode: state.couponCode });
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
