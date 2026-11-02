/**
 * Product -> category assignment helpers.
 *
 * A product keeps ONE primary `categoryId` (legacy, required) and an optional
 * list of ADDITIONAL `categoryIds`. A product is listed under a category when
 * either field matches, but it stays a single Product record (same id, price,
 * stock), so it can never appear twice in one listing.
 */

/** Filter clause matching products assigned (primary or additional) to any of `ids`. */
function categoryMatchClause(ids) {
  const list = Array.isArray(ids) ? ids : [ids];
  return { $or: [{ categoryId: { $in: list } }, { categoryIds: { $in: list } }] };
}

/** Adds the category clause to `filter` via $and so it never clobbers an existing $or (search, product type). */
function withCategoryMatch(filter, ids) {
  const next = { ...filter };
  next.$and = [...(next.$and || []), categoryMatchClause(ids)];
  return next;
}

/** Unique string ids, preserving order; drops empties and the primary id. */
function normalizeAdditionalCategoryIds(input, primaryId = null) {
  if (!Array.isArray(input)) return [];
  const seen = new Set(primaryId ? [String(primaryId)] : []);
  const out = [];
  for (const raw of input) {
    const id = String(raw?._id || raw?.id || raw || '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

module.exports = { categoryMatchClause, withCategoryMatch, normalizeAdditionalCategoryIds };
