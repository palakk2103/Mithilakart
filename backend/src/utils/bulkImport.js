/**
 * Helpers shared by the spreadsheet (CSV / Excel) bulk importers.
 * Cells arrive from the browser as strings, numbers or booleans.
 */

const TRUE_VALUES = new Set(['true', 'yes', 'y', '1', 'active']);
const FALSE_VALUES = new Set(['false', 'no', 'n', '0', 'inactive']);

function cleanString(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function isBlank(value) {
  return cleanString(value) === '';
}

/** Returns true/false, null when blank, or undefined when unparseable. */
function parseBool(value) {
  if (typeof value === 'boolean') return value;
  const text = cleanString(value).toLowerCase();
  if (!text) return null;
  if (TRUE_VALUES.has(text)) return true;
  if (FALSE_VALUES.has(text)) return false;
  return undefined;
}

/** Returns a number, null when blank, or NaN when unparseable. Accepts "₹1,299". */
function parseNumber(value) {
  if (typeof value === 'number') return value;
  const text = cleanString(value).replace(/[₹,\s]/g, '').replace(/^rs\.?/i, '');
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function isValidMediaUrl(value) {
  const text = cleanString(value);
  return text.startsWith('/') || /^https?:\/\/\S+$/i.test(text);
}

/** Splits "a, b | c" style multi-value cells. */
function splitList(value, separators = /[|,\n]/) {
  return cleanString(value)
    .split(separators)
    .map((part) => part.trim())
    .filter(Boolean);
}

function slugify(value) {
  return cleanString(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function lowerKey(value) {
  return cleanString(value).toLowerCase();
}

module.exports = {
  cleanString,
  isBlank,
  parseBool,
  parseNumber,
  isValidMediaUrl,
  splitList,
  slugify,
  lowerKey,
};
