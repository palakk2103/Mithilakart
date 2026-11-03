const { BaseService } = require('../../core/BaseService');
const mongoose = require('mongoose');
const { AppError } = require('../../utils/AppError');

const assertObjectId = (id, label = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(String(id)) || String(id).length !== 24) {
    throw AppError.validation(`Invalid ${label}`);
  }
};

const LANDING_TABS = ['mithilakart', 'mithilak'];
const DEFAULT_TAB = 'mithilak';
const LANDING_CACHE_TTL = 120; // short: scheduled banners/sections must flip on time
const landingCacheKey = (categoryId, lang, tab) => `cache:storefront:landing:${categoryId}:${tab}:${lang}`;
const LANDING_CACHE_PATTERN = 'cache:storefront:landing:*';
const FIXED_BLOCKS = ['banner', 'subcategories'];
const BLOCK_KEY_PATTERN = /^(banner|subcategories|section:[a-f0-9]{24})$/;

const DYNAMIC_QUERY = {
  best_sellers: { sort: '-popularity' },
  new_arrivals: { sort: '-createdAt' },
  top_deals: { discountOnly: true, sort: '-rating' },
  category_products: {},
};

class CategoryLandingService extends BaseService {
  constructor({
    bannerRepository,
    sectionRepository,
    configRepository,
    categoryRepository,
    categoryService,
    productRepository,
    marketplaceListingService,
    cacheService,
  }) {
    super();
    this.bannerRepository = bannerRepository;
    this.sectionRepository = sectionRepository;
    this.configRepository = configRepository;
    this.categoryRepository = categoryRepository;
    this.categoryService = categoryService;
    this.productRepository = productRepository;
    this.marketplaceListingService = marketplaceListingService;
    this.cacheService = cacheService;
  }

  // ───────────────────────── Public ─────────────────────────

  async getPublicLanding(categoryId, lang = 'en', tab = DEFAULT_TAB) {
    assertObjectId(categoryId, 'category id');
    if (!LANDING_TABS.includes(tab)) throw AppError.validation('Invalid tab');
    const cacheKey = landingCacheKey(categoryId, lang, tab);
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const tree = await this.categoryService.listPublicTree(null, tab, lang);
    const node = (tree || []).find((c) => String(c.id) === String(categoryId));
    if (!node) throw AppError.notFound('Category not found');

    const config = await this.configRepository.findByCategory(categoryId);
    if (config && config.enabled === false) {
      const disabled = this._emptyPayload(node, false);
      await this.cacheService.set(cacheKey, disabled, LANDING_CACHE_TTL);
      return disabled;
    }

    const [banners, sections] = await Promise.all([
      this.bannerRepository.findActive({ categoryId }, { sort: { sortOrder: 1 } }),
      this.sectionRepository.findForCategory(categoryId, { activeOnly: true }),
    ]);

    const subcategories = (node.children || []).map((child) => ({
      id: child.id,
      name: child.name,
      originalName: child.originalName,
      slug: child.slug,
      imageUrl: child.imageUrl,
      iconUrl: child.iconUrl,
      hasChildren: Boolean(child.children && child.children.length),
    }));

    // Resolve sections sequentially so dynamic sections can skip products
    // already shown above them (manual picks are always honoured).
    const used = new Set();
    const resolved = new Map();
    for (const section of sections) {
      const products = await this._resolveSectionProducts(section, categoryId, used, tab);
      if (!products.length) continue; // never render an empty/meaningless section
      products.forEach((p) => used.add(String(p.productId || p.id)));
      resolved.set(String(section._id), {
        type: 'section',
        id: String(section._id),
        sectionType: section.sectionType,
        title: section.title,
        subtitle: section.subtitle || '',
        imageUrl: section.imageUrl || null,
        ctaText: section.ctaText || '',
        ctaLink: section.ctaLink || null,
        products,
      });
    }

    const blockMap = new Map();
    if (banners.length) {
      blockMap.set('banner', {
        type: 'banner',
        banners: banners.map((b) => ({
          id: String(b._id),
          title: b.title,
          subtitle: b.subtitle || '',
          imageUrl: b.imageUrl,
          mobileImageUrl: b.mobileImageUrl || null,
          linkUrl: b.linkUrl || null,
          ctaText: b.ctaText || '',
        })),
      });
    }
    if (subcategories.length) blockMap.set('subcategories', { type: 'subcategories', items: subcategories });
    resolved.forEach((block, id) => blockMap.set(`section:${id}`, block));

    const payload = {
      ...this._emptyPayload(node, true),
      blocks: this._orderBlocks((config && config.blockOrder) || [], blockMap, sections),
    };
    await this.cacheService.set(cacheKey, payload, LANDING_CACHE_TTL);
    return payload;
  }

  _emptyPayload(node, enabled) {
    return {
      enabled,
      category: { id: node.id, name: node.name, originalName: node.originalName || node.name, imageUrl: node.imageUrl || null },
      blocks: [],
    };
  }

  /** Saved order first (unknown/removed keys dropped), then anything new in natural order. */
  _orderBlocks(savedOrder, blockMap, sections) {
    const natural = [...FIXED_BLOCKS, ...sections.map((s) => `section:${s._id}`)];
    const seen = new Set();
    const keys = [];
    [...savedOrder, ...natural].forEach((key) => {
      if (!seen.has(key) && blockMap.has(key)) {
        seen.add(key);
        keys.push(key);
      }
    });
    return keys.map((k) => blockMap.get(k));
  }

  async _resolveSectionProducts(section, categoryId, used, tab) {
    const limit = section.productLimit || 8;
    try {
      if (section.sectionType === 'manual') {
        const ids = (section.productIds || []).map(String).slice(0, limit);
        return await this.marketplaceListingService.listPublicByProductIds(tab, ids);
      }
      const extra = DYNAMIC_QUERY[section.sectionType] || {};
      const result = await this.marketplaceListingService.listPublicForTab({
        marketplaceTab: tab,
        categoryId: String(categoryId),
        page: 1,
        limit: limit + used.size,
        ...extra,
      });
      return (result.items || [])
        .filter((item) => !used.has(String(item.productId || item.id)))
        .slice(0, limit);
    } catch (err) {
      // A broken section must never take the whole landing page down.
      return [];
    }
  }

  // ───────────────────────── Admin ─────────────────────────

  async _assertMainCategory(categoryId) {
    assertObjectId(categoryId, 'category id');
    const category = await this.categoryRepository.findById(categoryId);
    if (!category || category.deletedAt) throw AppError.notFound('Category not found');
    const hasParent = (category.parentIds && category.parentIds.length) || category.parentId;
    if (hasParent) throw AppError.validation('Landing pages can only be configured for main categories');
    return category;
  }

  async _assertProductsInCategory(categoryId, productIds = []) {
    if (!productIds.length) return;
    productIds.forEach((pid) => assertObjectId(pid, 'product id'));
    const unique = [...new Set(productIds.map(String))];
    const subtree = (await this.categoryRepository.findSubtreeIds(categoryId)).map(String);
    const products = await this.productRepository.findAdmin({ _id: { $in: unique } });
    if (products.length !== unique.length) {
      throw AppError.validation('One or more selected products do not exist');
    }
    const outside = products.filter((p) => {
      const cats = [p.categoryId, ...(p.categoryIds || [])].map(String);
      return !cats.some((c) => subtree.includes(c));
    });
    if (outside.length) {
      throw AppError.validation('Selected products must belong to this category or its subcategories');
    }
  }

  _validateSchedule(data) {
    if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
      throw AppError.validation('End date must be after start date');
    }
  }

  async getAdminLanding(categoryId) {
    await this._assertMainCategory(categoryId);
    const [config, sections, banners] = await Promise.all([
      this.configRepository.findByCategory(categoryId),
      this.sectionRepository.findForCategory(categoryId),
      this.bannerRepository.find({ categoryId, deletedAt: null }, { sort: { sortOrder: 1 } }),
    ]);
    return {
      categoryId,
      enabled: config ? config.enabled : true,
      blockOrder: (config && config.blockOrder) || [],
      sections,
      banners,
    };
  }

  async updateConfig(categoryId, data) {
    await this._assertMainCategory(categoryId);
    const patch = {};
    if (data.enabled !== undefined) patch.enabled = data.enabled;
    if (data.blockOrder !== undefined) {
      if (data.blockOrder.some((k) => !BLOCK_KEY_PATTERN.test(k))) {
        throw AppError.validation('Invalid block order');
      }
      patch.blockOrder = [...new Set(data.blockOrder)];
    }
    const config = await this.configRepository.upsertByCategory(categoryId, patch);
    await this._invalidate();
    return config;
  }

  async createSection(categoryId, data) {
    await this._assertMainCategory(categoryId);
    this._validateSchedule(data);
    if (data.productIds && data.productIds.length) {
      await this._assertProductsInCategory(categoryId, data.productIds);
    }
    const count = await this.sectionRepository.count({ categoryId, deletedAt: null });
    const section = await this.sectionRepository.create({
      ...data,
      categoryId,
      sortOrder: data.sortOrder !== undefined ? data.sortOrder : count,
    });
    await this._invalidate();
    return section;
  }

  async updateSection(id, data) {
    assertObjectId(id, 'section id');
    const existing = await this.sectionRepository.findById(id);
    if (!existing || existing.deletedAt) throw AppError.notFound('Section not found');
    this._validateSchedule({
      startDate: data.startDate !== undefined ? data.startDate : existing.startDate,
      endDate: data.endDate !== undefined ? data.endDate : existing.endDate,
    });
    if (data.productIds) await this._assertProductsInCategory(existing.categoryId, data.productIds);
    const patch = { ...data };
    delete patch.categoryId; // a section can never move categories
    const section = await this.sectionRepository.updateById(id, patch);
    await this._invalidate();
    return section;
  }

  async deleteSection(id) {
    assertObjectId(id, 'section id');
    const existing = await this.sectionRepository.findById(id);
    if (!existing || existing.deletedAt) throw AppError.notFound('Section not found');
    await this.sectionRepository.softDelete(id);
    // Drop the dangling key from the saved block order.
    const config = await this.configRepository.findByCategory(existing.categoryId);
    if (config && config.blockOrder && config.blockOrder.length) {
      await this.configRepository.upsertByCategory(existing.categoryId, {
        blockOrder: config.blockOrder.filter((k) => k !== `section:${id}`),
      });
    }
    await this._invalidate();
  }

  async assertBannerCategory(categoryId) {
    if (categoryId) await this._assertMainCategory(categoryId);
  }

  async _invalidate() {
    await this.cacheService.delByPattern(LANDING_CACHE_PATTERN);
  }
}

module.exports = { CategoryLandingService, LANDING_CACHE_PATTERN };
