const COMMERCE_FLOWS = {
  STANDARD: 'standard',
  MITHILAK: 'mithilak',
  QUICK_SHOP: 'quick_shop',
  FRESH_GROCERY: 'fresh_grocery',
};

const COMMERCE_FLOW_VALUES = Object.values(COMMERCE_FLOWS);

const PRODUCT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const PRODUCT_STATUS_VALUES = Object.values(PRODUCT_STATUS);

const HOME_SECTION_KEYS = [
  'trending-this-week',
  'todays-special-deals',
  'top-selection',
  'brands-in-spotlight',
  'spotlight',
  'best-quality-guaranteed',
  'best-quality',
  'still-looking',
  'keep-shopping',
];

const LEGAL_PAGE_TYPES = {
  TERMS: 'terms',
  PRIVACY: 'privacy',
  SHIPPING: 'shipping',
  CANCELLATION: 'cancellation',
};

const LEGAL_PAGE_TYPE_VALUES = Object.values(LEGAL_PAGE_TYPES);

const CACHE_TTL = {
  CATEGORIES_TREE: 3600,
  PRODUCT_DETAIL: 300,
  HOME_SECTIONS: 900,
  SEARCH_RESULTS: 120,
};

const CACHE_KEYS = {
  categoriesTree: (commerceFlow = 'all', lang = 'en') => `cache:categories:tree:${commerceFlow}:${lang}`,
  productDetail: (productId, lang = 'en') => `cache:products:detail:${productId}:${lang}`,
  homeSections: (commerceFlow = 'standard', lang = 'en') => `cache:storefront:home:${commerceFlow}:${lang}`,
  searchResults: (hash, lang = 'en') => `cache:search:${hash}:${lang}`,
};

const UPLOAD_CONTEXTS = {
  PRODUCT: 'products',
  CMS: 'cms',
  AVATAR: 'avatars',
  REVIEW: 'reviews',
};

// Safe allowlist of react-icons identifiers an Admin may assign to a header
// category chip. Keys here must exactly match the keys in
// frontend/src/shared/constants/headerChipIcons.js — never execute or import
// an icon name received from the database/client directly.
const HEADER_CHIP_ICON_KEYS = [
  'shop',
  'fashion',
  'electronics',
  'grocery',
  'home',
  'beauty',
  'sports',
  'toys',
  'jewellery',
  'stationery',
  'gifting',
  'electrical',
  'mobile',
  'laptop',
  'camera',
  'books',
  'pets',
  'furniture',
  'baby',
  'health',
  'music',
  'food',
  'shoes',
  'bags',
  'watches',
  'appliances',
  'tools',
  'garden',
  'automotive',
  'gaming',
  'art',
  'fitness',
  'kids',
];

module.exports = {
  COMMERCE_FLOWS,
  COMMERCE_FLOW_VALUES,
  PRODUCT_STATUS,
  PRODUCT_STATUS_VALUES,
  HOME_SECTION_KEYS,
  LEGAL_PAGE_TYPES,
  LEGAL_PAGE_TYPE_VALUES,
  CACHE_TTL,
  CACHE_KEYS,
  UPLOAD_CONTEXTS,
  HEADER_CHIP_ICON_KEYS,
};
