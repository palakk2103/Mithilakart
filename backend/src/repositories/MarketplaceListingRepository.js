const { BaseRepository } = require('../core/BaseRepository');
const MarketplaceListing = require('../models/MarketplaceListing');
const { LISTING_STATUS } = require('../constants/marketplace');

class MarketplaceListingRepository extends BaseRepository {
  constructor() {
    super(MarketplaceListing);
  }

  _activeFilter(filter = {}) {
    return { ...filter, deletedAt: null };
  }

  _publicFilter(filter = {}) {
    return {
      ...this._activeFilter(filter),
      listingStatus: LISTING_STATUS.APPROVED,
      isVisible: true,
    };
  }

  async findPublic(filter = {}, options = {}) {
    return this.find(this._publicFilter(filter), options);
  }

  async findPublicOne(filter = {}) {
    return this.findOne(this._publicFilter(filter));
  }

  async countPublic(filter = {}) {
    return this.count(this._publicFilter(filter));
  }

  async findBySeller(sellerId, filter = {}, options = {}) {
    return this.find(this._activeFilter({ ...filter, sellerId }), options);
  }

  async countBySeller(sellerId, filter = {}) {
    return this.count(this._activeFilter({ ...filter, sellerId }));
  }

  async findByProductAndTab(productId, marketplaceTab) {
    return this.findOne(this._activeFilter({ productId, marketplaceTab }));
  }

  async updateStatus(id, listingStatus, extra = {}, session = null) {
    return this.updateById(id, { listingStatus, ...extra }, session);
  }
}

module.exports = { MarketplaceListingRepository };
