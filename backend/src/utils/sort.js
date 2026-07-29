function parseSortParam(sortParam, allowedFields = [], defaultSort = { createdAt: -1 }) {
  if (!sortParam) {
    return defaultSort;
  }

  const sortEntries = String(sortParam)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (sortEntries.length === 0) {
    return defaultSort;
  }

  const sort = {};

  sortEntries.forEach((entry) => {
    const descending = entry.startsWith('-');
    const field = descending ? entry.slice(1) : entry;

    if (allowedFields.length > 0 && !allowedFields.includes(field)) {
      return;
    }

    sort[field] = descending ? -1 : 1;
  });

  return Object.keys(sort).length > 0 ? sort : defaultSort;
}

function buildSortQuery(query, options = {}) {
  const sortKey = options.sortKey || 'sort';
  return parseSortParam(query[sortKey], options.allowedFields || [], options.defaultSort);
}

module.exports = {
  parseSortParam,
  buildSortQuery,
};
