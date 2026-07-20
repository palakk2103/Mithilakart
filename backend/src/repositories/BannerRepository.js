const { BaseRepository } = require('../core/BaseRepository');
const Banner = require('../models/Banner');

class BannerRepository extends BaseRepository {
  constructor() {
    super(Banner);
  }

  _activeFilter(filter = {}) {
    return { ...filter, deletedAt: null };
  }

  async findActive(filters = {}, options = {}) {
    const now = new Date();
    return this.find({
      ...this._activeFilter(filters),
      isActive: true,
      $or: [
        { startDate: null, endDate: null },
        { startDate: { $lte: now }, endDate: null },
        { startDate: null, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: { $gte: now } },
      ],
    }, options);
  }
}

module.exports = {
  BannerRepository,
};
