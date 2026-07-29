const { logger } = require('../utils/logger');

class BaseJob {
  constructor(name) {
    this.name = name;
  }

  async execute(_payload, _context = {}) {
    throw new Error(`Job ${this.name} execute() is not implemented`);
  }

  async run(payload, context = {}) {
    logger.debug({ job: this.name }, 'Job execution stub (Phase 0)');
    return this.execute(payload, context);
  }
}

module.exports = {
  BaseJob,
};
