const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { CART } = require('../../constants/commerce');
const { normalizeMarketplaceTab, toLegacyCommerceFlow } = require('../../utils/marketplaceTab');

const DEFAULT_TAB = 'mithilakart';

class CartService extends BaseService {
  constructor({ redisClient, productRepository, pricingService, marketplaceListingService = null }) {
    super();
    this.redis = redisClient;
    this.productRepository = productRepository;
    this.pricingService = pricingService;
    this.marketplaceListingService = marketplaceListingService;
    this.packageService = null;
  }

  setPackageService(packageService) {
    this.packageService = packageService;
  }

  /** Pre-tab key. Still read once to migrate old carts; never written to except to drop migrated lines. */
  _legacyCartKey({ userId, sessionId }) {
    if (userId) return `cart:customer:${userId}`;
    return `cart:guest:${sessionId}`;
  }

  /** One independent cart per owner + marketplace tab. */
  _cartKey({ userId, sessionId, tab }) {
    return `${this._legacyCartKey({ userId, sessionId })}:${tab || DEFAULT_TAB}`;
  }

  /**
   * The backend decides the tab: an explicit-but-unknown tab is rejected, a
   * missing one falls back to Mithilakart (what every pre-tab client implied).
   */
  _resolveTab({ marketplaceTab = null, commerceFlow = null } = {}) {
    const raw = marketplaceTab || null;
    if (raw) {
      const tab = normalizeMarketplaceTab(raw);
      if (!tab) throw AppError.validation('Invalid marketplace tab', [{ field: 'marketplaceTab', message: 'Unknown tab' }]);
      return tab;
    }
    return normalizeMarketplaceTab(commerceFlow) || DEFAULT_TAB;
  }

  /**
   * Loads one tab's cart. If that tab has no cart yet, lines left in the old
   * single-cart key that are known to belong to this tab are moved over.
   * Lines whose tab is unknown stay in the old key untouched (never guessed).
   */
  async _loadState(owner, tab) {
    const key = this._cartKey({ ...owner, tab });
    const existing = this._deserialize(await this.redis.get(key));
    if (existing) return existing;

    const legacyKey = this._legacyCartKey(owner);
    const legacy = this._deserialize(await this.redis.get(legacyKey));
    if (!legacy?.items?.length) return null;

    const lineTab = (it) => normalizeMarketplaceTab(it.marketplaceTab || legacy.marketplaceTab);
    const mine = legacy.items.filter((it) => lineTab(it) === tab);
    if (!mine.length) return null;

    const state = {
      items: mine,
      marketplaceTab: tab,
      commerceFlow: toLegacyCommerceFlow(tab),
      couponCode: legacy.marketplaceTab === tab ? legacy.couponCode : undefined,
      updatedAt: new Date().toISOString(),
    };
    await this.redis.set(key, this._serialize(state), 'EX', CART.CART_KEY_TTL_SECONDS);

    const rest = legacy.items.filter((it) => lineTab(it) !== tab);
    if (rest.length) {
      await this.redis.set(legacyKey, this._serialize({ ...legacy, items: rest }), 'EX', CART.CART_KEY_TTL_SECONDS);
    } else {
      await this.redis.del(legacyKey);
    }
    return state;
  }

  /** Admin-set purchase limits (per customer, per line, per cart). 0 means "no limit". */
  async _limits() {
    const svc = this.pricingService?.platformConfigService;
    if (!svc?.getPurchaseLimits) return { maxQuantityPerItem: 0, maxCartItems: 0, message: 'Limited quantity due to high demand' };
    return svc.getPurchaseLimits();
  }

  /** Admin switch: when on (default) a customer must be logged in to use the cart. */
  async isLoginRequired() {
    const svc = this.pricingService?.platformConfigService;
    if (!svc?.getConfig) return true;
    return (await svc.getConfig()).loginRequired !== false;
  }

  /** What a logged-out visitor sees: a real, empty cart (0 items) with the current fee rules. */
  async getEmptyCart({ marketplaceTab = null, commerceFlow = null } = {}) {
    const tab = this._resolveTab({ marketplaceTab, commerceFlow });
    const pricing = await this.pricingService.calculateTotals({ items: [] });
    return {
      userId: null,
      sessionId: null,
      commerceFlow: toLegacyCommerceFlow(tab),
      marketplaceTab: tab,
      couponCode: null,
      items: [],
      loginRequired: true,
      limits: await this._limits(),
      ...pricing,
    };
  }

  /** Effective max for one line: admin cap, tightened by the listing's own cap. */
  _lineMax(limits, listingMax = null) {
    const caps = [limits.maxQuantityPerItem, Number(listingMax) || 0].filter((n) => n > 0);
    return caps.length ? Math.min(...caps) : 0;
  }

  _assertWithinLimit(nextQty, max, limits) {
    if (max > 0 && nextQty > max) {
      throw AppError.conflict(`${limits.message}. You can buy up to ${max} of this item.`, [
        { code: 'QUANTITY_LIMIT_EXCEEDED', field: 'quantity', maxQuantity: max },
      ]);
    }
  }

  /**
   * Last check before an order is created, for the cart and for Buy Now alike:
   * the admin's limits may have been tightened after the items were added, and
   * Buy Now never passes through the cart at all.
   */
  async assertPurchaseLimits(items = []) {
    const limits = await this._limits();
    if (limits.maxCartItems > 0 && items.length > limits.maxCartItems) {
      throw AppError.conflict(`Your cart can hold up to ${limits.maxCartItems} different items.`, [
        { code: 'CART_LIMIT_EXCEEDED', maxCartItems: limits.maxCartItems },
      ]);
    }
    // The same product on two lines (two listings, a package…) counts together for the per-item cap.
    const perProduct = new Map();
    items.forEach((it) => {
      const key = `${it.productId}:${it.variantId || ''}:${it.packageId || ''}`;
      perProduct.set(key, (perProduct.get(key) || 0) + (Number(it.quantity) || 0));
    });
    for (const it of items) {
      const key = `${it.productId}:${it.variantId || ''}:${it.packageId || ''}`;
      this._assertWithinLimit(perProduct.get(key), this._lineMax(limits, null), limits);
      this._assertWithinLimit(Number(it.quantity) || 0, this._lineMax(limits, it.maxOrderQuantity), limits);
    }
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
    const limits = await this._limits();

    return Promise.all(
      items.map(async (item) => {
        if (item.packageId && this.packageService) {
          try {
            const { pkg, quote } = await this.packageService.resolveForCart(item.packageId, item.selectedItemIds || []);
            const { listing, product } = await this.marketplaceListingService.resolveListingForCart(item.listingId || pkg.productId);
            const availableStock = this.productRepository.getAvailableStock(product);
            const imageUrl = pkg.imageUrl || product.images?.[0]?.url || null;
            return {
              ...item,
              productId: String(product._id),
              listingId: String(listing._id),
              name: pkg.name,
              title: pkg.name,
              brand: product.brand || '',
              mrp: pkg.fullPrice,
              unitPrice: quote.price,
              price: quote.price,
              deliveryPromiseMinutes: listing.deliveryPromiseMinutes,
              marketplaceTab: listing.marketplaceTab,
              image: imageUrl,
              imageUrl,
              availableStock,
              maxOrderQuantity: listing.maxOrderQuantity || null,
              maxQuantity: this._effectiveMax(limits, listing.maxOrderQuantity, availableStock),
              customization: {
                packageId: String(pkg._id),
                packageName: pkg.name,
                selectedCount: quote.selectedCount,
                totalCount: quote.totalCount,
                items: quote.selectedItems,
              },
            };
          } catch {
            return { ...item, name: 'Package', title: 'Package' };
          }
        }

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
              maxOrderQuantity: listing.maxOrderQuantity || null,
              maxQuantity: this._effectiveMax(limits, listing.maxOrderQuantity, availableStock),
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
          maxQuantity: this._effectiveMax(limits, null, availableStock),
        };
      })
    );
  }

  /** What the +/- stepper may reach: purchase limit and stock, whichever is lower. */
  _effectiveMax(limits, listingMax, availableStock) {
    const caps = [this._lineMax(limits, listingMax), Number(availableStock) || 0].filter((n) => n > 0);
    return caps.length ? Math.min(...caps) : 0;
  }

  async getCart({ userId, sessionId, commerceFlow = 'standard', marketplaceTab = null, couponCode = null, tipAmount = 0, lenientCoupon = false, clientKey = null, paymentMethod = null, giftCardCode = null, useWallet = false }) {
    const tab = this._resolveTab({ marketplaceTab, commerceFlow });
    const state = await this._loadState({ userId, sessionId }, tab);

    const rawItems = state?.items || [];
    const items = await this._hydrateCartItems(rawItems);
    let appliedCode = couponCode || state?.couponCode || null;
    let couponError = null;
    const totals = (code) => this.pricingService.calculateTotals({
      items,
      couponCode: code,
      userId,
      marketplaceTab: tab,
      tipAmount,
      ...(clientKey ? { clientKey } : {}),
      ...(paymentMethod ? { paymentMethod } : {}),
      ...(giftCardCode ? { giftCardCode } : {}),
      ...(useWallet ? { useWallet } : {}),
      ...(lenientCoupon ? { lenientCredits: true } : {}),
    });
    let pricing;
    try {
      pricing = await totals(appliedCode);
    } catch (error) {
      if (!lenientCoupon || !appliedCode || error?.isCouponError !== true) throw error;
      couponError = error.message;
      appliedCode = null;
      pricing = await totals(null);
    }

    return {
      userId: userId || null,
      sessionId: sessionId || null,
      commerceFlow: toLegacyCommerceFlow(tab) || commerceFlow,
      marketplaceTab: tab,
      couponCode: appliedCode,
      ...(couponError ? { couponError } : {}),
      items,
      limits: await this._limits(),
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
    packageId = null,
    selectedItemIds = [],
    variantId = null,
    quantity,
  }) {
    if (packageId) {
      return this._addPackage({ userId, sessionId, commerceFlow, marketplaceTab, packageId, selectedItemIds, quantity });
    }
    let tab = this._resolveTab({ marketplaceTab, commerceFlow: marketplaceTab ? null : commerceFlow });
    const owner = { userId, sessionId };

    if (listingId && this.marketplaceListingService) {
      let resolvedListing;
      try {
        resolvedListing = await this.marketplaceListingService.resolveListingForCart(listingId, marketplaceTab ? tab : undefined);
      } catch (err) {
        // A card can carry a listing id that was since hidden, rejected or replaced.
        // When the caller also knows the product, fall back to it rather than failing the add.
        if (err?.statusCode === 404 && productId) {
          return this.addItem({ userId, sessionId, commerceFlow, marketplaceTab, productId, listingId: null, variantId, quantity });
        }
        throw err;
      }
      const { listing, product } = resolvedListing;

      // A listing belongs to exactly one tab; with no explicit tab it decides.
      if (marketplaceTab && listing.marketplaceTab !== tab) {
        throw AppError.conflict('Listing does not belong to active marketplace tab', [
          { code: 'CART_TAB_MISMATCH' },
        ]);
      }
      tab = listing.marketplaceTab;

      const availableStock = this.productRepository.getAvailableStock(product);
      if (availableStock < quantity) {
        throw AppError.conflict('Insufficient stock', [
          { field: 'quantity', message: 'Insufficient stock', availableQuantity: availableStock },
        ]);
      }

      const key = this._cartKey({ ...owner, tab });
      const state = (await this._loadState(owner, tab)) || { items: [] };

      const itemKey = `listing:${listingId}`;
      const existing = state.items.find((it) => it.itemKey === itemKey);
      const nextQty = existing ? existing.quantity + quantity : quantity;

      const limits = await this._limits();
      this._assertWithinLimit(nextQty, this._lineMax(limits, listing.maxOrderQuantity), limits);
      if (!existing && limits.maxCartItems > 0 && state.items.length >= limits.maxCartItems) {
        throw AppError.conflict(`Your cart can hold up to ${limits.maxCartItems} different items.`, [
          { code: 'CART_ITEM_LIMIT_EXCEEDED', maxCartItems: limits.maxCartItems },
        ]);
      }

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

      state.marketplaceTab = tab;
      state.commerceFlow = toLegacyCommerceFlow(tab) || commerceFlow;
      state.updatedAt = new Date().toISOString();

      await this.redis.set(key, this._serialize(state), 'EX', CART.CART_KEY_TTL_SECONDS);
      return this.getCart({ userId, sessionId, marketplaceTab: tab, couponCode: state.couponCode });
    }

    // Screens that add by product id still go through the tab's listing, so
    // the line carries that tab's price and delivery promise. Products with
    // no listing in the tab (legacy data) keep the plain product path.
    if (this.marketplaceListingService) {
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

    const key = this._cartKey({ ...owner, tab });
    const state = (await this._loadState(owner, tab)) || { items: [] };

    const itemKey = `${productId}:${variantId || ''}`;
    const existing = state.items.find((it) => it.itemKey === itemKey);
    const nextQty = existing ? existing.quantity + quantity : quantity;

    const limits = await this._limits();
    this._assertWithinLimit(nextQty, this._lineMax(limits), limits);
    if (!existing && limits.maxCartItems > 0 && state.items.length >= limits.maxCartItems) {
      throw AppError.conflict(`Your cart can hold up to ${limits.maxCartItems} different items.`, [
        { code: 'CART_ITEM_LIMIT_EXCEEDED', maxCartItems: limits.maxCartItems },
      ]);
    }

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
        marketplaceTab: tab,
      });
    }

    state.commerceFlow = toLegacyCommerceFlow(tab) || commerceFlow;
    state.marketplaceTab = tab;
    state.updatedAt = new Date().toISOString();

    await this.redis.set(key, this._serialize(state), 'EX', CART.CART_KEY_TTL_SECONDS);

    return this.getCart({ userId, sessionId, marketplaceTab: tab, couponCode: state.couponCode });
  }

  /**
   * Adds a customised package. The selection is re-priced here from the package's own
   * item list; the stored line carries only ids, and every read re-prices it again.
   */
  async _addPackage({ userId, sessionId, commerceFlow, marketplaceTab, packageId, selectedItemIds, quantity }) {
    if (!this.packageService || !this.marketplaceListingService) throw AppError.badRequest('Packages are not available');
    const { pkg, quote } = await this.packageService.resolveForCart(packageId, selectedItemIds);
    const { listing, product } = await this.marketplaceListingService.resolveListingForCart(
      pkg.productId,
      marketplaceTab ? this._resolveTab({ marketplaceTab }) : pkg.marketplaceTab
    );

    const tab = listing.marketplaceTab;
    const owner = { userId, sessionId };
    const availableStock = this.productRepository.getAvailableStock(product);
    const key = this._cartKey({ ...owner, tab });
    const state = (await this._loadState(owner, tab)) || { items: [] };

    const itemKey = `package:${pkg._id}:${this.packageService.selectionHash(quote.selectedItemIds)}`;
    const existing = state.items.find((it) => it.itemKey === itemKey);
    const nextQty = existing ? existing.quantity + quantity : quantity;

    const limits = await this._limits();
    this._assertWithinLimit(nextQty, this._lineMax(limits, listing.maxOrderQuantity), limits);
    if (availableStock < nextQty) {
      throw AppError.conflict('Insufficient stock', [
        { field: 'quantity', message: 'Insufficient stock', availableQuantity: availableStock },
      ]);
    }
    if (!existing && limits.maxCartItems > 0 && state.items.length >= limits.maxCartItems) {
      throw AppError.conflict(`Your cart can hold up to ${limits.maxCartItems} different items.`, [
        { code: 'CART_ITEM_LIMIT_EXCEEDED', maxCartItems: limits.maxCartItems },
      ]);
    }

    const line = {
      itemKey,
      packageId: String(pkg._id),
      selectedItemIds: quote.selectedItemIds,
      listingId: String(listing._id),
      productId: String(product._id),
      sellerId: String(product.sellerId),
      quantity: nextQty,
      unitPrice: quote.price,
      deliveryPromiseMinutes: listing.deliveryPromiseMinutes,
      marketplaceTab: listing.marketplaceTab,
    };
    if (existing) Object.assign(existing, line); else state.items.push(line);

    state.marketplaceTab = tab;
    state.commerceFlow = toLegacyCommerceFlow(tab) || commerceFlow;
    state.updatedAt = new Date().toISOString();
    await this.redis.set(key, this._serialize(state), 'EX', CART.CART_KEY_TTL_SECONDS);
    return this.getCart({ userId, sessionId, marketplaceTab: tab, couponCode: state.couponCode });
  }

  /**
   * Finds a cart line by the itemKey the cart hands out ("listing:<id>" or
   * "<productId>:<variantId>"). Older clients send a bare listing/product id.
   * Matching only "<productId>:" broke +/- and Remove for every listing line.
   */
  _findLine(state, itemId) {
    const id = String(itemId || '');
    const bare = id.replace(/^listing:/, '').split(':')[0];
    return state.items.find((it) => it.itemKey === id)
      || state.items.find((it) => it.listingId && String(it.listingId) === bare)
      || state.items.find((it) => String(it.productId) === bare);
  }

  async updateItemQuantity({ userId, sessionId, itemId, productId, quantity, marketplaceTab = null, commerceFlow = null }) {
    const tab = this._resolveTab({ marketplaceTab, commerceFlow });
    const key = this._cartKey({ userId, sessionId, tab });
    const state = (await this._loadState({ userId, sessionId }, tab)) || { items: [] };

    const item = this._findLine(state, itemId || productId);
    if (!item) throw AppError.notFound('Cart item not found');

    const product = await this.productRepository.findPublicById(item.productId);
    if (!product) throw AppError.notFound('Product not found');

    const availableStock = this.productRepository.getAvailableStock(product);

    const limits = await this._limits();
    let listingMax = null;
    if (item.listingId && this.marketplaceListingService) {
      try {
        listingMax = (await this.marketplaceListingService.resolveListingForCart(item.listingId)).listing.maxOrderQuantity;
      } catch { /* listing gone: the stock check below still applies */ }
    }
    this._assertWithinLimit(quantity, this._lineMax(limits, listingMax), limits);

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

    return this.getCart({ userId, sessionId, marketplaceTab: tab, couponCode: state.couponCode });
  }

  async removeItem({ userId, sessionId, itemId, productId, marketplaceTab = null, commerceFlow = null }) {
    const tab = this._resolveTab({ marketplaceTab, commerceFlow });
    const key = this._cartKey({ userId, sessionId, tab });
    const state = (await this._loadState({ userId, sessionId }, tab)) || { items: [] };

    const item = this._findLine(state, itemId || productId);
    if (item) state.items = state.items.filter((it) => it !== item);
    state.updatedAt = new Date().toISOString();

    await this.redis.set(key, this._serialize(state), 'EX', CART.CART_KEY_TTL_SECONDS);

    return this.getCart({ userId, sessionId, marketplaceTab: tab, couponCode: state.couponCode });
  }

  /** Clears ONE tab's cart. Other tabs' carts are never touched. */
  async clearCart({ userId, sessionId, marketplaceTab = null, commerceFlow = null }) {
    const tab = this._resolveTab({ marketplaceTab, commerceFlow });
    // Load first so lines still in the old key are migrated out (and not resurrected later).
    await this._loadState({ userId, sessionId }, tab);
    await this.redis.del(this._cartKey({ userId, sessionId, tab }));
    return this.getCart({ userId, sessionId, marketplaceTab: tab });
  }

  async persistCartSnapshot({ userId, sessionId, cartRepository, cartItemRepository, session = null, marketplaceTab = null, commerceFlow = null }) {
    const cart = await this.getCart({ userId, sessionId, marketplaceTab, commerceFlow });
    const mongoCart = await cartRepository.upsertActiveCart(
      {
        userId,
        sessionId: null,
        commerceFlow: cart.commerceFlow,
        marketplaceTab: cart.marketplaceTab,
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
