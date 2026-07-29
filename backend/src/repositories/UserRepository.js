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

  async createUser(data, session = null) {
    return this.create(data, session);
  }
}

module.exports = {
  UserRepository,
};
