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

  async updateMany(filter, update) {
    return this.model.updateMany(filter, update).exec();
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

  /**
   * Resolve a category reference (ObjectId, slug or exact name) to a document.
   * Name matching is exact and case-insensitive; the input is regex-escaped.
   */
  async resolveRef(ref) {
    if (!ref) return null;
    const value = String(ref).trim();
    if (/^[a-f0-9]{24}$/i.test(value)) {
      const byId = await this.findById(value);
      if (byId && !byId.deletedAt) return byId;
    }
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.findOne(this._activeFilter({
      $or: [{ slug: value.toLowerCase() }, { name: new RegExp(`^${escaped}$`, 'i') }],
    }));
  }

  /**
   * Ids of the category and ALL its descendants (any depth).
   * Returns [ref] unchanged when the reference cannot be resolved.
   */
  async findSubtreeIds(ref) {
    const root = await this.resolveRef(ref);
    if (!root) return [ref];

    const ids = [root._id];
    let frontier = [root._id];
    const seen = new Set([String(root._id)]);
    while (frontier.length) {
      const children = await this.find(this._activeFilter({ parentId: { $in: frontier } }));
      frontier = children
        .filter((c) => !seen.has(String(c._id)))
        .map((c) => {
          seen.add(String(c._id));
          return c._id;
        });
      ids.push(...frontier);
    }
    return ids;
  }
}

module.exports = {
  CategoryRepository,
};
