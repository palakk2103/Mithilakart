/**
 * Product search matching + relevance ranking (MongoDB regex, no extra infra).
 *
 * Every word the customer types must match the product (AND semantics) on a
 * word PREFIX of title / brand / tags, or on the product's category (name match,
 * including its sub-categories). So "sams" finds Samsung, "samsung mobile"
 * needs both words, and "rice" no longer drags in unrelated products that only
 * mention rice in a long description.
 *
 * Results are ranked: exact title > title starts with the phrase > phrase in
 * title > per-word title / brand / tag / category hits.
 */
const { categoryMatchClause } = require('./productCategories');

const MAX_TERM_LENGTH = 100;
const MAX_TOKENS = 8;
const MATCH_CAP = 5000;
const MAX_CATEGORIES_PER_TOKEN = 40;

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Trim, collapse whitespace, lowercase, cap length. */
function normalizeTerm(raw) {
  return String(raw ?? '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, MAX_TERM_LENGTH);
}

function tokenize(raw) {
  const words = normalizeTerm(raw).split(/[\s,]+/).filter(Boolean);
  return [...new Set(words)].slice(0, MAX_TOKENS);
}

// Everyday shopper words that the catalogue spells differently.
const SYNONYMS = {
  mobile: ['smartphone', 'phone'],
  mobiles: ['smartphone', 'phone'],
  phone: ['smartphone', 'mobile'],
  phones: ['smartphone', 'mobile'],
  tv: ['television'],
  television: ['tv'],
};

/** Word-prefix regex: token (or a synonym) at start of string or right after a separator. */
const wordStart = (tok) => {
  const alts = [tok, ...(SYNONYMS[tok] || [])].map(escapeRegex).join('|');
  return new RegExp(`(?:^|[\\s\\-/,(&])(?:${alts})`, 'i');
};

/** All category ids at or below `rootIds` (one query per tree level, not per root). */
async function subtreeIds(categoryRepository, rootIds) {
  const seen = new Set(rootIds.map(String));
  let frontier = [...rootIds];
  while (frontier.length) {
    const kids = await categoryRepository.find(
      { deletedAt: null, $or: [{ parentId: { $in: frontier } }, { parentIds: { $in: frontier } }] },
      { select: '_id' }
    );
    frontier = kids.filter((c) => !seen.has(String(c._id))).map((c) => c._id);
    frontier.forEach((id) => seen.add(String(id)));
  }
  return [...seen];
}

/** token -> category ids (incl. sub-categories) whose name has a word starting with that token. */
async function resolveCategoryHits(categoryRepository, tokens) {
  const hits = new Map();
  if (!categoryRepository) return hits;
  await Promise.all(tokens.map(async (tok) => {
    try {
      const cats = await categoryRepository.find(
        { deletedAt: null, isActive: true, name: wordStart(tok) },
        { select: '_id', limit: MAX_CATEGORIES_PER_TOKEN }
      );
      if (cats.length) hits.set(tok, await subtreeIds(categoryRepository, cats.map((c) => c._id)));
    } catch { /* category match is an enhancement; never fail the search */ }
  }));
  return hits;
}

function tokenClause(tok, categoryHits) {
  const rx = wordStart(tok);
  const or = [{ title: rx }, { brand: rx }, { tags: rx }];
  if (categoryHits.has(tok)) or.push(categoryMatchClause(categoryHits.get(tok)));
  return { $or: or };
}

/** Every word must match (AND). */
function buildMatchFilter(tokens, categoryHits) {
  return { $and: tokens.map((tok) => tokenClause(tok, categoryHits)) };
}

function scoreProduct(p, phrase, tokens, categoryHits) {
  const title = String(p.title || '').toLowerCase();
  const brand = String(p.brand || '').toLowerCase();
  const tags = (p.tags || []).map((t) => String(t).toLowerCase());
  const cats = new Set([p.categoryId, ...(p.categoryIds || [])].filter(Boolean).map(String));

  let score = 0;
  if (title === phrase) score += 1000;
  else if (title.startsWith(phrase)) score += 500;
  else if (title.includes(phrase)) score += 300;

  for (const tok of tokens) {
    const rx = wordStart(tok);
    if (rx.test(title)) score += title.startsWith(tok) ? 60 : 40;
    if (rx.test(brand)) score += 30;
    if (tags.some((t) => rx.test(t))) score += 20;
    const ids = categoryHits.get(tok);
    if (ids && ids.some((id) => cats.has(id))) score += 10;
  }
  return score;
}

/**
 * Ranked product matches for a search term.
 * @returns {Promise<Array<{_id, score:number}>>} best first; [] when nothing matches / blank term.
 */
async function findRankedMatches({ productRepository, categoryRepository, term, baseFilter = {}, cap = MATCH_CAP }) {
  const phrase = normalizeTerm(term);
  const tokens = tokenize(term);
  if (!tokens.length) return [];

  const categoryHits = await resolveCategoryHits(categoryRepository, tokens);
  const select = '_id title brand tags categoryId categoryIds createdAt';
  const rows = await productRepository.findPublic(
    { ...baseFilter, ...buildMatchFilter(tokens, categoryHits) },
    { select, limit: cap }
  );

  return rows
    .map((p) => ({ _id: p._id, score: scoreProduct(p, phrase, tokens, categoryHits), t: p.createdAt ? +new Date(p.createdAt) : 0 }))
    .sort((a, b) => b.score - a.score || b.t - a.t || String(a._id).localeCompare(String(b._id)))
    .map(({ _id, score }) => ({ _id, score }));
}

module.exports = { normalizeTerm, tokenize, findRankedMatches, MATCH_CAP };
