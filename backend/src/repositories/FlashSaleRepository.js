const { BaseRepository } = require('../core/BaseRepository');
const FlashSale = require('../models/FlashSale');

class FlashSaleRepository extends BaseRepository {
  constructor() {
    super(FlashSale);
  }

  async findActive(now = new Date()) {
    return this.find({
      isActive: true,
      deletedAt: null,
      startsAt: { $lte: now },
      endsAt: { $gte: now },
    });
  }
}

module.exports = { FlashSaleRepository };
