const { BaseRepository } = require('../core/BaseRepository');
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
}

module.exports = {
  SellerRepository,
};
