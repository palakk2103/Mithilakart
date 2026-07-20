const { SESSION } = require('../constants/auth');

class SessionService {
  constructor(refreshTokenRepository, userDeviceRepository) {
    this.refreshTokenRepository = refreshTokenRepository;
    this.userDeviceRepository = userDeviceRepository;
  }

  async trackDevice({ userId, portal, deviceId, platform, userAgent }) {
    if (!deviceId) {
      return null;
    }

    return this.userDeviceRepository.upsertDevice({
      userId,
      portal,
      deviceId,
      platform: platform || 'web',
      userAgent: userAgent || null,
    });
  }

  async enforceSessionLimit(userId, portal) {
    await this.refreshTokenRepository.revokeOldestSessions(
      userId,
      portal,
      SESSION.MAX_ACTIVE_SESSIONS
    );
  }
}

module.exports = {
  SessionService,
};
