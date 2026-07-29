const { BaseRepository } = require('../core/BaseRepository');
const AuditLog = require('../models/AuditLog');

class AuditLogRepository extends BaseRepository {
  constructor() {
    super(AuditLog);
  }

  async logAdminAuthAttempt(data, session = null) {
    return this.create(data, session);
  }

  async logAction(data, session = null) {
    return this.create(data, session);
  }

  async list(filter = {}, options = {}) {
    return this.find(filter, options);
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }
}

module.exports = {
  AuditLogRepository,
};
