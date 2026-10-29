const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { CACHE_KEYS, CACHE_TTL, COMMERCE_FLOWS } = require('../../constants/catalog');
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
      const pIds = (cat.parentIds && cat.parentIds.length)
        ? cat.parentIds.map(String)
        : (cat.parentId ? [String(cat.parentId)] : []);

      let result = own;
      if (pIds.length) {
        const parentTabsLists = pIds
          .map((pid) => byId.get(pid))
          .filter(Boolean)
          .map((parent) => resolve(parent, depth + 1))
          .filter(Boolean);

        if (!parentTabsLists.length) {
          result = null;
        } else {
          const allParentTabs = [...new Set(parentTabsLists.flat())];
          const overlap = own.filter((t) => allParentTabs.includes(t));
          result = overlap.length ? overlap : allParentTabs;
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
      const pIds = (obj.parentIds && obj.parentIds.length)
        ? obj.parentIds.map((p) => String(p?._id || p))
        : (obj.parentId ? [String(obj.parentId?._id || obj.parentId)] : []);

      const parentDocs = pIds.map((pid) => byId.get(pid)).filter(Boolean);
      obj.parentIds = pIds;
      obj.parentId = pIds[0] || null;
      obj.parentNames = parentDocs.map((p) => p.name);
      obj.parentName = obj.parentNames.join(', ') || null;
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

    // Support both multi-parent parentIds and legacy parentId
    if (payload.parentIds !== undefined) {
      payload.parentIds = Array.isArray(payload.parentIds)
        ? payload.parentIds.map((p) => String(p?._id || p)).filter(Boolean)
        : [];
      payload.parentId = payload.parentIds[0] || null;
    } else if (payload.parentId) {
      payload.parentIds = [String(payload.parentId?._id || payload.parentId)];
      payload.parentId = payload.parentIds[0];
    } else {
      payload.parentIds = [];
      payload.parentId = null;
    }

    if (payload.parentIds.length) {
      const parentDocs = await Promise.all(payload.parentIds.map((pid) => this.getById(pid)));
      // A subcategory without explicit tabs inherits tabs from its parent(s)
      if (!payload.visibleTabs?.length) {
        const inheritedTabs = [...new Set(parentDocs.flatMap((p) => tabsOf(p)))];
        if (inheritedTabs.length) {
          payload.visibleTabs = inheritedTabs;
        }
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

    const payload = {
      ...data,
      ...(data.slug ? { slug: data.slug.toLowerCase() } : {}),
    };

    if (data.parentIds !== undefined) {
      payload.parentIds = Array.isArray(data.parentIds)
        ? data.parentIds.map((p) => String(p?._id || p)).filter(Boolean)
        : [];
      payload.parentId = payload.parentIds[0] || null;
    } else if (data.parentId !== undefined) {
      payload.parentIds = data.parentId ? [String(data.parentId?._id || data.parentId)] : [];
      payload.parentId = payload.parentIds[0] || null;
    }

    const targetParents = payload.parentIds !== undefined
      ? payload.parentIds
      : (existing.parentIds?.length ? existing.parentIds.map(String) : (existing.parentId ? [String(existing.parentId)] : []));

    if (targetParents.length) {
      const subtree = await this.categoryRepository.findSubtreeIds(id);
      for (const pid of targetParents) {
        if (String(pid) === String(id)) {
          throw AppError.validation('A category cannot be its own parent');
        }
        await this.getById(pid);
        if (subtree.some((sid) => String(sid) === String(pid))) {
          throw AppError.validation('A category cannot be moved under its own subcategory');
        }
      }
    }

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

      const pIds = (category.parentIds && category.parentIds.length)
        ? category.parentIds.map((p) => String(p?._id || p))
        : (category.parentId ? [String(category.parentId?._id || category.parentId)] : []);

      map.set(String(category._id), {
        id: category._id,
        name: localizedName,
        originalName: category.name,
        slug: category.slug,
        description: localizedDesc,
        parentId: pIds[0] || null,
        parentIds: pIds,
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
      const pIds = (node.parentIds && node.parentIds.length)
        ? node.parentIds
        : (node.parentId ? [String(node.parentId)] : []);

      if (pIds.length) {
        let attached = false;
        pIds.forEach((pid) => {
          if (map.has(pid)) {
            map.get(pid).children.push(node);
            attached = true;
          }
        });
        if (!attached) {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  /**
   * Invalidate ALL category-related caches:
   * 1. Category tree cache (cache:categories:tree:*)
   * 2. Storefront home cache (cache:storefront:home:*) — this embeds categories
   *    inside the home response, so without clearing it, customers see stale
   *    categories for up to HOME_SECTIONS TTL (900s) after an admin change.
   */
  async _invalidateCache() {
    const catKeys = [
      'all',
      'standard',
      'mithilak',
      'quick_shop',
      'fresh_grocery',
      ...MARKETPLACE_TAB_VALUES,
    ];
    const uniqueCatKeys = [...new Set(catKeys)];
    const homeFlows = Object.values(COMMERCE_FLOWS);
    const langs = ['en', 'hi', 'mai'];

    const deletePromises = [];
    uniqueCatKeys.forEach((flow) => {
      langs.forEach((lang) => {
        deletePromises.push(this.cacheService.del(CACHE_KEYS.categoriesTree(flow, lang)));
      });
    });

    homeFlows.forEach((flow) => {
      langs.forEach((lang) => {
        deletePromises.push(this.cacheService.del(CACHE_KEYS.homeSections(flow, lang)));
      });
    });

    await Promise.all(deletePromises);
  }
}

module.exports = {
  CategoryService,
};
