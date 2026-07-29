const { BaseRepository } = require('../core/BaseRepository');
const RefreshToken = require('../models/RefreshToken');
const { sha256 } = require('../utils/cryptoHelper');

class RefreshTokenRepository extends BaseRepository {
  constructor() {
    super(RefreshToken);
  }

  async createToken(data, session = null) {
    return this.create(data, session);
  }

  async findByTokenHash(token) {
    return this.findOne({ tokenHash: sha256(token), revokedAt: null });
  }

  async revokeById(id, replacedByTokenHash = null, session = null) {
    return this.updateById(id, {
      revokedAt: new Date(),
      ...(replacedByTokenHash ? { replacedByTokenHash } : {}),
    }, session);
  }

  async revokeFamily(familyId, session = null) {
    const query = this.model.updateMany(
      { familyId, revokedAt: null },
      { revokedAt: new Date() }
    );

    if (session) {
      query.session(session);
    }

    return query.exec();
  }

  async listActiveByUser(userId, portal) {
    return this.find({
      userId,
      portal,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }, { sort: { createdAt: 1 } });
  }

  async revokeOldestSessions(userId, portal, keepCount, session = null) {
    const activeTokens = await this.listActiveByUser(userId, portal);
    const excess = activeTokens.length - keepCount;

    if (excess <= 0) {
      return [];
    }

    const toRevoke = activeTokens.slice(0, excess);
    const ids = toRevoke.map((token) => token._id);

    const query = this.model.updateMany(
      { _id: { $in: ids } },
      { revokedAt: new Date() }
    );

    if (session) {
      query.session(session);
    }

    await query.exec();
    return toRevoke;
  }
}

module.exports = {
  RefreshTokenRepository,
};
