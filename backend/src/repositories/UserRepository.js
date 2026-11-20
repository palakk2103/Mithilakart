const { BaseRepository } = require('../core/BaseRepository');
const User = require('../models/User');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  _activeFilter(filter = {}) {
    return { ...filter, deletedAt: null };
  }

  async findByEmail(email) {
    return this.findOne(this._activeFilter({ email: email.toLowerCase() }));
  }

  async findByPhone(phone, countryCode) {
    return this.findOne(this._activeFilter({ phone, countryCode }));
  }

  /** Same number saved as "+91" or "91" is the same account. */
  async findByPhoneAnyCode(phone, countryCode) {
    const digits = String(countryCode || '+91').replace(/\D/g, '');
    return this.findOne(this._activeFilter({ phone, countryCode: { $in: [`+${digits}`, digits] } }));
  }

  async createUser(data, session = null) {
    return this.create(data, session);
  }
}

module.exports = {
  UserRepository,
};
