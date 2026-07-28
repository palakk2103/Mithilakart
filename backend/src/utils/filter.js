const { pickDefined } = require('../helpers/objectHelper');

function parseMultiValue(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value;
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildExactMatchFilter(query, allowedFields = []) {
  const filter = {};

  allowedFields.forEach((field) => {
    const value = query[field];
    if (value === undefined || value === null || value === '') {
      return;
    }

    const values = parseMultiValue(value);
    if (values.length === 1) {
      filter[field] = values[0];
    } else if (values.length > 1) {
      filter[field] = { $in: values };
    }
  });

  return filter;
}

function buildRangeFilter(query, rangeConfig = []) {
  const filter = {};

  rangeConfig.forEach(({ minKey, maxKey, field, transform = Number }) => {
    const minValue = query[minKey];
    const maxValue = query[maxKey];

    if (minValue === undefined && maxValue === undefined) {
      return;
    }

    filter[field] = pickDefined({
      $gte: minValue !== undefined ? transform(minValue) : undefined,
      $lte: maxValue !== undefined ? transform(maxValue) : undefined,
    });
  });

  return filter;
}

function buildDateRangeFilter(query, fromKey = 'from', toKey = 'to', field = 'createdAt') {
  const from = query[fromKey];
  const to = query[toKey];

  if (!from && !to) {
    return {};
  }

  const range = pickDefined({
    $gte: from ? new Date(from) : undefined,
    $lte: to ? new Date(to) : undefined,
  });

  return range.$gte || range.$lte ? { [field]: range } : {};
}

function buildListFilters(query, config = {}) {
  const {
    exactFields = [],
    rangeFields = [],
    dateRange = null,
    baseFilter = {},
  } = config;

  return {
    ...baseFilter,
    ...buildExactMatchFilter(query, exactFields),
    ...buildRangeFilter(query, rangeFields),
    ...(dateRange ? buildDateRangeFilter(query, dateRange.fromKey, dateRange.toKey, dateRange.field) : {}),
  };
}

/** Map API query `commerceFlow` to Product schema field `commerceFlows` (array contains). */
function applyCommerceFlowFilter(filter, query = {}) {
  const flow = query.commerceFlow;
  if (!flow) return filter;
  const next = { ...filter };
  delete next.commerceFlow;
  next.commerceFlows = flow;
  return next;
}

module.exports = {
  parseMultiValue,
  buildExactMatchFilter,
  buildRangeFilter,
  buildDateRangeFilter,
  buildListFilters,
  applyCommerceFlowFilter,
};
