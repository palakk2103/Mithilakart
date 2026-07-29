import customerApi from '../../../shared/api/client';

export const getHome = (commerceFlow) =>
  customerApi.get('/storefront/home', { params: commerceFlow ? { commerceFlow } : {} });

export const getFlowHome = (flow) => customerApi.get(`/storefront/${flow}/home`);

export const getBanners = (commerceFlow) =>
  customerApi.get('/storefront/banners', { params: commerceFlow ? { commerceFlow } : {} });

export const getCmsPage = (slug) => customerApi.get(`/cms/${slug}`);

export const getLegalPage = (type) => customerApi.get(`/cms/legal/${type}`);
