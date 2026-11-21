/**
 * Admin-editable design of the three cart pages (Cart, Order Summary, Payment).
 *
 * Shape of the `cartDesign` platform setting:
 *   global  – style tokens used by every tab ('' / null = follow the tab theme)
 *   tabs    – per-tab overrides of those tokens: { quick_shop: { headerBg: '#…' } }
 *   pages   – for each page the ordered list of sections, each with
 *             enabled + its own style (bg, border, radius, padding, margins, title)
 *
 * Everything the storefront draws on those pages reads this, so an admin can
 * recolour, re-space, reorder and hide sections without a deploy. The defaults
 * below reproduce the standard look.
 */
const TABS = ['mithilakart', 'quick_shop', 'mithilak', 'groceries_fresh'];

const PAGE_SECTIONS = {
  cart: ['tabSwitcher', 'banner', 'address', 'items', 'freeDelivery', 'priceDetails', 'rails'],
  summary: ['address', 'freeDelivery', 'items', 'coupon', 'actions', 'bill', 'policy', 'trust', 'terms'],
  payment: ['coupons', 'methods', 'orderSummary', 'note'],
};

const COLOR_TOKENS = ['headerBg', 'headerText', 'pageBg', 'cardBg', 'cardBorder', 'headingColor', 'textColor', 'accent'];

// [min, max] for every numeric token.
const NUMBER_TOKENS = {
  cardRadius: [0, 32],
  buttonRadius: [0, 999],
  pagePaddingX: [0, 32],
  sectionGap: [0, 32],
  cardPadding: [0, 32],
  rowPaddingY: [0, 24],
};

const SECTION_NUMBERS = { padding: [0, 40], radius: [0, 40], marginTop: [0, 64], marginBottom: [0, 64] };
const SECTION_COLORS = ['bg', 'border'];

const DEFAULT_TOKENS = {
  headerBg: '',
  headerText: '',
  pageBg: '',
  cardBg: '',
  cardBorder: '',
  headingColor: '',
  textColor: '',
  accent: '',
  cardRadius: 12,
  buttonRadius: 999,
  pagePaddingX: 12,
  sectionGap: 8,
  cardPadding: 10,
  rowPaddingY: 8,
  cardShadow: true,
};

const COLOR_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const defaultSection = (key) => ({ key, enabled: true, style: {} });

const DEFAULT_CART_DESIGN = {
  global: { ...DEFAULT_TOKENS },
  tabs: {},
  pages: Object.fromEntries(Object.entries(PAGE_SECTIONS).map(([page, keys]) => [page, { sections: keys.map(defaultSection) }])),
};

const cleanColor = (v) => (typeof v === 'string' && COLOR_RE.test(v.trim()) ? v.trim() : '');
const cleanNumber = (v, [min, max], fallback) => {
  const n = Number(v);
  return v === '' || v === null || v === undefined || !Number.isFinite(n) ? fallback : Math.min(max, Math.max(min, Math.round(n)));
};
const cleanTitle = (v) => (typeof v === 'string' ? v.replace(/[<>]/g, '').trim().slice(0, 60) : '');

function normalizeTokens(raw = {}, { partial = false } = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const out = {};
  COLOR_TOKENS.forEach((k) => { if (!partial || k in src) out[k] = cleanColor(src[k]); });
  Object.entries(NUMBER_TOKENS).forEach(([k, range]) => {
    if (partial && !(k in src)) return;
    const n = cleanNumber(src[k], range, null);
    if (n !== null) out[k] = n; else if (!partial) out[k] = DEFAULT_TOKENS[k];
  });
  if (!partial || 'cardShadow' in src) out.cardShadow = src.cardShadow === undefined ? DEFAULT_TOKENS.cardShadow : Boolean(src.cardShadow);
  return out;
}

function normalizeSectionStyle(raw = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const out = {};
  SECTION_COLORS.forEach((k) => { const c = cleanColor(src[k]); if (c) out[k] = c; });
  Object.entries(SECTION_NUMBERS).forEach(([k, range]) => {
    const n = cleanNumber(src[k], range, null);
    if (n !== null) out[k] = n;
  });
  const title = cleanTitle(src.title);
  if (title) out.title = title;
  return out;
}

/**
 * Saved value -> complete, safe design. Unknown sections are dropped, sections
 * added to the code later are appended, order from the admin is kept.
 */
function normalizeCartDesign(saved) {
  const src = saved && typeof saved === 'object' ? saved : {};
  const tabs = {};
  TABS.forEach((t) => {
    const o = normalizeTokens(src.tabs?.[t], { partial: true });
    if (Object.keys(o).length) tabs[t] = o;
  });

  const pages = {};
  Object.entries(PAGE_SECTIONS).forEach(([page, allowed]) => {
    const list = Array.isArray(src.pages?.[page]?.sections) ? src.pages[page].sections : [];
    const seen = new Set();
    const sections = [];
    list.forEach((s) => {
      if (!s || !allowed.includes(s.key) || seen.has(s.key)) return;
      seen.add(s.key);
      sections.push({ key: s.key, enabled: s.enabled !== false, style: normalizeSectionStyle(s.style) });
    });
    allowed.forEach((key) => { if (!seen.has(key)) sections.push(defaultSection(key)); });
    pages[page] = { sections };
  });

  return { global: { ...DEFAULT_TOKENS, ...normalizeTokens(src.global, { partial: true }) }, tabs, pages };
}

module.exports = {
  TABS,
  PAGE_SECTIONS,
  COLOR_TOKENS,
  NUMBER_TOKENS,
  SECTION_NUMBERS,
  DEFAULT_TOKENS,
  DEFAULT_CART_DESIGN,
  normalizeCartDesign,
};
