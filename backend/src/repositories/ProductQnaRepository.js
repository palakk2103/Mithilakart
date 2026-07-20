const { BaseRepository } = require('../core/BaseRepository');
const ProductQna = require('../models/ProductQna');

class ProductQnaRepository extends BaseRepository {
  constructor() {
    super(ProductQna);
  }

  async findByProduct(productId, options = {}) {
    return this.find({ productId, deletedAt: null, status: { $ne: 'hidden' } }, options);
  }

  async findByUser(userId, options = {}) {
    return this.find({ userId, deletedAt: null }, options);
  }
}

module.exports = { ProductQnaRepository };
