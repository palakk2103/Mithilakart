import { create } from 'zustand';
import { getHome, getFlowHome } from '../modules/user/services/storefrontApi';
import { mapStorefrontSections } from '../modules/user/utils/mappers';

const emptyHomeSections = {
  trendingThisWeek: [],
  todaysSpecialDeals: [],
  topSelection: [],
  brandsSpotlight: [],
  bestQualityGuaranteed: [],
  stillLooking: [],
  bestQuality: [],
  keepShopping: [],
};

const emptyStorefrontMeta = {
  homeChips: [],
  homeCategories: [],
};

const getInitialFlow = () => {
  if (typeof window === 'undefined') return 'mithilakart';
  const path = window.location.pathname;
  if (path.includes('/mithilak')) return 'mithilak';
  if (path.includes('/fresh-grocery')) return 'freshgrocery';
  if (path.includes('/quick-shop')) {
    return localStorage.getItem('isMithilakFlow') === 'true' ? 'mithilak' : 'quickshop';
  }
  if (localStorage.getItem('isMithilakFlow') === 'true') return 'mithilak';
  if (localStorage.getItem('isFreshGroceryFlow') === 'true') return 'freshgrocery';
  if (localStorage.getItem('isQuickShopFlow') === 'true') return 'quickshop';
  return 'mithilakart';
};

const useVendorStore = create((set, get) => ({
  activeFlow: getInitialFlow(),
  setActiveFlow: (flow) => {
    localStorage.setItem('isMithilakFlow', flow === 'mithilak' ? 'true' : 'false');
    localStorage.setItem('isQuickShopFlow', flow === 'quickshop' ? 'true' : 'false');
    localStorage.setItem('isFreshGroceryFlow', flow === 'freshgrocery' ? 'true' : 'false');
    set({ activeFlow: flow });
  },
  selectedCategory: 'You Buy',
  setSelectedCategory: (category) => set({ selectedCategory: category }),

  isSaleBannerVisible: true,
  setSaleBannerVisible: (visible) => set({ isSaleBannerVisible: visible }),

  homeSections: { ...emptyHomeSections },
  homeBanners: [],
  ...emptyStorefrontMeta,
  homeLoading: false,
  homeError: null,

  setHomeSections: (newSections) =>
    set((state) => ({
      homeSections: { ...state.homeSections, ...newSections },
    })),

  setHomeBanners: (banners) => set({ homeBanners: banners }),

  fetchHomeSections: async (commerceFlow) => {
    set({ homeLoading: true, homeError: null });
    try {
      const data = commerceFlow
        ? await getHome(commerceFlow)
        : await getHome();

      const mapped = mapStorefrontSections(data, get().homeSections);
      const isStandardFlow = !commerceFlow || commerceFlow === 'standard';
      set({
        homeSections: mapped,
        homeBanners: data?.banners || [],
        ...(isStandardFlow
          ? {
              homeChips: data?.chips || [],
              homeCategories: data?.categories || [],
            }
          : {}),
        homeLoading: false,
      });
      return data;
    } catch (err) {
      set({ homeLoading: false, homeError: err.message || 'Failed to load home' });
      return null;
    }
  },

  fetchFlowHome: async (flow) => {
    set({ homeLoading: true, homeError: null });
    try {
      const data = await getFlowHome(flow);
      const mapped = mapStorefrontSections(data, get().homeSections);
      set({
        homeSections: mapped,
        homeBanners: data?.banners || [],
        homeLoading: false,
      });
      return data;
    } catch (err) {
      set({ homeLoading: false, homeError: err.message || 'Failed to load home' });
      return null;
    }
  },

  fetchStandardNav: async () => get().fetchHomeSections('standard'),
}));

export default useVendorStore;
