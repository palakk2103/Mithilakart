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

export const getInitialFlow = () => {
  if (typeof window === 'undefined') return 'mithilakart';
  const path = window.location.pathname;
  if (path.includes('/quick-shop')) return 'quickshop';
  if (path.includes('/fresh-grocery')) return 'freshgrocery';
  if (path.includes('/mithilak')) return 'mithilak';
  if (path === '/home' || path === '/') return 'mithilakart';

  if (localStorage.getItem('isQuickShopFlow') === 'true') return 'quickshop';
  if (localStorage.getItem('isFreshGroceryFlow') === 'true') return 'freshgrocery';
  if (localStorage.getItem('isMithilakFlow') === 'true') return 'mithilak';
  return 'mithilakart';
};

const rememberFlow = (flow) => {
  try {
    localStorage.setItem('isMithilakFlow', flow === 'mithilak' ? 'true' : 'false');
    localStorage.setItem('isQuickShopFlow', flow === 'quickshop' ? 'true' : 'false');
    localStorage.setItem('isFreshGroceryFlow', flow === 'freshgrocery' ? 'true' : 'false');
  } catch { /* storage may be unavailable */ }
};

// A tab opened by URL or refreshed must be remembered too: otherwise refreshing the cart
// afterwards showed the previously visited tab's (often empty) cart and colours.
const initialFlow = getInitialFlow();
if (typeof window !== 'undefined') rememberFlow(initialFlow);

const useVendorStore = create((set, get) => ({
  activeFlow: initialFlow,
  setActiveFlow: (flow) => {
    rememberFlow(flow);
    set({ activeFlow: flow });
  },
  selectedCategory: 'You Buy',
  setSelectedCategory: (category) => set({ selectedCategory: category }),

  isSaleBannerVisible: true,
  setSaleBannerVisible: (visible) => set({ isSaleBannerVisible: visible }),

  homeSections: { ...emptyHomeSections },
  homeBanners: [],
  // Banners kept per commerce flow. The layout always loads the standard flow while a tab
  // (e.g. Mithilak) loads its own; a single shared list let whichever response landed last win.
  bannersByFlow: {},
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
      const flowKey = data?.commerceFlow || commerceFlow || 'standard';
      set((state) => ({
        homeSections: mapped,
        homeBanners: data?.banners || [],
        bannersByFlow: { ...state.bannersByFlow, [flowKey]: data?.banners || [] },
        ...(isStandardFlow
          ? {
              homeChips: data?.chips || [],
              homeCategories: data?.categories || [],
            }
          : {}),
        homeLoading: false,
      }));
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
      const flowKey = data?.commerceFlow || flow;
      set((state) => ({
        homeSections: mapped,
        homeBanners: data?.banners || [],
        bannersByFlow: { ...state.bannersByFlow, [flowKey]: data?.banners || [] },
        homeLoading: false,
      }));
      return data;
    } catch (err) {
      set({ homeLoading: false, homeError: err.message || 'Failed to load home' });
      return null;
    }
  },

  fetchStandardNav: async () => get().fetchHomeSections('standard'),

  refreshForLanguage: async (_lang) => {
    const flow = get().activeFlow;
    if (!flow || flow === 'mithilakart' || flow === 'standard') {
      return get().fetchHomeSections('standard');
    }
    return get().fetchFlowHome(flow);
  },
}));

export default useVendorStore;
