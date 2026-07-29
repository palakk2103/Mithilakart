const { logger } = require('../utils/logger');

class QueueManager {
  constructor() {
    this.queues = new Map();
    this.isConnected = false;
  }

  registerQueue(name, adapter = null) {
    this.queues.set(name, {
      name,
      adapter,
      isReady: Boolean(adapter),
    });
  }

  markConnected() {
    this.isConnected = true;
  }

  async addJob(queueName, jobName, data = {}, options = {}) {
    const queue = this.queues.get(queueName);

    if (!queue || !queue.adapter) {
      logger.debug({ queueName, jobName }, 'Queue adapter not configured — job skipped (Phase 0 stub)');
      return {
        queued: false,
        queueName,
        jobName,
        data,
        options,
      };
    }

    return queue.adapter.add(jobName, data, options);
  }

  isHealthy() {
    if (!this.isConnected) {
      return true;
    }

    return Array.from(this.queues.values()).every((queue) => !queue.adapter || queue.isReady);
  }
}

const queueManager = new QueueManager();

module.exports = {
  QueueManager,
  queueManager,
};
