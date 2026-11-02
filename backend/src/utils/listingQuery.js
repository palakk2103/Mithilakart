/**
 * Shared sort / filter engine for marketplace-listing based product lists
 * (tab catalogue, search, nearby QuickShop). Everything here runs in database
 * queries (or, for sorts that depend on joined Product data, on the id-only
 * candidate set) BEFORE pagination, so `total`, page contents and ordering
 * always agree.
 *
 * Supported query params (all optional, invalid values are ignored):
 *   sort          price | -price | createdAt | -createdAt | rating | -rating |
 *                 popularity | -popularity | delivery | -delivery
 *   minPrice / maxPrice, minRating (0-5)
 *   discountOnly true|1 (mrp > price), productType veg|organic|fresh
 *   quickDelivery true|1  -> listing promises delivery within QUICK_DELIVERY_MAX_MINUTES
 */
const { DELIVERY_TYPE } = require('../constants/marketplace');
const { categoryMatchClause } = require('./productCategories');

const QUICK_DELIVERY_MAX_MINUTES = 30;
const CANDIDATE_CAP = 20000;
const SORT_FIELDS = ['price', 'createdAt', 'rating', 'popularity', 'delivery'];
const DEFAULT_SORT = { sortBoost: -1, price: 1, _id: 1 };

// Mirrors the storefront's existing Type chips (tag or title keyword).
const PRODUCT_TYPES = { veg: /veg/i, organic: /organic/i, fresh: /fresh/i };
const toBool = (v) => v === true || v === 'true' || v === '1' || v === 1;
const toNum = (v) => (v === undefined || v === null || v === '' ? null : (Number.isFinite(Number(v)) ? Number(v) : null));

function parseListingQuery(query = {}) {
  const raw = String(query.sort || '').trim();
  const dir = raw.startsWith('-') ? -1 : 1;
  const field = raw.replace(/^-/, '');
  const sortField = SORT_FIELDS.includes(field) ? field : null;

  const minPrice = toNum(query.minPrice);
  const maxPrice = toNum(query.maxPrice);
  const price = {};
  if (minPrice !== null && minPrice >= 0) price.$gte = minPrice;
  if (maxPrice !== null && maxPrice >= 0) price.$lte = maxPrice;

  const minRating = toNum(query.minRating);
  return {
    sortField,
    dir,
    price: Object.keys(price).length ? price : null,
    minRating: minRating !== null && minRating > 0 ? Math.min(minRating, 5) : 0,
    quickDelivery: toBool(query.quickDelivery),
    discountOnly: toBool(query.discountOnly),
    productType: PRODUCT_TYPES[String(query.productType || '').toLowerCase()] ? String(query.productType).toLowerCase() : null,
  };
}

/** Fixed-promise listings within the quick window (+ optional seller ids whose computed ETA qualifies). */
function quickDeliveryCondition(fastSellerIds = []) {
  const fixed = {
    deliveryType: DELIVERY_TYPE.FIXED_PROMISE,
    deliveryPromiseMinutes: { $ne: null, $lte: QUICK_DELIVERY_MAX_MINUTES },
  };
  if (!fastSellerIds.length) return fixed;
  return {
    $or: [
      fixed,
      { deliveryPromiseMinutes: null, sellerId: { $in: fastSellerIds } },
    ],
  };
}

/**
 * Ids of public, in-stock products matching the product-level conditions.
 * Out-of-stock rule (stock - reservedStock > 0) is preserved here so counts match.
 */
async function resolveProductIds(productRepo, { categoryIds, minRating, productType, sellerIds, restrictIds, select = '_id', keep = null } = {}) {
  const filter = {
    $expr: { $gt: [{ $subtract: [{ $ifNull: ['$stock', 0] }, { $ifNull: ['$reservedStock', 0] }] }, 0] },
  };
  if (categoryIds) filter.$and = [categoryMatchClause(categoryIds)];
  if (minRating > 0) filter.rating = { $gte: minRating };
  if (productType && PRODUCT_TYPES[productType]) {
    filter.$or = [{ tags: PRODUCT_TYPES[productType] }, { title: PRODUCT_TYPES[productType] }];
  }
  if (sellerIds) filter.sellerId = { $in: sellerIds };
  if (restrictIds) filter._id = { $in: restrictIds };
  const rows = await productRepo.findPublic(filter, { select, limit: CANDIDATE_CAP });
  return (keep ? rows.filter(keep) : rows).map((p) => p._id);
}

/**
 * Runs the listing query with sort + pagination applied in the database where
 * possible. `deliveryMinutesOf(listing)` supplies the effective ETA for the
 * 'delivery' sort (fixed promise, or seller-distance estimate for nearby).
 *
 * `relevanceOf(listing)` (search only) ranks the default ordering by match score.
 *
 * Returns { listings, total }.
 */
async function runListingQuery({ listingRepo, productRepo, filter, parsed, pagination, deliveryMinutesOf, relevanceOf }) {
  const { sortField, dir } = parsed;
  const dbSorts = {
    price: { price: dir, _id: 1 },
    createdAt: { publishedAt: dir, _id: dir },
  };

  // Search with default ordering: rank by text relevance (best match first), then price.
  if (!sortField && relevanceOf) {
    const cands = await listingRepo.findPublic(filter, {
      select: '_id productId price',
      sort: { _id: 1 },
      limit: CANDIDATE_CAP,
    });
    const ranked = cands
      .map((l) => ({ id: l._id, r: relevanceOf(l), price: Number(l.price) || 0 }))
      .sort((a, b) => b.r - a.r || a.price - b.price || String(a.id).localeCompare(String(b.id)));
    const ids = ranked.slice(pagination.skip, pagination.skip + pagination.limit).map((x) => x.id);
    const rows = ids.length ? await listingRepo.findPublic({ _id: { $in: ids } }, { limit: ids.length }) : [];
    const map = new Map(rows.map((l) => [String(l._id), l]));
    return { listings: ids.map((id) => map.get(String(id))).filter(Boolean), total: ranked.length };
  }

  if (!sortField || dbSorts[sortField]) {
    const [listings, total] = await Promise.all([
      listingRepo.findPublic(filter, {
        sort: dbSorts[sortField] || DEFAULT_SORT, // _id tiebreaker => stable skip/limit batches
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      listingRepo.countPublic(filter),
    ]);
    return { listings, total };
  }

  // rating / popularity / delivery: rank the id-only candidate set, then slice the page.
  const candidates = await listingRepo.findPublic(filter, {
    select: '_id productId price sellerId deliveryPromiseMinutes',
    sort: { _id: 1 },
    limit: CANDIDATE_CAP,
  });
  const total = candidates.length;

  let score;
  if (sortField === 'delivery') {
    score = (l) => (deliveryMinutesOf ? deliveryMinutesOf(l) : l.deliveryPromiseMinutes) ?? 9999;
  } else {
    const pRows = await productRepo.findPublic(
      { _id: { $in: [...new Set(candidates.map((l) => l.productId))] } },
      { select: '_id rating reviewCount', limit: CANDIDATE_CAP }
    );
    const pMap = new Map(pRows.map((p) => [String(p._id), p]));
    score = (l) => {
      const p = pMap.get(String(l.productId));
      const rating = Number(p?.rating) || 0;
      const reviews = Number(p?.reviewCount) || 0;
      return sortField === 'rating' ? rating * 1e6 + reviews : reviews * 10 + rating;
    };
  }
  const scored = candidates.map((l) => ({ id: l._id, s: score(l) }));
  scored.sort((a, b) => (dir === -1 ? b.s - a.s : a.s - b.s) || String(a.id).localeCompare(String(b.id)));
  const pageIds = scored.slice(pagination.skip, pagination.skip + pagination.limit).map((x) => x.id);
  const full = pageIds.length ? await listingRepo.findPublic({ _id: { $in: pageIds } }, { limit: pageIds.length }) : [];
  const byId = new Map(full.map((l) => [String(l._id), l]));
  return { listings: pageIds.map((id) => byId.get(String(id))).filter(Boolean), total };
}

module.exports = {
  QUICK_DELIVERY_MAX_MINUTES,
  parseListingQuery,
  quickDeliveryCondition,
  resolveProductIds,
  runListingQuery,
};
