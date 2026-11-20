const mongoose = require('mongoose');
const { BaseService } = require('../../core/BaseService');
const { DEFAULT_CART_RAILS } = require('../../constants/checkoutContent');

const DAY = 24 * 60 * 60 * 1000;
const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));
const toIds = (list) => [...new Set((list || []).map(String).filter(isId))];

/**
 * CART-1 recommendation rails under the cart: Recently Viewed, Bestsellers
 * (with sub-tabs), Highly Ordered, Late Evening, My Wishlist, Quick Grabs,
 * You Might Have Missed, Recommended for You.
 *
 * Which rails show, their order, titles and sources come from the admin
 * setting `cartRails`. Every rail is real data for the cart's tab: only live
 * listings, never something already in the cart, no product repeated in two
 * rails, and a rail with nothing to show is left out rather than padded.
 */
class CartRecommendationService extends BaseService {
  constructor({
    marketplaceListingRepository,
    productRepository,
    orderItemRepository,
    wishlistRepository = null,
    platformConfigService = null,
  }) {
    super();
    this.listings = marketplaceListingRepository;
    this.products = productRepository;
    this.orderItems = orderItemRepository;
    this.wishlist = wishlistRepository;
    this.platformConfigService = platformConfigService;
  }

  async _config() {
    const cfg = this.platformConfigService ? await this.platformConfigService.getConfig() : {};
    const raw = cfg?.cartRails && typeof cfg.cartRails === 'object' ? cfg.cartRails : {};
    return {
      itemsPerRail: Math.min(20, Math.max(3, Number(raw.itemsPerRail) || DEFAULT_CART_RAILS.itemsPerRail)),
      rails: Array.isArray(raw.rails) && raw.rails.length ? raw.rails : DEFAULT_CART_RAILS.rails,
    };
  }

  /**
   * @param {object} p
   * @param {string} p.userId
   * @param {string} p.marketplaceTab
   * @param {string[]} p.cartProductIds  products already in the cart (excluded)
   * @param {string[]} p.recentProductIds  products the customer opened, newest first
   */
  async getRails({ userId, marketplaceTab, cartProductIds = [], recentProductIds = [] }) {
    const { itemsPerRail, rails } = await this._config();
    const ctx = {
      userId,
      tab: marketplaceTab,
      limit: itemsPerRail,
      cart: new Set(toIds(cartProductIds)),
      recent: toIds(recentProductIds).slice(0, 30),
      used: new Set(),
      memo: new Map(),
    };

    const out = [];
    for (const rail of rails) {
      if (!rail || rail.enabled === false) continue;
      if (Array.isArray(rail.subTabs) && rail.subTabs.length) {
        const tabs = [];
        for (const sub of rail.subTabs) {
          if (!sub || sub.enabled === false) continue;
          // eslint-disable-next-line no-await-in-loop
          const items = await this._railItems(sub, ctx, { dedupe: false });
          if (items.length) tabs.push({ key: sub.key, title: sub.title, source: sub.source, items });
        }
        if (tabs.length) {
          tabs[0].items.forEach((i) => ctx.used.add(i.productId));
          out.push({ key: rail.key, title: rail.title, tabs });
        }
        continue;
      }
      // eslint-disable-next-line no-await-in-loop
      const items = await this._railItems(rail, ctx, { dedupe: true });
      if (items.length) out.push({ key: rail.key, title: rail.title, source: rail.source, items });
    }
    return { marketplaceTab, rails: out };
  }

  async _railItems(rail, ctx, { dedupe }) {
    let productIds = await this._source(rail.source, rail, ctx);
    if (!productIds.length && rail.fallbackSource) productIds = await this._source(rail.fallbackSource, rail, ctx);
    const wanted = productIds.filter((id) => !ctx.cart.has(id) && (!dedupe || !ctx.used.has(id)));
    const cards = await this._cards(wanted, ctx, rail);
    const picked = cards.slice(0, ctx.limit);
    if (dedupe) picked.forEach((c) => ctx.used.add(c.productId));
    return picked;
  }

  /** Ordered product ids for one source (memoised per request). */
  async _source(source, rail, ctx) {
    const memoKey = source === 'manual' || source === 'budget' ? `${source}:${rail.key}` : source;
    if (ctx.memo.has(memoKey)) return ctx.memo.get(memoKey);
    let ids = [];
    switch (source) {
      case 'recently_viewed': ids = ctx.recent; break;
      case 'bestsellers': ids = await this._topSold(ctx.tab, 30, 'units'); break;
      case 'highly_ordered': ids = await this._topSold(ctx.tab, 90, 'orders'); break;
      case 'price_drops': ids = await this._priceDrops(ctx.tab); break;
      case 'new_arrivals': ids = await this._newest(ctx.tab); break;
      case 'order_again': ids = await this._pastOrders(ctx.userId); break;
      case 'missed': ids = (await this._pastOrders(ctx.userId)).filter((id) => !ctx.cart.has(id)); break;
      case 'brands_in_trend': ids = await this._trendingBrands(ctx.tab); break;
      case 'recommended': ids = await this._sameCategories(ctx); break;
      case 'wishlist': ids = await this._wishlist(ctx.userId); break;
      case 'budget': ids = await this._budget(ctx.tab, Number(rail.maxPrice) || 99); break;
      case 'manual': ids = toIds(rail.productIds); break;
      default: ids = [];
    }
    ctx.memo.set(memoKey, ids);
    return ids;
  }

  async _topSold(tab, days, by) {
    const since = new Date(Date.now() - days * DAY);
    const rows = await this.orderItems.model.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$productId', units: { $sum: '$quantity' }, orders: { $addToSet: '$orderId' } } },
      { $project: { units: 1, orders: { $size: '$orders' } } },
      { $sort: by === 'orders' ? { orders: -1, units: -1 } : { units: -1, orders: -1 } },
      { $limit: 200 },
    ]);
    const ids = rows.map((r) => String(r._id));
    return this._liveInTab(ids, tab);
  }

  async _priceDrops(tab) {
    const listings = await this.listings.findPublic(
      { marketplaceTab: tab, $expr: { $gt: ['$mrp', '$price'] } },
      { limit: 200, sort: { sortBoost: -1, publishedAt: -1 } }
    );
    return listings
      .map((l) => ({ id: String(l.productId), off: (l.mrp - l.price) / l.mrp }))
      .sort((a, b) => b.off - a.off)
      .map((x) => x.id);
  }

  async _newest(tab) {
    const listings = await this.listings.findPublic({ marketplaceTab: tab }, { limit: 60, sort: { publishedAt: -1, createdAt: -1 } });
    return listings.map((l) => String(l.productId));
  }

  async _budget(tab, maxPrice) {
    const listings = await this.listings.findPublic(
      { marketplaceTab: tab, price: { $lte: maxPrice } },
      { limit: 60, sort: { sortBoost: -1, price: 1 } }
    );
    return listings.map((l) => String(l.productId));
  }

  async _pastOrders(userId) {
    if (!userId || !isId(userId)) return [];
    const rows = await this.orderItems.find({ userId }, { limit: 200, sort: { createdAt: -1 } });
    return toIds(rows.map((r) => r.productId));
  }

  async _wishlist(userId) {
    if (!this.wishlist || !userId || !isId(userId)) return [];
    const rows = await this.wishlist.findByUser(userId, { limit: 60, sort: { createdAt: -1 } });
    return toIds(rows.map((r) => r.productId));
  }

  async _trendingBrands(tab) {
    const top = await this._source('bestsellers', {}, { tab, memo: new Map(), cart: new Set(), recent: [] });
    if (!top.length) return [];
    const products = await this.products.findPublic({ _id: { $in: top.slice(0, 50) } }, { limit: 50 });
    const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))].slice(0, 5);
    if (!brands.length) return [];
    const branded = await this.products.findPublic({ brand: { $in: brands } }, { limit: 100 });
    return this._liveInTab(branded.map((p) => String(p._id)), tab);
  }

  async _sameCategories(ctx) {
    if (!ctx.cart.size) return [];
    const inCart = await this.products.findPublic({ _id: { $in: [...ctx.cart] } }, { limit: 50 });
    const categoryIds = toIds(inCart.map((p) => p.categoryId));
    if (!categoryIds.length) return [];
    const similar = await this.products.findPublic({ categoryId: { $in: categoryIds } }, { limit: 100, sort: { rating: -1 } });
    return this._liveInTab(similar.map((p) => String(p._id)), ctx.tab);
  }

  /** Keep the given order, only products with a live listing in this tab. */
  async _liveInTab(productIds, tab) {
    const ids = toIds(productIds);
    if (!ids.length) return [];
    const listings = await this.listings.findPublic({ productId: { $in: ids }, marketplaceTab: tab }, { limit: ids.length * 2 });
    const live = new Set(listings.map((l) => String(l.productId)));
    return ids.filter((id) => live.has(id));
  }

  /** Product cards (with the tab's listing price) in the order given. */
  async _cards(productIds, ctx) {
    const ids = toIds(productIds).slice(0, ctx.limit * 3);
    if (!ids.length) return [];
    const [products, listings] = await Promise.all([
      this.products.findPublic({ _id: { $in: ids } }, { limit: ids.length }),
      this.listings.findPublic({ productId: { $in: ids }, marketplaceTab: ctx.tab }, { limit: ids.length * 3, sort: { price: 1 } }),
    ]);
    const productOf = new Map(products.map((p) => [String(p._id), p]));
    const listingOf = new Map();
    listings.forEach((l) => { if (!listingOf.has(String(l.productId))) listingOf.set(String(l.productId), l); });

    return ids
      .filter((id) => productOf.has(id) && listingOf.has(id))
      .filter((id) => (Number(productOf.get(id).stock) || 0) > 0)
      .map((id) => {
        const p = productOf.get(id);
        const l = listingOf.get(id);
        const image = Array.isArray(p.images) ? (p.images[0]?.url || p.images[0] || null) : null;
        return {
          id,
          productId: id,
          listingId: String(l._id),
          marketplaceTab: l.marketplaceTab,
          name: p.title,
          title: p.title,
          brand: p.brand || null,
          image: typeof image === 'string' ? image : null,
          price: l.price,
          mrp: l.mrp,
          stock: Number(p.stock) || 0,
          maxOrderQuantity: l.maxOrderQuantity || null,
        };
      });
  }
}

module.exports = { CartRecommendationService };
