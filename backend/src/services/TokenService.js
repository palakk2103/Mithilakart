const jwt = require('jsonwebtoken');
const { JWT, SESSION } = require('../constants/auth');
const { AppError } = require('../utils/AppError');
const { randomUuid, sha256 } = require('../utils/cryptoHelper');

class TokenService {
  constructor(refreshTokenRepository, redisClient, config) {
    this.refreshTokenRepository = refreshTokenRepository;
    this.redis = redisClient;
    this.config = config;
  }

  _portalConfig(portal) {
    const portalConfig = this.config.jwt[portal];

    if (!portalConfig || !portalConfig.privateKey || !portalConfig.publicKey) {
      throw AppError.internal(`JWT keys not configured for portal: ${portal}`);
    }

    return portalConfig;
  }

  _blacklistKey(jti) {
    return `bl:${jti}`;
  }

  async blacklistAccessToken(jti, exp) {
    const ttlSeconds = Math.max(exp - Math.floor(Date.now() / 1000), 1);
    await this.redis.set(this._blacklistKey(jti), '1', 'EX', ttlSeconds);
  }

  async isAccessTokenBlacklisted(jti) {
    const value = await this.redis.get(this._blacklistKey(jti));
    return Boolean(value);
  }

  signAccessToken(payload, portal) {
    const portalConfig = this._portalConfig(portal);
    const jti = randomUuid();

    const token = jwt.sign(
      {
        ...payload,
        portal,
        jti,
        type: 'access',
      },
      portalConfig.privateKey,
      {
        algorithm: portalConfig.algorithm,
        expiresIn: portalConfig.accessExpiry,
      }
    );

    return { token, jti };
  }

  signRefreshToken(payload, portal) {
    const portalConfig = this._portalConfig(portal);
    const jti = randomUuid();

    const token = jwt.sign(
      {
        ...payload,
        portal,
        jti,
        type: 'refresh',
      },
      portalConfig.privateKey,
      {
        algorithm: portalConfig.algorithm,
        expiresIn: portalConfig.refreshExpiry,
      }
    );

    return { token, jti };
  }

  verifyToken(token, portal, expectedType = 'access') {
    const portalConfig = this._portalConfig(portal);

    try {
      const decoded = jwt.verify(token, portalConfig.publicKey, {
        algorithms: [portalConfig.algorithm],
      });

      if (decoded.type !== expectedType) {
        throw AppError.unauthorized('Invalid token type');
      }

      if (decoded.portal !== portal) {
        throw AppError.unauthorized('Invalid portal token');
      }

      return decoded;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw AppError.unauthorized('Invalid or expired token');
    }
  }

  async verifyAccessToken(token, portal) {
    const decoded = this.verifyToken(token, portal, 'access');

    if (await this.isAccessTokenBlacklisted(decoded.jti)) {
      throw AppError.unauthorized('Token has been revoked');
    }

    return decoded;
  }

  async issueTokenPair({
    portal,
    subject,
    role,
    claims = {},
    sessionMeta = {},
  }) {
    const familyId = randomUuid();
    const access = this.signAccessToken({ sub: subject, role, ...claims }, portal);
    const refresh = this.signRefreshToken({
      sub: subject,
      role,
      familyId,
      ...claims,
    }, portal);

    const expiresAt = new Date(Date.now() + JWT.REFRESH_EXPIRY_SECONDS * 1000);

    await this.refreshTokenRepository.revokeOldestSessions(
      subject,
      portal,
      SESSION.MAX_ACTIVE_SESSIONS - 1
    );

    await this.refreshTokenRepository.createToken({
      userId: subject,
      portal,
      tokenHash: sha256(refresh.token),
      familyId,
      jti: refresh.jti,
      deviceId: sessionMeta.deviceId || null,
      userAgent: sessionMeta.userAgent || null,
      ipAddress: sessionMeta.ipAddress || null,
      expiresAt,
    });

    return {
      accessToken: access.token,
      refreshToken: refresh.token,
      accessJti: access.jti,
      refreshJti: refresh.jti,
      familyId,
      expiresIn: portalConfigExpiryToSeconds(this._portalConfig(portal).accessExpiry),
      refreshExpiresIn: JWT.REFRESH_EXPIRY_SECONDS,
    };
  }

  async refreshTokens(refreshToken, portal, sessionMeta = {}) {
    const decoded = this.verifyToken(refreshToken, portal, 'refresh');
    const stored = await this.refreshTokenRepository.findByTokenHash(refreshToken);

    if (!stored) {
      if (decoded.familyId) {
        await this.refreshTokenRepository.revokeFamily(decoded.familyId);
      }

      throw AppError.unauthorized('Refresh token reuse detected');
    }

    if (stored.revokedAt) {
      await this.refreshTokenRepository.revokeFamily(stored.familyId);
      throw AppError.unauthorized('Refresh token reuse detected');
    }

    if (stored.expiresAt <= new Date()) {
      throw AppError.unauthorized('Refresh token expired');
    }

    const newRefresh = this.signRefreshToken({
      sub: decoded.sub,
      role: decoded.role,
      familyId: stored.familyId,
      sellerId: decoded.sellerId,
      permissions: decoded.permissions,
    }, portal);

    const newAccess = this.signAccessToken({
      sub: decoded.sub,
      role: decoded.role,
      sellerId: decoded.sellerId,
      permissions: decoded.permissions,
    }, portal);

    await this.refreshTokenRepository.revokeById(
      stored._id,
      sha256(newRefresh.token)
    );

    const expiresAt = new Date(Date.now() + JWT.REFRESH_EXPIRY_SECONDS * 1000);

    await this.refreshTokenRepository.createToken({
      userId: decoded.sub,
      portal,
      tokenHash: sha256(newRefresh.token),
      familyId: stored.familyId,
      jti: newRefresh.jti,
      deviceId: sessionMeta.deviceId || stored.deviceId,
      userAgent: sessionMeta.userAgent || stored.userAgent,
      ipAddress: sessionMeta.ipAddress || stored.ipAddress,
      expiresAt,
    });

    return {
      accessToken: newAccess.token,
      refreshToken: newRefresh.token,
      accessJti: newAccess.jti,
      refreshJti: newRefresh.jti,
      expiresIn: portalConfigExpiryToSeconds(this._portalConfig(portal).accessExpiry),
      refreshExpiresIn: JWT.REFRESH_EXPIRY_SECONDS,
    };
  }

  async logout({ portal, refreshToken, accessToken }) {
    if (refreshToken) {
      const stored = await this.refreshTokenRepository.findByTokenHash(refreshToken);
      if (stored) {
        await this.refreshTokenRepository.revokeById(stored._id);
      }
    }

    if (accessToken) {
      try {
        const decoded = this.verifyToken(accessToken, portal, 'access');
        await this.blacklistAccessToken(decoded.jti, decoded.exp);
      } catch (_error) {
        // Ignore invalid access token on logout
      }
    }
  }

  async revokeAllSessions(userId, portal) {
    await this.refreshTokenRepository.model.updateMany(
      { userId, portal, revokedAt: null },
      { revokedAt: new Date() }
    );
  }
}

function portalConfigExpiryToSeconds(expiry) {
  if (expiry.endsWith('m')) {
    return parseInt(expiry, 10) * 60;
  }

  if (expiry.endsWith('h')) {
    return parseInt(expiry, 10) * 3600;
  }

  if (expiry.endsWith('d')) {
    return parseInt(expiry, 10) * 86400;
  }

  return 900;
}

module.exports = {
  TokenService,
};
