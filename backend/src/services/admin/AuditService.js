const { BaseService } = require('../../core/BaseService');

class AuditService extends BaseService {
  constructor({ auditLogRepository }) {
    super();
    this.auditLogRepository = auditLogRepository;
  }

  async log({ adminId, action, targetType, targetId, metadata, req, success = true }) {
    return this.auditLogRepository.logAction({
      adminId,
      action,
      targetType,
      targetId,
      metadata: metadata || {},
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || null,
      userAgent: req?.headers?.['user-agent'] || null,
      success,
    });
  }
}

module.exports = { AuditService };
