// Maps the storefront's sort labels / filter state to the API's query params so
// sorting and filtering happen on the server across the WHOLE catalogue, not
// just on the batches the infinite scroll has loaded so far.
const SORT_LABEL_TO_API = {
  'Price: Low to High': 'price',
  'Price: Low-High': 'price',
  'Price: High to Low': '-price',
  'Price: High-Low': '-price',
  'Customer Rating': '-rating',
  'Top Rated': '-rating',
  'Newest First': '-createdAt',
};

export const sortLabelToApi = (label) => SORT_LABEL_TO_API[label];

export const buildListParams = ({ sort, minPrice, maxPrice, minRating } = {}) => {
  const params = {};
  const apiSort = sortLabelToApi(sort);
  if (apiSort) params.sort = apiSort;
  if (minPrice !== '' && minPrice != null && Number.isFinite(Number(minPrice))) params.minPrice = Number(minPrice);
  if (maxPrice !== '' && maxPrice != null && Number.isFinite(Number(maxPrice))) params.maxPrice = Number(maxPrice);
  if (Number(minRating) > 0) params.minRating = Number(minRating);
  return params;
};

// Stable string for hook dependency arrays.
export const listParamsKey = (params) => JSON.stringify(params);
