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
  categoriesTree: (commerceFlow = 'all') => `cache:categories:tree:${commerceFlow}`,
  productDetail: (productId) => `cache:products:detail:${productId}`,
  homeSections: (commerceFlow = 'standard') => `cache:storefront:home:${commerceFlow}`,
  searchResults: (hash) => `cache:search:${hash}`,
};

const UPLOAD_CONTEXTS = {
  PRODUCT: 'products',
  CMS: 'cms',
  AVATAR: 'avatars',
};

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
};
