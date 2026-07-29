const { BaseRepository } = require('../core/BaseRepository');
const UserNotification = require('../models/UserNotification');

class UserNotificationRepository extends BaseRepository {
  constructor() { super(UserNotification); }

  async findByUser(userId, options = {}) {
    return this.find({ userId, deletedAt: null }, options);
  }

  async countUnread(userId) {
    return this.count({ userId, isRead: false, deletedAt: null });
  }

  async markAllRead(userId) {
    return this.model.updateMany(
      { userId, isRead: false, deletedAt: null },
      { isRead: true, readAt: new Date() }
    );
  }
}

module.exports = { UserNotificationRepository };
