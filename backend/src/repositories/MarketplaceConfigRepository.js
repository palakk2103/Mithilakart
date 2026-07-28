const { BaseRepository } = require('../core/BaseRepository');
const MarketplaceConfig = require('../models/MarketplaceConfig');

class MarketplaceConfigRepository extends BaseRepository {
  constructor() {
    super(MarketplaceConfig);
  }

  async findActiveTabs() {
    return this.find({ isActive: true }, { sort: { tab: 1 } });
  }

  async findByTab(tab) {
    return this.findOne({ tab });
  }
}

module.exports = { MarketplaceConfigRepository };
