const Counter = require('../models/Counter');

const COUNTER_NAME = 'customerId';
const PREFIX = 'MK';
const PAD = 6;

/** 1 -> "MK000001". Numbers past 999999 simply grow ("MK1000000"). */
function formatCustomerId(n) {
  return `${PREFIX}${String(n).padStart(PAD, '0')}`;
}

const CUSTOMER_ID_PATTERN = /^MK\d{6,}$/;

/**
 * Next unique customer id. The increment is atomic in MongoDB, so two
 * customers registering at the same moment can never receive the same id,
 * across every PM2 worker.
 */
async function nextCustomerId() {
  const counter = await Counter.findOneAndUpdate(
    { _id: COUNTER_NAME },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return formatCustomerId(counter.seq);
}

module.exports = { nextCustomerId, formatCustomerId, CUSTOMER_ID_PATTERN, COUNTER_NAME };
