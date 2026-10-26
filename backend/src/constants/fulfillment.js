/**
 * CR-002 — Intelligent Fulfillment & Hybrid Delivery
 *
 * Fulfillment lifecycle runs in parallel to ORDER_STATUS (constants/commerce.js).
 * The order status chain is deliberately NOT extended — see docs/cr-002/06.
 */

/** Where the order is ultimately fulfilled from. */
const FULFILLMENT_TYPE = {
  QUICK_LOCAL: 'quick_local',
  WAREHOUSE: 'warehouse',
  COURIER: 'courier',
};

const FULFILLMENT_TYPE_VALUES = Object.values(FULFILLMENT_TYPE);

/** Customer-facing delivery mode. Never a hardcoded ETA string. */
const DELIVERY_MODE = {
  QUICK: 'quick',
  STANDARD: 'standard',
};

const DELIVERY_MODE_VALUES = Object.values(DELIVERY_MODE);

/** OrderFulfillment.state — see docs/cr-002/06 for the transition table. */
const FULFILLMENT_STATE = {
  SEARCHING: 'searching',
  SELLER_ASSIGNED: 'seller_assigned',
  SELLER_ACCEPTED: 'seller_accepted',
  WAREHOUSE_PENDING: 'warehouse_pending',
  WAREHOUSE_ACCEPTED: 'warehouse_accepted',
  COURIER_PENDING: 'courier_pending',
  COURIER_ASSIGNED: 'courier_assigned',
  FULFILLED: 'fulfilled',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

const FULFILLMENT_STATE_VALUES = Object.values(FULFILLMENT_STATE);

const TERMINAL_FULFILLMENT_STATES = new Set([
  FULFILLMENT_STATE.FULFILLED,
  FULFILLMENT_STATE.FAILED,
  FULFILLMENT_STATE.CANCELLED,
]);

/** Legal transitions. Enforced by compare-and-set, never by trust. */
const FULFILLMENT_TRANSITIONS = {
  [FULFILLMENT_STATE.SEARCHING]: [
    FULFILLMENT_STATE.SELLER_ASSIGNED,
    FULFILLMENT_STATE.WAREHOUSE_PENDING,
    FULFILLMENT_STATE.COURIER_PENDING,
    FULFILLMENT_STATE.FAILED,
    FULFILLMENT_STATE.CANCELLED,
  ],
  [FULFILLMENT_STATE.SELLER_ASSIGNED]: [
    FULFILLMENT_STATE.SELLER_ACCEPTED,
    FULFILLMENT_STATE.SEARCHING,
    FULFILLMENT_STATE.WAREHOUSE_PENDING,
    FULFILLMENT_STATE.COURIER_PENDING,
    FULFILLMENT_STATE.FAILED,
    FULFILLMENT_STATE.CANCELLED,
  ],
  [FULFILLMENT_STATE.SELLER_ACCEPTED]: [
    FULFILLMENT_STATE.FULFILLED,
    FULFILLMENT_STATE.CANCELLED,
  ],
  [FULFILLMENT_STATE.WAREHOUSE_PENDING]: [
    FULFILLMENT_STATE.WAREHOUSE_ACCEPTED,
    FULFILLMENT_STATE.COURIER_PENDING,
    FULFILLMENT_STATE.FAILED,
    FULFILLMENT_STATE.CANCELLED,
  ],
  [FULFILLMENT_STATE.WAREHOUSE_ACCEPTED]: [
    FULFILLMENT_STATE.FULFILLED,
    FULFILLMENT_STATE.CANCELLED,
  ],
  [FULFILLMENT_STATE.COURIER_PENDING]: [
    FULFILLMENT_STATE.COURIER_ASSIGNED,
    FULFILLMENT_STATE.FAILED,
    FULFILLMENT_STATE.CANCELLED,
  ],
  [FULFILLMENT_STATE.COURIER_ASSIGNED]: [
    FULFILLMENT_STATE.FULFILLED,
    FULFILLMENT_STATE.CANCELLED,
  ],
  [FULFILLMENT_STATE.FULFILLED]: [],
  [FULFILLMENT_STATE.FAILED]: [],
  [FULFILLMENT_STATE.CANCELLED]: [],
};

function isValidFulfillmentTransition(fromState, toState) {
  return Boolean(FULFILLMENT_TRANSITIONS[fromState]?.includes(toState));
}

/** Fallback ladder depth, snapshotted onto the order. */
const FALLBACK_LEVEL = {
  PRIMARY_SELLER: 0,
  ALTERNATE_SELLER: 1,
  WAREHOUSE: 2,
  COURIER: 3,
};

/** FulfillmentAttempt.kind */
const ATTEMPT_KIND = {
  SELLER: 'seller',
  WAREHOUSE: 'warehouse',
  COURIER: 'courier',
};

const ATTEMPT_KIND_VALUES = Object.values(ATTEMPT_KIND);

/** FulfillmentAttempt.status */
const ATTEMPT_STATUS = {
  RESERVED: 'reserved',
  OFFERED: 'offered',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  TIMED_OUT: 'timed_out',
  RESERVATION_FAILED: 'reservation_failed',
  RELEASED: 'released',
};

const ATTEMPT_STATUS_VALUES = Object.values(ATTEMPT_STATUS);

/**
 * Internal failure codes recorded on attempts for admin traceability.
 * These are NEVER returned to a customer — see constants/errorCodes.js for
 * the customer-facing codes.
 */
const FULFILLMENT_FAILURE_CODE = {
  SELLER_NOT_APPROVED: 'SELLER_NOT_APPROVED',
  SELLER_INACTIVE: 'SELLER_INACTIVE',
  SELLER_NOT_ACCEPTING: 'SELLER_NOT_ACCEPTING',
  SELLER_TAB_INELIGIBLE: 'SELLER_TAB_INELIGIBLE',
  SELLER_MISSING_PRODUCT: 'SELLER_MISSING_PRODUCT',
  SELLER_INSUFFICIENT_QUANTITY: 'SELLER_INSUFFICIENT_QUANTITY',
  SELLER_LISTING_UNAVAILABLE: 'SELLER_LISTING_UNAVAILABLE',
  SELLER_OUT_OF_RADIUS: 'SELLER_OUT_OF_RADIUS',
  SELLER_NOT_SERVICEABLE: 'SELLER_NOT_SERVICEABLE',
  SELLER_NO_LOCATION: 'SELLER_NO_LOCATION',
  SELLER_REJECTED: 'SELLER_REJECTED',
  SELLER_TIMEOUT: 'SELLER_TIMEOUT',
  RESERVATION_LOST_RACE: 'RESERVATION_LOST_RACE',
  WAREHOUSE_DISABLED: 'WAREHOUSE_DISABLED',
  WAREHOUSE_UNAVAILABLE: 'WAREHOUSE_UNAVAILABLE',
  COURIER_DISABLED: 'COURIER_DISABLED',
  COURIER_UNAVAILABLE: 'COURIER_UNAVAILABLE',
  /**
   * The courier account is reachable but wrongly configured (e.g. the pickup
   * location nickname does not exist on the account). Distinct from
   * COURIER_UNAVAILABLE because it is a deterministic operator fix, not a
   * transient outage — retrying will never help, and it must page an operator
   * rather than hide inside a generic "unavailable".
   */
  COURIER_MISCONFIGURED: 'COURIER_MISCONFIGURED',
  SEARCH_TIMEOUT: 'SEARCH_TIMEOUT',
  NO_SELLER_AVAILABLE: 'NO_SELLER_AVAILABLE',
  ATTEMPTS_EXHAUSTED: 'ATTEMPTS_EXHAUSTED',
};

/** Delivery partner assignment strategy. Default preserves current behaviour. */
const DELIVERY_ASSIGNMENT_MODE = {
  BROADCAST: 'broadcast',
  RANKED: 'ranked',
};

const DELIVERY_ASSIGNMENT_MODE_VALUES = Object.values(DELIVERY_ASSIGNMENT_MODE);

/** Seller rejection reasons offered to the seller panel. */
const SELLER_REJECT_REASON = {
  OUT_OF_STOCK: 'out_of_stock',
  TOO_BUSY: 'too_busy',
  CLOSING_SOON: 'closing_soon',
  CANNOT_DELIVER: 'cannot_deliver',
  OTHER: 'other',
};

const SELLER_REJECT_REASON_VALUES = Object.values(SELLER_REJECT_REASON);

module.exports = {
  FULFILLMENT_TYPE,
  FULFILLMENT_TYPE_VALUES,
  DELIVERY_MODE,
  DELIVERY_MODE_VALUES,
  FULFILLMENT_STATE,
  FULFILLMENT_STATE_VALUES,
  TERMINAL_FULFILLMENT_STATES,
  FULFILLMENT_TRANSITIONS,
  isValidFulfillmentTransition,
  FALLBACK_LEVEL,
  ATTEMPT_KIND,
  ATTEMPT_KIND_VALUES,
  ATTEMPT_STATUS,
  ATTEMPT_STATUS_VALUES,
  FULFILLMENT_FAILURE_CODE,
  DELIVERY_ASSIGNMENT_MODE,
  DELIVERY_ASSIGNMENT_MODE_VALUES,
  SELLER_REJECT_REASON,
  SELLER_REJECT_REASON_VALUES,
};
