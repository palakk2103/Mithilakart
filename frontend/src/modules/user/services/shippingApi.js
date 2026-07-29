import customerApi from '../../../shared/api/client';

export const checkShippingServiceability = (params) =>
  customerApi.get('/shipping/serviceability', { params });
