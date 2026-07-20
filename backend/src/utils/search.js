function buildTextSearchFilter(searchTerm, fields = []) {
  if (!searchTerm || !String(searchTerm).trim()) {
    return {};
  }

  const term = String(searchTerm).trim();

  if (fields.length === 0) {
    return { $text: { $search: term } };
  }

  const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  return {
    $or: fields.map((field) => ({ [field]: regex })),
  };
}

function buildSearchQuery(query, options = {}) {
  const searchKey = options.searchKey || 'search';
  const fields = options.fields || [];

  return buildTextSearchFilter(query[searchKey], fields);
}

module.exports = {
  buildTextSearchFilter,
  buildSearchQuery,
};
