const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { CACHE_KEYS, CACHE_TTL } = require('../../constants/catalog');
const { resolveTabFromQuery, toLegacyCommerceFlow } = require('../../utils/marketplaceTab');

class CategoryService extends BaseService {
  constructor(categoryRepository, cacheService, translationService = null) {
    super(categoryRepository);
    this.categoryRepository = categoryRepository;
    this.cacheService = cacheService;
    this.translationService = translationService;
  }

  async listPublicTree(commerceFlow, marketplaceTab = null, lang = 'en') {
    const tab = resolveTabFromQuery({ marketplaceTab, commerceFlow }) || marketplaceTab || commerceFlow;
    const cacheKey = CACHE_KEYS.categoriesTree(tab || 'all', lang);
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const allCategories = await this.categoryRepository.findActive({ isActive: true }, {
      sort: { sortOrder: 1, name: 1 },
    });

    let filtered = allCategories;
    if (tab) {
      const legacy = toLegacyCommerceFlow(tab);
      const catMap = new Map(allCategories.map((c) => [String(c._id), c]));

      const isCategoryVisible = (cat) => {
        if (!cat) return false;
        const tabs = cat.visibleTabs?.length
          ? cat.visibleTabs
          : (cat.commerceFlows || []);
        if (tabs.includes(tab) || (legacy && tabs.includes(legacy))) return true;
        if (cat.parentId && (!tabs || tabs.length === 0)) {
          const parent = catMap.get(String(cat.parentId));
          return isCategoryVisible(parent);
        }
        return false;
      };

      filtered = allCategories.filter((cat) => {
        if (isCategoryVisible(cat)) return true;
        const hasVisibleChild = allCategories.some((other) => String(other.parentId) === String(cat._id) && isCategoryVisible(other));
        return hasVisibleChild;
      });
    }

    const tree = this._buildTree(filtered, lang);
    await this.cacheService.set(cacheKey, tree, CACHE_TTL.CATEGORIES_TREE);
    return tree;
  }

  async listAdmin(filters = {}) {
    return this.categoryRepository.findActive(filters, { sort: { sortOrder: 1, name: 1 } });
  }

  async getById(id) {
    const category = await this.categoryRepository.findById(id);
    if (!category || category.deletedAt) {
      throw AppError.notFound('Category not found');
    }
    return category;
  }

  async create(data) {
    if (await this.categoryRepository.slugExists(data.slug)) {
      throw AppError.conflict('Category slug already exists');
    }

    const payload = { ...data, slug: data.slug.toLowerCase() };
    if (payload.visibleTabs?.length && !payload.commerceFlows?.length) {
      payload.commerceFlows = payload.visibleTabs
        .map((tab) => toLegacyCommerceFlow(tab))
        .filter(Boolean);
    }

    if (this.translationService && (!payload.translations || !payload.translations.hi || !payload.translations.mai)) {
      try {
        const trans = await this.translationService.translateFields({
          name: payload.name,
          description: payload.description || '',
        });
        payload.translations = { ...(payload.translations || {}), ...trans };
      } catch (_err) {
        // Safe fallback if translation service is unavailable
      }
    }

    const category = await this.categoryRepository.create(payload);

    await this._invalidateCache();
    return category;
  }

  async update(id, data) {
    const existing = await this.getById(id);

    if (data.slug && await this.categoryRepository.slugExists(data.slug, id)) {
      throw AppError.conflict('Category slug already exists');
    }

    const updatePayload = {
      ...data,
      ...(data.slug ? { slug: data.slug.toLowerCase() } : {}),
    };

    if (this.translationService && (data.name !== undefined || data.description !== undefined)) {
      try {
        const nameToTrans = data.name !== undefined ? data.name : existing.name;
        const descToTrans = data.description !== undefined ? data.description : (existing.description || '');
        const trans = await this.translationService.translateFields({
          name: nameToTrans,
          description: descToTrans,
        });
        updatePayload.translations = { ...(existing.translations || {}), ...(data.translations || {}), ...trans };
      } catch (_err) {
        // Safe fallback
      }
    }

    const category = await this.categoryRepository.updateById(id, updatePayload);

    await this._invalidateCache();
    return category;
  }

  async delete(id) {
    await this.getById(id);
    await this.categoryRepository.softDelete(id);
    await this._invalidateCache();
  }

  async reorder(items = []) {
    if (!Array.isArray(items) || items.length === 0) {
      throw AppError.validation('Reorder payload must be a non-empty array');
    }

    await Promise.all(
      items.map(({ id, sortOrder }) =>
        this.categoryRepository.updateById(id, { sortOrder: Number(sortOrder) || 0 })
      )
    );

    await this._invalidateCache();
    return this.listAdmin();
  }

  _buildTree(categories, lang = 'en') {
    const map = new Map();
    const roots = [];

    categories.forEach((category) => {
      const isLocalized = lang && lang !== 'en';
      const localizedName = (isLocalized && category.translations?.[lang]?.name) || category.name;
      const localizedDesc = (isLocalized && category.translations?.[lang]?.description) || category.description;

      map.set(String(category._id), {
        id: category._id,
        name: localizedName,
        originalName: category.name,
        slug: category.slug,
        description: localizedDesc,
        parentId: category.parentId,
        imageUrl: category.imageUrl,
        iconUrl: category.iconUrl,
        sortOrder: category.sortOrder,
        commerceFlows: category.commerceFlows,
        translations: category.translations || {},
        children: [],
      });
    });

    map.forEach((node) => {
      if (node.parentId && map.has(String(node.parentId))) {
        map.get(String(node.parentId)).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  async _invalidateCache() {
    const flows = [
      'all',
      'standard',
      'mithilak',
      'quick_shop',
      'fresh_grocery',
      'groceries_fresh',
      'mithilakart',
    ];
    const langs = ['en', 'hi', 'mai'];
    const deletePromises = [];
    flows.forEach((flow) => {
      langs.forEach((lang) => {
        deletePromises.push(this.cacheService.del(CACHE_KEYS.categoriesTree(flow, lang)));
      });
    });
    await Promise.all(deletePromises);
  }
}

module.exports = {
  CategoryService,
};
