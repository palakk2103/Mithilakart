const { BaseRepository } = require('../core/BaseRepository');
const { haversineKm } = require('../utils/geoHelper');
const Seller = require('../models/Seller');

class SellerRepository extends BaseRepository {
  constructor() {
    super(Seller);
  }

  _activeFilter(filter = {}) {
    return { ...filter, deletedAt: null };
  }

  async findByEmail(email) {
    return this.findOne(this._activeFilter({ email: email.toLowerCase() }));
  }

  async findByPhone(phone, countryCode = '+91') {
    return this.findOne(this._activeFilter({ phone, countryCode }));
  }

  async incrementFailedAttempts(id, session = null) {
    const seller = await this.findById(id);
    if (!seller) {
      return null;
    }

    seller.failedLoginAttempts += 1;
    await seller.save({ session });
    return seller;
  }

  async resetFailedAttempts(id, session = null) {
    return this.updateById(id, { failedLoginAttempts: 0, lockUntil: null }, session);
  }

  async setLockUntil(id, lockUntil, session = null) {
    return this.updateById(id, { lockUntil }, session);
  }

  async findNearby({ latitude, longitude, radiusKm = 25, limit = 100 }) {
    if (latitude == null || longitude == null) return [];

    const maxDistanceMeters = radiusKm * 1000;

    // Try geo-indexed $near query first (fast, uses 2dsphere index)
    try {
      const geoSellers = await this.model.find({
        deletedAt: null,
        status: 'active',
        kycStatus: 'approved',
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [longitude, latitude] },
            $maxDistance: maxDistanceMeters,
          },
        },
      }).limit(limit).lean();

      if (geoSellers.length > 0) {
        return geoSellers.map((seller) => ({
          ...seller,
          distanceKm: haversineKm(latitude, longitude, seller.latitude, seller.longitude),
        }));
      }
    } catch (error) {
      // $near may fail if no sellers have location populated — fall through
    }

    // Fallback: haversine on sellers with lat/lng but missing GeoJSON location
    const sellers = await this.find({
      deletedAt: null,
      status: 'active',
      kycStatus: 'approved',
      latitude: { $ne: null },
      longitude: { $ne: null },
    });

    return sellers
      .map((seller) => ({
        ...seller.toObject(),
        distanceKm: haversineKm(latitude, longitude, seller.latitude, seller.longitude),
      }))
      .filter((seller) => seller.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);
  }
}

module.exports = {
  SellerRepository,
};
