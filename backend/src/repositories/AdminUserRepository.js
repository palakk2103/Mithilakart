const { BaseRepository } = require('../core/BaseRepository');
const AdminUser = require('../models/AdminUser');

class AdminUserRepository extends BaseRepository {
  constructor() {
    super(AdminUser);
  }

  _activeFilter(filter = {}) {
    return { ...filter, deletedAt: null };
  }

  async findByEmail(email) {
    return this.findOne(this._activeFilter({ email: email.toLowerCase() }))
      .then((doc) => (doc ? doc.populate('roleId') : null));
  }

  async findByEmailWithRole(email) {
    return this.model.findOne(this._activeFilter({ email: email.toLowerCase() }))
      .populate('roleId')
      .exec();
  }

  async incrementFailedAttempts(id, session = null) {
    const admin = await this.findById(id);
    if (!admin) {
      return null;
    }

    admin.failedLoginAttempts += 1;
    await admin.save({ session });
    return admin;
  }

  async resetFailedAttempts(id, session = null) {
    return this.updateById(id, { failedLoginAttempts: 0, lockUntil: null }, session);
  }

  async setLockUntil(id, lockUntil, session = null) {
    return this.updateById(id, { lockUntil }, session);
  }

  async updatePassword(id, passwordHash, passwordHistory, session = null) {
    return this.updateById(id, { passwordHash, passwordHistory }, session);
  }
}

module.exports = {
  AdminUserRepository,
};
