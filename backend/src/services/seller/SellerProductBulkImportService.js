const { AppError } = require('../../utils/AppError');
const {
  MARKETPLACE_TABS,
  MARKETPLACE_TAB_VALUES,
  QUICK_COMMERCE_TABS,
  DELIVERY_PROMISE_MINUTES,
} = require('../../constants/marketplace');
const { normalizeMarketplaceTab, legacyFlowsForTabs } = require('../../utils/marketplaceTab');
const {
  cleanString,
  isBlank,
  parseNumber,
  isValidMediaUrl,
  splitList,
  lowerKey,
} = require('../../utils/bulkImport');

const MAX_ROWS = 500;
const MAX_IMAGES = 10;
/** Placeholder the seller panel uses for image files it uploads only on confirm. */
const PENDING_UPLOAD_PREFIX = '/pending-upload/';

const TAB_LABELS = {
  [MARKETPLACE_TABS.MITHILAKART]: 'Mithilakart',
  [MARKETPLACE_TABS.MITHILAK]: 'Mithilak',
  [MARKETPLACE_TABS.QUICK_SHOP]: 'Quick Shop',
  [MARKETPLACE_TABS.GROCERIES_FRESH]: 'Groceries & Fresh',
};

/** Accepts canonical keys, legacy flows and the labels customers see. */
const TAB_ALIASES = {
  ...Object.fromEntries(Object.entries(TAB_LABELS).map(([tab, label]) => [lowerKey(label), tab])),
  'groceries and fresh': MARKETPLACE_TABS.GROCERIES_FRESH,
  groceries: MARKETPLACE_TABS.GROCERIES_FRESH,
  grocery: MARKETPLACE_TABS.GROCERIES_FRESH,
  fresh: MARKETPLACE_TABS.GROCERIES_FRESH,
  'quick shop': MARKETPLACE_TABS.QUICK_SHOP,
  quickshop: MARKETPLACE_TABS.QUICK_SHOP,
};

function parseTab(value) {
  const key = lowerKey(value);
  return TAB_ALIASES[key] || normalizeMarketplaceTab(key.replace(/\s+/g, '_'));
}

/** Accepts an array (already split by the seller panel) or a delimited cell. */
function toList(value) {
  if (Array.isArray(value)) return value.map(cleanString).filter(Boolean);
  return splitList(value, /[|\n]|,(?=\s*(?:https?:\/\/|\/))/);
}

/**
 * Seller bulk product upload (CSV / Excel parsed in the browser).
 *
 * One row = one product. Rows are matched to the seller's existing products by
 * SKU: a known SKU is updated, a new one is created — so re-uploading a sheet
 * with new prices/stock is safe. Run with dryRun=true for the preview; the
 * commit call re-validates every row before writing.
 */
class SellerProductBulkImportService {
  constructor({ sellerProductService, productRepository, categoryRepository, categoryService, sellerRepository }) {
    this.sellerProductService = sellerProductService;
    this.productRepository = productRepository;
    this.categoryRepository = categoryRepository;
    this.categoryService = categoryService;
    this.sellerRepository = sellerRepository;
  }

  async import(sellerId, { rows, dryRun = true }) {
    if (!Array.isArray(rows) || rows.length === 0) throw AppError.validation('The sheet has no rows');
    if (rows.length > MAX_ROWS) throw AppError.validation(`Upload at most ${MAX_ROWS} products per sheet`);

    const context = await this._loadContext(sellerId);
    const seenSkus = new Map();
    const planned = rows.map((raw, index) => this._planRow(raw, index, context, seenSkus, dryRun));

    if (!dryRun) {
      for (const row of planned) {
        if (row.status !== 'ok') continue;
        await this._commitRow(sellerId, row);
      }
    }

    const count = (predicate) => planned.filter(predicate).length;
    return {
      dryRun: Boolean(dryRun),
      summary: {
        totalRows: planned.length,
        validRows: count((r) => r.status === 'ok'),
        errorRows: count((r) => r.status === 'error'),
        skippedRows: count((r) => r.status === 'skipped'),
        toCreate: count((r) => r.status === 'ok' && r.action === 'create'),
        toUpdate: count((r) => r.status === 'ok' && r.action === 'update'),
      },
      rows: planned.map(({ payload: _payload, existingId: _existingId, listingOptions: _options, ...row }) => row),
    };
  }

  async _loadContext(sellerId) {
    const [categories, seller, existingProducts] = await Promise.all([
      this.categoryRepository.findActive({ isActive: true }),
      this.sellerRepository ? this.sellerRepository.findById(sellerId) : null,
      this.productRepository.find({ sellerId, deletedAt: null }, { select: '_id sku' }),
    ]);

    const effective = this.categoryService.effectiveTabsMap(categories);
    const byId = new Map(categories.map((c) => [String(c._id), c]));
    const roots = new Map();
    const children = new Map();
    const childrenByName = new Map();
    categories.forEach((cat) => {
      if (!effective.get(String(cat._id))) return; // orphaned subtree
      const nameKey = lowerKey(cat.name);
      if (!cat.parentId) {
        if (!roots.has(nameKey)) roots.set(nameKey, cat);
        return;
      }
      children.set(`${cat.parentId}|${nameKey}`, cat);
      childrenByName.set(nameKey, [...(childrenByName.get(nameKey) || []), cat]);
    });

    return {
      roots,
      children,
      childrenByName,
      byId,
      effective,
      hasStoreLocation: seller?.latitude != null && seller?.longitude != null,
      skuToId: new Map(existingProducts.map((p) => [lowerKey(p.sku), String(p._id)])),
    };
  }

  _planRow(raw = {}, index, context, seenSkus, dryRun) {
    const row = {
      rowNumber: index + 2,
      title: cleanString(raw.title),
      sku: cleanString(raw.sku),
      price: null,
      mrp: null,
      stock: null,
      categoryPath: null,
      categoryId: null,
      tabs: [],
      imageUrls: [],
      action: null,
      status: 'ok',
      errors: [],
      warnings: [],
    };

    if (Object.values(raw).every((v) => (Array.isArray(v) ? v.length === 0 : isBlank(v)))) {
      row.status = 'skipped';
      row.warnings.push('Empty row');
      return row;
    }

    const err = (message) => row.errors.push(message);

    if (row.title.length < 2 || row.title.length > 200) err('Title is required (2–200 characters)');

    if (!row.sku) {
      err('SKU is required — it is how re-uploads update an existing product');
    } else {
      const skuKey = lowerKey(row.sku);
      if (seenSkus.has(skuKey)) err(`SKU repeats row ${seenSkus.get(skuKey)}`);
      else seenSkus.set(skuKey, row.rowNumber);
    }

    const price = parseNumber(raw.price);
    const mrpRaw = parseNumber(raw.mrp);
    const stock = parseNumber(raw.stock);
    if (price === null || Number.isNaN(price) || price < 0) err('Selling price must be a number ≥ 0');
    else row.price = price;
    if (Number.isNaN(mrpRaw) || (mrpRaw !== null && mrpRaw < 0)) err('MRP must be a number ≥ 0');
    else row.mrp = mrpRaw ?? row.price;
    if (row.price !== null && row.mrp !== null && row.price > row.mrp) err('Selling price cannot be higher than MRP');
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) err('Stock must be a whole number ≥ 0');
    else row.stock = stock ?? 0;

    row.tabs = this._parseTabs(raw.tabs, err);
    this._resolveCategory(raw, row, context, err);

    const quick = row.tabs.filter((t) => QUICK_COMMERCE_TABS.has(t));
    if (quick.length && !context.hasStoreLocation) {
      err('Set your store location in Settings before listing in Quick Shop / Groceries & Fresh');
    }

    let deliveryPromiseMinutes = null;
    const promise = parseNumber(raw.deliveryPromiseMinutes);
    if (promise !== null) {
      if (!DELIVERY_PROMISE_MINUTES.includes(promise)) {
        err(`Delivery promise must be one of ${DELIVERY_PROMISE_MINUTES.join(', ')} minutes`);
      } else if (!quick.length) {
        row.warnings.push('Delivery promise is only used for Quick Shop / Groceries & Fresh — ignored');
      } else {
        deliveryPromiseMinutes = promise;
      }
    }

    const media = this._parseMedia(raw, row, err, dryRun);
    const attributes = this._parseAttributes(raw, row, err, quick.length > 0);

    if (row.errors.length) {
      row.status = 'error';
      return row;
    }

    row.existingId = context.skuToId.get(lowerKey(row.sku)) || null;
    row.action = row.existingId ? 'update' : 'create';
    row.listingOptions = deliveryPromiseMinutes ? { deliveryPromiseMinutes } : {};
    row.payload = {
      title: row.title,
      description: cleanString(raw.description),
      sku: row.sku,
      price: row.price,
      mrp: row.mrp,
      stock: row.stock,
      categoryId: row.categoryId,
      brand: cleanString(raw.brand),
      tags: splitList(raw.tags, /[,|]/),
      images: media.images,
      videos: media.videos,
      attributes,
      commerceFlows: legacyFlowsForTabs(row.tabs),
    };
    return row;
  }

  _parseTabs(value, err) {
    const parts = splitList(value, /[,|\n]/);
    if (!parts.length) return [MARKETPLACE_TABS.MITHILAKART];
    const tabs = [];
    parts.forEach((part) => {
      const tab = parseTab(part);
      if (!tab) err(`Unknown tab "${part}" — use ${MARKETPLACE_TAB_VALUES.join(', ')}`);
      else if (!tabs.includes(tab)) tabs.push(tab);
    });
    return tabs;
  }

  _resolveCategory(raw, row, context, err) {
    const categoryName = cleanString(raw.category);
    const subName = cleanString(raw.subcategory);
    if (!categoryName) {
      err('Category is required');
      return;
    }

    let category = null;
    const root = context.roots.get(lowerKey(categoryName));
    if (root && subName) {
      category = context.children.get(`${root._id}|${lowerKey(subName)}`);
      if (!category) err(`Subcategory "${subName}" not found under "${root.name}"`);
    } else if (root) {
      category = root;
    } else {
      // Allow the subcategory name alone in the Category column when unambiguous.
      const matches = context.childrenByName.get(lowerKey(categoryName)) || [];
      if (matches.length === 1) category = matches[0];
      else if (matches.length > 1) err(`"${categoryName}" exists under several categories — fill in both Category and Subcategory`);
      else err(`Category "${categoryName}" not found — ask admin to add it, or check the spelling`);
    }
    if (!category) return;

    const parent = category.parentId ? context.byId.get(String(category.parentId)) : null;
    row.categoryId = String(category._id);
    row.categoryPath = parent ? `${parent.name} › ${category.name}` : category.name;

    const visibleTabs = context.effective.get(String(category._id)) || [];
    const hidden = row.tabs.filter((t) => !visibleTabs.includes(t));
    if (hidden.length) {
      err(`"${row.categoryPath}" is not shown in ${hidden.map((t) => TAB_LABELS[t]).join(', ')} — remove that tab or pick a category enabled there`);
    }
  }

  _parseMedia(raw, row, err, dryRun) {
    const collect = (value, label) => {
      const urls = toList(value);
      urls.forEach((url) => {
        if (!isValidMediaUrl(url)) {
          err(`${label} "${url}" is not a URL — attach the file in the upload screen or use an https:// link`);
        } else if (!dryRun && url.startsWith(PENDING_UPLOAD_PREFIX)) {
          err(`${label} "${url.slice(PENDING_UPLOAD_PREFIX.length)}" was not uploaded`);
        }
      });
      return urls;
    };

    const imageUrls = collect(raw.imageUrls, 'Image');
    const videoUrls = collect(raw.videoUrls, 'Video');
    if (imageUrls.length > MAX_IMAGES) err(`At most ${MAX_IMAGES} images per product`);
    if (!imageUrls.length) row.warnings.push('No images — the product will show a placeholder');
    row.imageUrls = imageUrls;

    const toMedia = (urls) => urls.map((url, sortOrder) => ({ url, alt: row.title, sortOrder }));
    return { images: toMedia(imageUrls), videos: toMedia(videoUrls) };
  }

  _parseAttributes(raw, row, err, hasQuickTab) {
    const attributes = {};

    const specs = cleanString(raw.specifications);
    if (specs) {
      specs.split(/[;\n]/).map((s) => s.trim()).filter(Boolean).forEach((pair) => {
        const idx = pair.indexOf(':');
        if (idx <= 0) {
          err(`Specification "${pair}" must look like "Key: Value"`);
          return;
        }
        attributes[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
      });
    }

    const radius = parseNumber(raw.serviceableRadiusKm);
    if (radius !== null) {
      if (Number.isNaN(radius) || radius <= 0) err('Serviceable radius must be a number > 0 (km)');
      else if (hasQuickTab) attributes.serviceableRadius = radius;
    }

    const weight = parseNumber(raw.weightKg);
    if (weight !== null) {
      if (Number.isNaN(weight) || weight < 0) err('Weight must be a number ≥ 0 (kg)');
      else attributes.weight = weight;
    }

    const dims = cleanString(raw.dimensionsCm);
    if (dims) {
      const parts = dims.toLowerCase().split(/\s*[x×*]\s*/).map(Number);
      if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n) || n < 0)) {
        err('Dimensions must look like 20x10x5 (L x W x H in cm)');
      } else {
        attributes.dimensions = { length: parts[0], width: parts[1], height: parts[2] };
      }
    }

    const estimate = cleanString(raw.deliveryEstimate);
    if (estimate) attributes.deliveryEstimate = estimate;

    return attributes;
  }

  async _commitRow(sellerId, row) {
    try {
      const product = row.existingId
        ? await this.sellerProductService.update(sellerId, row.existingId, row.payload, row.listingOptions)
        : await this.sellerProductService.create(sellerId, row.payload, row.listingOptions);
      row.productId = String(product._id);
      row.productStatus = product.status;
    } catch (error) {
      row.status = 'error';
      row.errors.push(error.message || 'Could not save this product');
    }
  }
}

module.exports = {
  SellerProductBulkImportService,
  MAX_PRODUCT_IMPORT_ROWS: MAX_ROWS,
  PENDING_UPLOAD_PREFIX,
};
