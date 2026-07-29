const { BaseRepository } = require('../core/BaseRepository');
const CategoryChip = require('../models/CategoryChip');

class CategoryChipRepository extends BaseRepository {
  constructor() {
    super(CategoryChip);
  }

  _activeFilter(filter = {}) {
    return { ...filter, deletedAt: null };
  }

  async findActive(filters = {}, options = {}) {
    return this.find({ ...this._activeFilter(filters), isActive: true }, options);
  }
}

module.exports = {
  CategoryChipRepository,
};
