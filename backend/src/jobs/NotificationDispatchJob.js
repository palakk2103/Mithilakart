const { BaseJob } = require('./BaseJob');

class NotificationDispatchJob extends BaseJob {
  constructor(notificationService) {
    super('notification-dispatch');
    this.notificationService = notificationService;
  }

  async execute(payload) {
    return this.notificationService.dispatch(payload);
  }
}

module.exports = { NotificationDispatchJob };
