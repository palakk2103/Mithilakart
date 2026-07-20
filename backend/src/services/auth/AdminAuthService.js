const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const { PORTALS } = require('../../constants/portals');
const { ADMIN_STATUS } = require('../../constants/auth');

class AdminAuthService extends BaseService {
  constructor(dependencies) {
    super();
    this.adminUserRepository = dependencies.adminUserRepository;
    this.auditLogRepository = dependencies.auditLogRepository;
    this.passwordService = dependencies.passwordService;
    this.permissionService = dependencies.permissionService;
    this.tokenService = dependencies.tokenService;
    this.sessionService = dependencies.sessionService;
  }

  async login({ email, password, deviceId }, sessionMeta) {
    const admin = await this.adminUserRepository.findByEmailWithRole(email);

    if (!admin) {
      await this._logAttempt(null, false, sessionMeta, { email });
      throw AppError.unauthorized('Invalid email or password');
    }

    if (this.passwordService.isLocked(admin)) {
      throw AppError.rateLimited(
        `Account locked. Try again in ${this.passwordService.getLockoutRemainingMinutes(admin)} minutes`
      );
    }

    const passwordValid = await this.passwordService.compare(password, admin.passwordHash);

    if (!passwordValid) {
      const updated = await this.adminUserRepository.incrementFailedAttempts(admin._id);

      if (this.passwordService.shouldLockAccount(updated.failedLoginAttempts)) {
        await this.adminUserRepository.setLockUntil(
          admin._id,
          this.passwordService.getLockUntilDate()
        );
      }

      await this._logAttempt(admin._id, false, sessionMeta, { email });
      throw AppError.unauthorized('Invalid email or password');
    }

    if (admin.status !== ADMIN_STATUS.ACTIVE) {
      await this._logAttempt(admin._id, false, sessionMeta, { email, reason: 'inactive' });
      throw AppError.forbidden('Admin account is inactive');
    }

    await this.adminUserRepository.resetFailedAttempts(admin._id);

    const permissions = this.permissionService.resolvePermissions(admin, admin.roleId);

    const tokens = await this.tokenService.issueTokenPair({
      portal: PORTALS.ADMIN,
      subject: admin._id.toString(),
      role: 'admin',
      claims: { permissions },
      sessionMeta: { ...sessionMeta, deviceId },
    });

    await this.sessionService.trackDevice({
      userId: admin._id,
      portal: PORTALS.ADMIN,
      deviceId,
      userAgent: sessionMeta.userAgent,
    });

    await this._logAttempt(admin._id, true, sessionMeta, { email });

    return {
      admin: this._serializeAdmin(admin, permissions),
      tokens,
    };
  }

  async getProfile(adminId) {
    const admin = await this.adminUserRepository.findById(adminId);

    if (!admin) {
      throw AppError.notFound('Admin user not found');
    }

    const populated = await this.adminUserRepository.findByEmailWithRole(admin.email);
    const permissions = this.permissionService.resolvePermissions(populated, populated.roleId);

    return this._serializeAdmin(populated, permissions);
  }

  async changePassword(adminId, { currentPassword, newPassword }) {
    const admin = await this.adminUserRepository.findById(adminId);

    if (!admin) {
      throw AppError.notFound('Admin user not found');
    }

    const currentValid = await this.passwordService.compare(currentPassword, admin.passwordHash);

    if (!currentValid) {
      throw AppError.unauthorized('Current password is incorrect');
    }

    this.passwordService.validateStrength(newPassword);
    await this.passwordService.assertNotReused(newPassword, admin.passwordHistory);

    const passwordHash = await this.passwordService.hash(newPassword);
    const passwordHistory = this.passwordService.buildUpdatedHistory(
      admin.passwordHash,
      admin.passwordHistory
    );

    await this.adminUserRepository.updatePassword(adminId, passwordHash, passwordHistory);
    await this.tokenService.revokeAllSessions(adminId, PORTALS.ADMIN);
  }

  async refresh(refreshToken, sessionMeta) {
    const tokens = await this.tokenService.refreshTokens(refreshToken, PORTALS.ADMIN, sessionMeta);
    return { tokens };
  }

  async logout({ refreshToken, accessToken }) {
    await this.tokenService.logout({
      portal: PORTALS.ADMIN,
      refreshToken,
      accessToken,
    });
  }

  async _logAttempt(adminId, success, sessionMeta, metadata) {
    await this.auditLogRepository.logAdminAuthAttempt({
      adminId,
      action: 'admin.auth.login',
      targetType: 'admin_user',
      targetId: adminId,
      metadata,
      ipAddress: sessionMeta.ipAddress || null,
      userAgent: sessionMeta.userAgent || null,
      success,
    });
  }

  _serializeAdmin(admin, permissions) {
    return {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      status: admin.status,
      isSuperAdmin: admin.isSuperAdmin,
      role: admin.roleId ? {
        id: admin.roleId._id,
        name: admin.roleId.name,
      } : null,
      permissions,
    };
  }
}

module.exports = {
  AdminAuthService,
};
