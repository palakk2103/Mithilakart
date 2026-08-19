const { logger } = require('../../utils/logger');

/**
 * CR-002 — deadline sweeper.
 *
 * This exists because QueueManager has no adapter wired (see
 * docs/cr-002/02 §14). Holding acceptance timeouts in setTimeout would lose
 * every pending fulfillment on a restart, and would fire twice — or not at
 * all — across multiple app instances.
 *
 * Instead, deadlines are absolute timestamps in MongoDB and this sweeper acts
 * on whatever has expired. A late sweep is still correct, just slower; a
 * missed tick self-heals on the next one.
 *
 * Every action is idempotent and guarded by compare-and-set, so two instances
 * running this concurrently cannot double-release stock or double-transition a
 * fulfillment.
 */
class FulfillmentSweeper {
  constructor({
    orderFulfillmentRepository,
    fulfillmentEngineService,
    fulfillmentConfigService,
    // CR-002 P9 — optional; without them, delivery offers are simply not swept
    // (which is correct in broadcast mode, where no offers exist).
    deliveryAssignmentRepository = null,
    deliveryOrderService = null,
  }) {
    this.orderFulfillmentRepository = orderFulfillmentRepository;
    this.engine = fulfillmentEngineService;
    this.configService = fulfillmentConfigService;
    this.deliveryAssignmentRepository = deliveryAssignmentRepository;
    this.deliveryOrderService = deliveryOrderService;
    this._timer = null;
    this._running = false;
    this._stopped = true;
  }

  /** Wired after construction: DeliveryOrderService is built later in the container. */
  setDeliveryOrderService(deliveryOrderService) {
    this.deliveryOrderService = deliveryOrderService;
  }

  /** One pass. Safe to call directly (tests, admin tooling) as well as on a tick. */
  async sweepOnce(now = new Date()) {
    const result = {
      acceptanceTimeouts: 0, searchTimeouts: 0, deliveryOfferTimeouts: 0, errors: 0,
    };

    try {
      const expiredAcceptances = await this.orderFulfillmentRepository.findExpiredAcceptances(now);
      for (const fulfillment of expiredAcceptances) {
        try {
          await this.engine.handleAcceptanceTimeout(fulfillment);
          result.acceptanceTimeouts += 1;
        } catch (error) {
          result.errors += 1;
          logger.error({ err: error, fulfillmentId: String(fulfillment._id), traceId: fulfillment.traceId },
            'CR-002 sweeper failed to process an acceptance timeout');
        }
      }

      const expiredSearches = await this.orderFulfillmentRepository.findExpiredSearches(now);
      for (const fulfillment of expiredSearches) {
        try {
          // attemptNext re-checks the deadline itself and escalates.
          await this.engine.attemptNext(fulfillment._id);
          result.searchTimeouts += 1;
        } catch (error) {
          result.errors += 1;
          logger.error({ err: error, fulfillmentId: String(fulfillment._id), traceId: fulfillment.traceId },
            'CR-002 sweeper failed to process a search timeout');
        }
      }
    } catch (error) {
      result.errors += 1;
      logger.error({ err: error }, 'CR-002 sweeper pass failed');
    }

    // CR-002 P9 — expired delivery partner offers.
    if (this.deliveryAssignmentRepository && this.deliveryOrderService) {
      try {
        const expiredOffers = await this.deliveryAssignmentRepository.findExpiredOffers(now);
        for (const assignment of expiredOffers) {
          try {
            await this.deliveryOrderService.handleOfferTimeout(assignment);
            result.deliveryOfferTimeouts += 1;
          } catch (error) {
            result.errors += 1;
            logger.error({ err: error, assignmentId: String(assignment._id) },
              'CR-002 sweeper failed to process a delivery offer timeout');
          }
        }
      } catch (error) {
        result.errors += 1;
        logger.error({ err: error }, 'CR-002 sweeper delivery offer pass failed');
      }
    }

    if (result.acceptanceTimeouts || result.searchTimeouts
      || result.deliveryOfferTimeouts || result.errors) {
      logger.info(result, 'CR-002 sweeper pass complete');
    }

    return result;
  }

  async _tick() {
    // Skip rather than queue: a slow pass must not stack up behind itself.
    if (this._running || this._stopped) return;

    this._running = true;
    try {
      await this.sweepOnce();
    } finally {
      this._running = false;
    }
  }

  async start() {
    if (!this._stopped) return this;
    this._stopped = false;

    let intervalSeconds = 15;
    try {
      const config = await this.configService.resolve(null);
      intervalSeconds = config.sweeperIntervalSeconds;
    } catch (error) {
      logger.warn({ err: error }, 'CR-002 sweeper using default interval — config unavailable');
    }

    this._timer = setInterval(() => { this._tick(); }, intervalSeconds * 1000);
    // Never hold the event loop open on shutdown.
    if (typeof this._timer.unref === 'function') this._timer.unref();

    logger.info({ intervalSeconds }, 'CR-002 fulfillment sweeper started');
    return this;
  }

  stop() {
    this._stopped = true;
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    logger.info('CR-002 fulfillment sweeper stopped');
  }
}

module.exports = { FulfillmentSweeper };
