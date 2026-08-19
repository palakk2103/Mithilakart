const { mongoose } = require('../config/database');
const { AppError } = require('../utils/AppError');
const { logger } = require('../utils/logger');

/**
 * Runs `callback` inside a MongoDB transaction.
 *
 * The session handed to the callback carries an extra `afterCommit(fn)` hook.
 * Work registered through it runs ONLY after the transaction has committed, and
 * is discarded entirely if the transaction aborts.
 *
 * WHY THIS EXISTS (CR-002 Failure 4, docs/cr-002/REAL_FLOW_FAILURE_ANALYSIS.md):
 * order placement fired the fulfillment engine from inside the checkout
 * transaction, fire-and-forget. The engine then read the order on its own
 * connection — outside the uncommitted transaction — and could not see it, so
 * it logged "start called for a missing order" and the order was never
 * fulfilled at all. It was a race, so it failed intermittently and only under
 * real MongoDB: every unit test passed because they never opened a transaction.
 *
 * Post-commit work belongs here rather than at each call site, because the
 * same hazard applies to every side effect a transaction wants to trigger
 * (engine start, notifications, cache invalidation) and to every future caller.
 *
 * A hook that throws is logged and skipped: the transaction is already
 * committed and must not be reported as failed.
 */
async function withTransaction(callback) {
  const session = await mongoose.startSession();
  const afterCommitHooks = [];

  session.afterCommit = (fn) => {
    if (typeof fn === 'function') afterCommitHooks.push(fn);
  };

  let result;

  try {
    session.startTransaction();
    result = await callback(session);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    logger.error({ err: error }, 'Transaction aborted');

    if (error instanceof AppError) {
      throw error;
    }

    throw AppError.database('Transaction failed');
  } finally {
    session.endSession();
  }

  // Committed. Hooks run here, with no session — the data they read is durable.
  for (const hook of afterCommitHooks) {
    try {
      await hook();
    } catch (err) {
      logger.error({ err }, 'after-commit hook failed');
    }
  }

  return result;
}

module.exports = {
  withTransaction,
};
