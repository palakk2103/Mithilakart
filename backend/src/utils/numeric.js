/**
 * Numeric coercion that treats "absent" as absent.
 *
 * `Number.isFinite(Number(x))` is a trap: Number(null), Number(''), Number([])
 * and Number(false) are all 0, which is finite. Anything using that check to
 * decide "was a value supplied?" silently reads a missing value as zero — for
 * CR-002 that meant a seller with the default `preparationTimeMinutes: null`
 * getting 0 preparation time instead of the configured default, and every
 * quick-commerce ETA coming out too short.
 */

/**
 * True only for values that genuinely represent a finite number.
 *
 * Allow-list rather than deny-list: null, undefined, booleans, arrays, objects
 * and blank strings all coerce to 0 under Number(), so enumerating them is
 * error-prone. Only an actual number, or a string that parses as one, counts.
 */
function isFiniteNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value);

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed !== '' && Number.isFinite(Number(trimmed));
  }

  return false;
}

/** Coerces to a finite number, or returns `fallback` when truly absent. */
function toFiniteNumber(value, fallback = null) {
  return isFiniteNumber(value) ? Number(value) : fallback;
}

module.exports = {
  isFiniteNumber,
  toFiniteNumber,
};
