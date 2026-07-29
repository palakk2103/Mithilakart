const { BaseRepository } = require('../core/BaseRepository');
const FlashSaleProduct = require('../models/FlashSaleProduct');

class FlashSaleProductRepository extends BaseRepository {
  constructor() {
    super(FlashSaleProduct);
  }

  async findByFlashSale(flashSaleId) {
    return this.find({ flashSaleId, deletedAt: null });
  }

  async findActiveForProduct(productId, now = new Date()) {
    return this.model.aggregate([
      { $match: { productId, deletedAt: null } },
      {
        $lookup: {
          from: 'flash_sales',
          localField: 'flashSaleId',
          foreignField: '_id',
          as: 'sale',
        },
      },
      { $unwind: '$sale' },
      {
        $match: {
          'sale.isActive': true,
          'sale.deletedAt': null,
          'sale.startsAt': { $lte: now },
          'sale.endsAt': { $gte: now },
        },
      },
      { $limit: 1 },
    ]);
  }
}

module.exports = { FlashSaleProductRepository };
