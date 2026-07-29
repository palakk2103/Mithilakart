const { BaseRepository } = require('../core/BaseRepository');
const FeaturedProduct = require('../models/FeaturedProduct');

class FeaturedProductRepository extends BaseRepository {
  constructor() {
    super(FeaturedProduct);
  }

  async findActive(options = {}) {
    return this.find({ isActive: true, deletedAt: null }, { sort: { sortOrder: 1 }, ...options });
  }
}

module.exports = { FeaturedProductRepository };
