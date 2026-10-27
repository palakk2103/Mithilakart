const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { CACHE_KEYS, CACHE_TTL } = require('../../constants/catalog');
const { MARKETPLACE_TAB_VALUES } = require('../../constants/marketplace');
const {
  resolveTabFromQuery,
  normalizeMarketplaceTab,
  categoryTabs: tabsOf,
  legacyFlowsForTabs: flowsForTabs,
} = require('../../utils/marketplaceTab');

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

    const normalizedTab = tab ? normalizeMarketplaceTab(tab) : null;
    const filtered = this._filterVisible(allCategories, normalizedTab);
    const tree = this._buildTree(filtered, this.effectiveTabsMap(allCategories), lang);
    await this.cacheService.set(cacheKey, tree, CACHE_TTL.CATEGORIES_TREE);
    return tree;
  }

  /**
   * A category is shown only when it AND every ancestor are active and enabled
   * for the tab. A subcategory's effective tabs are its own tabs intersected
   * with its parent's; when they don't overlap at all (no tabs, or the old
   * schema default ['mithilakart'] under e.g. a Groceries-only parent) it
   * inherits the parent's tabs.
   *
   * The previous rule also pulled a parent INTO a tab whenever any child was
   * enabled there, so a subcategory created with the admin form's default
   * "all tabs" leaked its parent into every tab — and children of a deleted or
   * inactive parent were rendered as top-level categories.
   */
  _filterVisible(categories, tab) {
    const effective = this.effectiveTabsMap(categories);
    return categories.filter((cat) => {
      const tabs = effective.get(String(cat._id));
      if (!tabs) return false; // orphan: parent deleted or inactive
      return tab ? tabs.includes(tab) : true;
    });
  }

  /** Map of categoryId -> effective tabs; orphans (missing ancestor) map to null. */
  effectiveTabsMap(categories) {
    const byId = new Map(categories.map((c) => [String(c._id), c]));
    const memo = new Map();

    const resolve = (cat, depth = 0) => {
      const key = String(cat._id);
      if (memo.has(key)) return memo.get(key);
      if (depth > 10) return null;

      const own = tabsOf(cat);
      let result = own;
      if (cat.parentId) {
        const parent = byId.get(String(cat.parentId));
        const parentTabs = parent ? resolve(parent, depth + 1) : null;
        if (!parentTabs) {
          result = null;
        } else {
          const overlap = own.filter((t) => parentTabs.includes(t));
          result = overlap.length ? overlap : parentTabs;
        }
      }
      memo.set(key, result);
      return result;
    };

    categories.forEach((cat) => resolve(cat));
    return memo;
  }

  async listAdmin(filters = {}) {
    const categories = await this.categoryRepository.findActive(filters, { sort: { sortOrder: 1, name: 1 } });
    const byId = new Map(categories.map((c) => [String(c._id), c]));
    return categories.map((c) => {
      const obj = c.toObject ? c.toObject() : { ...c };
      const parent = obj.parentId ? byId.get(String(obj.parentId)) : null;
      obj.parentName = parent ? parent.name : null;
      return obj;
    });
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

    if (payload.parentId) {
      const parent = await this.getById(payload.parentId);
      // A subcategory without explicit tabs used to fall back to the schema
      // default ['mithilakart'] and silently vanish from the parent's tab.
      if (!payload.visibleTabs?.length) {
        payload.visibleTabs = tabsOf(parent);
      }
    }

    if (payload.visibleTabs?.length) {
      payload.commerceFlows = flowsForTabs(payload.visibleTabs);
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

    if (data.parentId) {
      if (String(data.parentId) === String(id)) {
        throw AppError.validation('A category cannot be its own parent');
      }
      await this.getById(data.parentId);
      const subtree = await this.categoryRepository.findSubtreeIds(id);
      if (subtree.some((sid) => String(sid) === String(data.parentId))) {
        throw AppError.validation('A category cannot be moved under its own subcategory');
      }
    }

    const payload = {
      ...data,
      ...(data.slug ? { slug: data.slug.toLowerCase() } : {}),
    };
    if (payload.visibleTabs?.length) {
      payload.commerceFlows = flowsForTabs(payload.visibleTabs);
    }

    if (this.translationService && (data.name !== undefined || data.description !== undefined)) {
      try {
        const nameToTrans = data.name !== undefined ? data.name : existing.name;
        const descToTrans = data.description !== undefined ? data.description : (existing.description || '');
        const trans = await this.translationService.translateFields({
          name: nameToTrans,
          description: descToTrans,
        });
        payload.translations = { ...(existing.translations || {}), ...(data.translations || {}), ...trans };
      } catch (_err) {
        // Safe fallback
      }
    }

    const category = await this.categoryRepository.updateById(id, payload);

    if (payload.visibleTabs?.length) {
      await this._cascadeTabs(id, tabsOf(existing), tabsOf(category));
    }

    await this._invalidateCache();
    return category;
  }

  /**
   * Propagate tabs added to / removed from a category onto its descendants,
   * so enabling a parent for a tab also enables its subcategories there.
   * Per-child exclusions for tabs that did not change are preserved.
   */
  async _cascadeTabs(id, previousTabs, nextTabs) {
    const added = nextTabs.filter((t) => !previousTabs.includes(t));
    const removed = previousTabs.filter((t) => !nextTabs.includes(t));
    if (!added.length && !removed.length) return;

    const subtree = await this.categoryRepository.findSubtreeIds(id);
    const descendantIds = subtree.filter((sid) => String(sid) !== String(id));
    if (!descendantIds.length) return;

    const filter = { _id: { $in: descendantIds }, deletedAt: null };
    if (added.length) {
      await this.categoryRepository.updateMany(filter, {
        $addToSet: {
          visibleTabs: { $each: added },
          commerceFlows: { $each: flowsForTabs(added) },
        },
      });
    }
    if (removed.length) {
      await this.categoryRepository.updateMany(filter, {
        $pull: {
          visibleTabs: { $in: removed },
          commerceFlows: { $in: flowsForTabs(removed) },
        },
      });
    }
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

  _buildTree(categories, effectiveTabs = null, lang = 'en') {
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
        visibleTabs: effectiveTabs?.get(String(category._id)) || tabsOf(category),
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
      ...MARKETPLACE_TAB_VALUES,
    ];
    const uniqueKeys = [...new Set(flows)];
    const langs = ['en', 'hi', 'mai'];
    const deletePromises = [];
    uniqueKeys.forEach((flow) => {
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
