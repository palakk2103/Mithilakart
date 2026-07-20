const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { CACHE_KEYS, CACHE_TTL } = require('../../constants/catalog');

class CategoryService extends BaseService {
  constructor(categoryRepository, cacheService) {
    super(categoryRepository);
    this.categoryRepository = categoryRepository;
    this.cacheService = cacheService;
  }

  async listPublicTree(commerceFlow) {
    const cacheKey = CACHE_KEYS.categoriesTree(commerceFlow || 'all');
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const filter = { isActive: true };
    if (commerceFlow) {
      filter.commerceFlows = commerceFlow;
    }

    const categories = await this.categoryRepository.findActive(filter, {
      sort: { sortOrder: 1, name: 1 },
    });

    const tree = this._buildTree(categories);
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

    const category = await this.categoryRepository.create({
      ...data,
      slug: data.slug.toLowerCase(),
    });

    await this._invalidateCache();
    return category;
  }

  async update(id, data) {
    await this.getById(id);

    if (data.slug && await this.categoryRepository.slugExists(data.slug, id)) {
      throw AppError.conflict('Category slug already exists');
    }

    const category = await this.categoryRepository.updateById(id, {
      ...data,
      ...(data.slug ? { slug: data.slug.toLowerCase() } : {}),
    });

    await this._invalidateCache();
    return category;
  }

  async delete(id) {
    await this.getById(id);
    await this.categoryRepository.softDelete(id);
    await this._invalidateCache();
  }

  _buildTree(categories) {
    const map = new Map();
    const roots = [];

    categories.forEach((category) => {
      map.set(String(category._id), {
        id: category._id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        parentId: category.parentId,
        imageUrl: category.imageUrl,
        iconUrl: category.iconUrl,
        sortOrder: category.sortOrder,
        commerceFlows: category.commerceFlows,
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
    await this.cacheService.del(CACHE_KEYS.categoriesTree('all'));
    await this.cacheService.del(CACHE_KEYS.categoriesTree('standard'));
    await this.cacheService.del(CACHE_KEYS.categoriesTree('mithilak'));
    await this.cacheService.del(CACHE_KEYS.categoriesTree('quick_shop'));
    await this.cacheService.del(CACHE_KEYS.categoriesTree('fresh_grocery'));
  }
}

module.exports = {
  CategoryService,
};
