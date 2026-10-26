const { BaseService } = require('../../core/BaseService');
const { ERROR_CODES } = require('../../constants/errorCodes');
const { FULFILLMENT_FAILURE_CODE: FAIL } = require('../../constants/fulfillment');
const { logger } = require('../../utils/logger');

/**
 * CR-002 — all-or-nothing complete-cart inventory reservation.
 *
 * This is a WRAPPER around the existing atomic primitive in
 * ProductRepository.reserveStock:
 *
 *   updateOne(
 *     { _id, deletedAt: null,
 *       $expr: { $gte: [{ $subtract: ['$stock', '$reservedStock'] }, qty] } },
 *     { $inc: { reservedStock: qty } })
 *
 * That is a single-document conditional update, so MongoDB applies it
 * atomically and two concurrent callers cannot both match. No second inventory
 * mechanism is introduced here, and no direct Product write is ever made.
 *
 * What this service adds is the CR-002 rule the primitive alone cannot give:
 * either EVERY line is reserved, or NONE is.
 */
class FulfillmentReservationService extends BaseService {
  constructor({ productRepository, fulfillmentAttemptRepository }) {
    super();
    this.productRepository = productRepository;
    this.fulfillmentAttemptRepository = fulfillmentAttemptRepository;
  }

  /**
   * Deterministic ordering.
   *
   * Two concurrent multi-item reservations that walked their items in
   * different orders could each hold what the other needs. Sorting by
   * productId gives every caller the same global order, so that cycle cannot
   * form — one caller simply fails fast and rolls back.
   */
  _orderItems(resolvedItems) {
    return [...resolvedItems].sort((a, b) => String(a.productId).localeCompare(String(b.productId)));
  }

  /**
   * Reserves the complete cart, or nothing at all.
   *
   * Never throws past its own boundary: a failed candidate is ordinary control
   * flow for the engine, not an exception that should abort the whole
   * fulfillment or roll back an enclosing transaction.
   */
  async reserveCompleteCart({ resolvedItems, attempt = null, session = null, traceId = null }) {
    if (!Array.isArray(resolvedItems) || resolvedItems.length === 0) {
      return { ok: false, code: FAIL.SELLER_MISSING_PRODUCT, reserved: [] };
    }

    const ordered = this._orderItems(resolvedItems);
    const reserved = [];

    for (const item of ordered) {
      try {
        await this.productRepository.reserveStock(item.productId, item.quantity, session);
        reserved.push({ productId: item.productId, quantity: item.quantity, releasedAt: null });
      } catch (error) {
        // Lost the race to a concurrent order, or stock moved between the
        // eligibility read and this write. Expected under load — the
        // reservation, not the read, is what decides the winner.
        const isStockFailure = error?.code === ERROR_CODES.OUT_OF_STOCK;

        logger.info({
          traceId,
          productId: String(item.productId),
          quantity: item.quantity,
          reservedSoFar: reserved.length,
          reason: isStockFailure ? 'lost_race' : 'error',
        }, 'CR-002 complete-cart reservation failed — rolling back');

        await this._rollback(reserved, session, traceId);

        return {
          ok: false,
          code: isStockFailure ? FAIL.RESERVATION_LOST_RACE : FAIL.SELLER_INSUFFICIENT_QUANTITY,
          failedProductId: item.productId,
          reserved: [],
        };
      }
    }

    // Persist BEFORE returning success. If the process dies after this point,
    // the sweeper can read reservations[] and release exactly what was taken.
    if (attempt && this.fulfillmentAttemptRepository) {
      try {
        await this.fulfillmentAttemptRepository.updateById(
          attempt._id,
          { reservations: reserved },
          session
        );
      } catch (error) {
        // The stock is held but unrecorded, which would strand it. Undo
        // immediately rather than leak inventory.
        logger.error({ err: error, traceId, attemptId: String(attempt._id) },
          'CR-002 failed to persist reservations — rolling back to avoid stranded stock');
        await this._rollback(reserved, session, traceId);
        return { ok: false, code: FAIL.RESERVATION_LOST_RACE, reserved: [] };
      }
    }

    return { ok: true, code: null, reserved };
  }

  /**
   * Releases in reverse order. Best-effort per line: one failed release must
   * not prevent the remaining lines from being returned to stock.
   */
  async _rollback(reserved, session, traceId) {
    for (const entry of [...reserved].reverse()) {
      try {
        await this.productRepository.releaseReservedStock(entry.productId, entry.quantity, session);
      } catch (error) {
        // The only failure mode that can genuinely strand stock — loud on purpose.
        logger.error({
          err: error, traceId, productId: String(entry.productId), quantity: entry.quantity,
        }, 'CR-002 rollback failed — stock may be stranded and needs reconciliation');
      }
    }
  }

  /**
   * Releases everything an attempt holds, on seller reject, timeout, or crash
   * recovery.
   *
   * Only entries with `releasedAt: null` are touched, so a sweeper that runs
   * twice — or races a seller rejection — cannot double-release the same
   * stock and inflate availability.
   */
  async releaseAttempt(attempt, session = null, traceId = null) {
    if (!attempt?.reservations?.length) return { released: 0 };

    const outstanding = attempt.reservations.filter((entry) => !entry.releasedAt);
    if (!outstanding.length) return { released: 0 };

    let released = 0;
    for (const entry of outstanding) {
      try {
        await this.productRepository.releaseReservedStock(entry.productId, entry.quantity, session);
        released += 1;
      } catch (error) {
        logger.error({
          err: error, traceId, attemptId: String(attempt._id), productId: String(entry.productId),
        }, 'CR-002 release failed — stock may be stranded and needs reconciliation');
      }
    }

    if (this.fulfillmentAttemptRepository) {
      await this.fulfillmentAttemptRepository.markReservationsReleased(attempt._id, session);
    }

    logger.info({ traceId, attemptId: String(attempt._id), released },
      'CR-002 attempt reservations released');

    return { released };
  }

  /**
   * Converts reservations into a permanent stock decrement at delivery.
   * Delegates to the existing decrementStock, which lowers stock and
   * reservedStock together.
   */
  async commitAttempt(attempt, session = null) {
    if (!attempt?.reservations?.length) return { committed: 0 };

    let committed = 0;
    for (const entry of attempt.reservations) {
      if (entry.releasedAt) continue;
      await this.productRepository.decrementStock(entry.productId, entry.quantity, session);
      committed += 1;
    }

    return { committed };
  }
}

module.exports = { FulfillmentReservationService };
