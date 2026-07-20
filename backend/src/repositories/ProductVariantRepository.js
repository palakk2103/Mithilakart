const { BaseRepository } = require('../core/BaseRepository');
const ProductVariant = require('../models/ProductVariant');

class ProductVariantRepository extends BaseRepository {
  constructor() {
    super(ProductVariant);
  }

  _activeFilter(filter = {}) {
    return { ...filter, deletedAt: null, isActive: true };
  }

  async findByProductId(productId) {
    return this.find(this._activeFilter({ productId }), { sort: { createdAt: 1 } });
  }
}

module.exports = {
  ProductVariantRepository,
};
