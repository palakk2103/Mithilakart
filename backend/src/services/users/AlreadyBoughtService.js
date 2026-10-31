const mongoose = require('mongoose');
const { BaseService } = require('../../core/BaseService');
const { ORDER_STATUS } = require('../../constants/commerce');
const { RETURN_STATUS } = require('../../constants/pricing');
const { PRODUCT_STATUS } = require('../../constants/catalog');
const { LISTING_STATUS } = require('../../constants/marketplace');

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 24;

// Returns that have been accepted (or paid out) take the units out of "bought".
// Requested / rejected / cancelled returns leave the purchase intact.
const EFFECTIVE_RETURN_STATUSES = [
  RETURN_STATUS.SELLER_APPROVED,
  RETURN_STATUS.ADMIN_APPROVED,
  RETURN_STATUS.REFUNDED,
];

const toId = (v) => (v ? String(v) : null);

class AlreadyBoughtService extends BaseService {
  constructor({ orderItemModel, productModel, listingModel, variantModel }) {
    super();
    this.OrderItem = orderItemModel;
    this.Product = productModel;
    this.Listing = listingModel;
    this.Variant = variantModel;
  }

  /**
   * Distinct products the customer has actually bought, newest purchase first.
   * `userId` must come from the verified token, never from the request.
   */
  async list(userId, { page = 1, limit = DEFAULT_LIMIT } = {}) {
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const uid = new mongoose.Types.ObjectId(String(userId));

    const [agg] = await this.OrderItem.aggregate([
      { $match: { userId: uid, deletedAt: null } },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order',
        },
      },
      { $unwind: '$order' },
      {
        $match: {
          'order.userId': uid,
          'order.status': { $ne: ORDER_STATUS.CANCELLED },
          'order.paymentStatus': { $nin: ['failed', 'refunded'] },
          // A still-pending order only counts once it is paid or is cash-on-delivery;
          // abandoned online-payment attempts must not show up as purchases.
          $or: [
            { 'order.status': { $ne: ORDER_STATUS.PENDING } },
            { 'order.paymentStatus': 'paid' },
            { 'order.paymentMethod': 'cod' },
          ],
        },
      },
      {
        $lookup: {
          from: 'returns',
          let: { itemId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$orderItemId', '$$itemId'] },
                status: { $in: EFFECTIVE_RETURN_STATUSES },
                deletedAt: null,
              },
            },
            { $group: { _id: null, qty: { $sum: '$quantity' } } },
          ],
          as: 'returned',
        },
      },
      {
        $addFields: {
          netQty: { $subtract: ['$quantity', { $ifNull: [{ $arrayElemAt: ['$returned.qty', 0] }, 0] }] },
        },
      },
      { $match: { netQty: { $gt: 0 } } },
      // Drop deleted / unapproved products here so pagination totals stay accurate.
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          pipeline: [
            { $match: { deletedAt: null, status: PRODUCT_STATUS.APPROVED } },
            { $project: { _id: 1 } },
          ],
          as: 'liveProduct',
        },
      },
      { $match: { 'liveProduct.0': { $exists: true } } },
      { $sort: { 'order.createdAt': -1 } },
      {
        $group: {
          _id: { productId: '$productId', variantId: '$variantId' },
          listingId: { $first: '$listingId' },
          marketplaceTab: { $first: '$order.marketplaceTab' },
          commerceFlow: { $first: '$order.commerceFlow' },
          lastPurchasedAt: { $first: '$order.createdAt' },
          orderIds: { $addToSet: '$orderId' },
        },
      },
      { $addFields: { timesBought: { $size: '$orderIds' } } },
      { $project: { orderIds: 0 } },
      { $sort: { lastPurchasedAt: -1, '_id.productId': 1 } },
      {
        $facet: {
          rows: [{ $skip: (safePage - 1) * safeLimit }, { $limit: safeLimit }],
          total: [{ $count: 'n' }],
        },
      },
    ]);

    const rows = agg?.rows || [];
    const total = agg?.total?.[0]?.n || 0;
    const items = await this._hydrate(rows);

    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        hasMore: safePage * safeLimit < total,
      },
    };
  }

  async _hydrate(rows) {
    if (!rows.length) return [];

    const productIds = [...new Set(rows.map((r) => toId(r._id.productId)))];
    const variantIds = rows.map((r) => r._id.variantId).filter(Boolean);
    const listingIds = rows.map((r) => r.listingId).filter(Boolean);

    // Three batched reads for the whole page — no per-row queries.
    const [products, variants, listings] = await Promise.all([
      this.Product.find({ _id: { $in: productIds }, deletedAt: null }).lean(),
      variantIds.length
        ? this.Variant.find({ _id: { $in: variantIds }, deletedAt: null }).lean()
        : [],
      this.Listing.find({
        deletedAt: null,
        $or: [{ _id: { $in: listingIds } }, { productId: { $in: productIds } }],
      }).lean(),
    ]);

    const productById = new Map(products.map((p) => [toId(p._id), p]));
    const variantById = new Map(variants.map((v) => [toId(v._id), v]));
    const listingById = new Map(listings.map((l) => [toId(l._id), l]));
    const listingByProductTab = new Map(listings.map((l) => [`${toId(l.productId)}:${l.marketplaceTab}`, l]));

    const items = [];
    for (const row of rows) {
      const productId = toId(row._id.productId);
      const product = productById.get(productId);
      // Deleted or no-longer-approved products are not offered again.
      if (!product || product.status !== PRODUCT_STATUS.APPROVED) continue;

      const variant = row._id.variantId ? variantById.get(toId(row._id.variantId)) : null;
      if (row._id.variantId && (!variant || variant.isActive === false)) continue;

      let listing = row.listingId ? listingById.get(toId(row.listingId)) : null;
      if (!listing && row.marketplaceTab) {
        listing = listingByProductTab.get(`${productId}:${row.marketplaceTab}`) || null;
      }
      const listingLive = listing
        && listing.listingStatus === LISTING_STATUS.APPROVED
        && listing.isVisible;
      // Listing-based purchases need a live listing; otherwise skip.
      if ((row.listingId || listing) && !listingLive) continue;

      // Current — not historical — pricing and stock.
      const price = listingLive ? listing.price : (variant?.price ?? product.price);
      const mrp = listingLive ? listing.mrp : (variant?.mrp ?? product.mrp);
      const stock = variant
        ? variant.stock
        : Math.max((product.stock || 0) - (product.reservedStock || 0), 0);
      const images = [...(product.images || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

      items.push({
        productId,
        listingId: listingLive ? toId(listing._id) : null,
        variantId: variant ? toId(variant._id) : null,
        variantName: variant?.name || null,
        marketplaceTab: listingLive ? listing.marketplaceTab : (row.marketplaceTab || null),
        commerceFlow: row.commerceFlow || null,
        title: product.title,
        brand: product.brand || '',
        image: images[0]?.url || null,
        price,
        mrp,
        discountPercent: mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0,
        rating: product.rating || 0,
        inStock: stock > 0,
        stock,
        maxOrderQuantity: listingLive ? listing.maxOrderQuantity : null,
        lastPurchasedAt: row.lastPurchasedAt,
        timesBought: row.timesBought,
      });
    }
    return items;
  }
}

module.exports = { AlreadyBoughtService, DEFAULT_LIMIT, MAX_LIMIT };
