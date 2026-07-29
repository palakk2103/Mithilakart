const { mongoose } = require('../config/database');
const { AppError } = require('../utils/AppError');
const { logger } = require('../utils/logger');

async function withTransaction(callback) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const result = await callback(session);
    await session.commitTransaction();
    return result;
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
}

module.exports = {
  withTransaction,
};
