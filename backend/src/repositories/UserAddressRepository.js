const { BaseRepository } = require('../core/BaseRepository');
const UserAddress = require('../models/UserAddress');

class UserAddressRepository extends BaseRepository {
  constructor() {
    super(UserAddress);
  }

  async findByUser(userId, options = {}) {
    return this.find({ userId, deletedAt: null }, { sort: { isDefault: -1, createdAt: -1 }, ...options });
  }

  async countByUser(userId) {
    return this.count({ userId, deletedAt: null });
  }

  async findDefaultByUser(userId) {
    return this.findOne({ userId, isDefault: true, deletedAt: null });
  }

  async clearDefaultForUser(userId, session = null) {
    const query = this.model.updateMany(
      { userId, deletedAt: null },
      { $set: { isDefault: false } }
    );
    if (session) query.session(session);
    return query.exec();
  }
}

module.exports = { UserAddressRepository };
