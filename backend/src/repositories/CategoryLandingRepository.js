const { BaseRepository } = require('../core/BaseRepository');
const CategoryLandingSection = require('../models/CategoryLandingSection');
const CategoryLandingConfig = require('../models/CategoryLandingConfig');

class CategoryLandingSectionRepository extends BaseRepository {
  constructor() {
    super(CategoryLandingSection);
  }

  async findForCategory(categoryId, { activeOnly = false } = {}) {
    const filter = { categoryId, deletedAt: null };
    if (activeOnly) {
      const now = new Date();
      filter.isActive = true;
      filter.$and = [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ];
    }
    return this.find(filter, { sort: { sortOrder: 1, createdAt: 1 } });
  }
}

class CategoryLandingConfigRepository extends BaseRepository {
  constructor() {
    super(CategoryLandingConfig);
  }

  async findByCategory(categoryId) {
    return this.findOne({ categoryId });
  }

  async upsertByCategory(categoryId, data) {
    return this.model
      .findOneAndUpdate({ categoryId }, { $set: data, $setOnInsert: { categoryId } }, { new: true, upsert: true, runValidators: true })
      .exec();
  }
}

module.exports = { CategoryLandingSectionRepository, CategoryLandingConfigRepository };
