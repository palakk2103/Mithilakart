const { BaseRepository } = require('../core/BaseRepository');
const DeliveryPartner = require('../models/DeliveryPartner');

class DeliveryPartnerRepository extends BaseRepository {
  constructor() {
    super(DeliveryPartner);
  }

  _activeFilter(filter = {}) {
    return { ...filter, deletedAt: null };
  }

  async findByPhone(phone, countryCode) {
    return this.findOne(this._activeFilter({ phone, countryCode }));
  }

  async list(filter = {}, options = {}) {
    return this.find(this._activeFilter(filter), options);
  }

  async count(filter = {}) {
    return this.model.countDocuments(this._activeFilter(filter));
  }

  async updateStatus(id, status) {
    return this.updateById(id, { status });
  }

  async findNearbyOnline({ latitude, longitude, maxDistanceMeters = 10000, limit = 20 }) {
    if (latitude == null || longitude == null) return [];
    return this.model.find({
      ...this._activeFilter({ status: 'approved', isOnline: true }),
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [longitude, latitude] },
          $maxDistance: maxDistanceMeters,
        },
      },
    }).limit(limit).lean();
  }
}

module.exports = {
  DeliveryPartnerRepository,
};
