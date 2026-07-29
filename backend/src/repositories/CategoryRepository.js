const { BaseRepository } = require('../core/BaseRepository');
const Category = require('../models/Category');

class CategoryRepository extends BaseRepository {
  constructor() {
    super(Category);
  }

  _activeFilter(filter = {}) {
    return { ...filter, deletedAt: null };
  }

  async findActive(filters = {}, options = {}) {
    return this.find(this._activeFilter(filters), options);
  }

  async findBySlug(slug) {
    return this.findOne(this._activeFilter({ slug: slug.toLowerCase() }));
  }

  async slugExists(slug, excludeId = null) {
    const filter = this._activeFilter({ slug: slug.toLowerCase() });
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    return this.exists(filter);
  }
}

module.exports = {
  CategoryRepository,
};
