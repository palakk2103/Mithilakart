import customerApi from '../../../shared/api/client';

export const getPackages = (marketplaceTab) =>
  customerApi.get('/packages', { params: marketplaceTab ? { marketplaceTab } : undefined });

export const getPackage = (idOrSlug) => customerApi.get(`/packages/${idOrSlug}`);

// The server is the price authority; this is only used to confirm a selection.
export const quotePackage = (idOrSlug, selectedItemIds) =>
  customerApi.post(`/packages/${idOrSlug}/quote`, { selectedItemIds });
