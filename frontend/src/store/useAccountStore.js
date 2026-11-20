import { create } from 'zustand';

// Remember the customer's delivery choice across reloads.
// deliveryMode: 'auto' (live GPS if available, else saved), 'saved', 'live'
const readPref = (key) => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const writePref = (key, value) => {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, String(value));
  } catch { /* ignore */ }
};

const useAccountStore = create((set) => ({
  userProfile: {
    name: '',
    email: '',
    phone: '',
    gender: '',
    dob: '',
    avatar: null,
  },
  savedAddresses: [],
  savedCards: [],
  orders: [],
  wishlist: [],
  coupons: [],
  notifications: [],
  selectedAddressId: readPref('mk_selected_address_id'),
  deliveryMode: readPref('mk_delivery_mode') || 'auto',
  isDarkMode: false,

  setSelectedAddress: (id) => {
    writePref('mk_selected_address_id', id);
    set({ selectedAddressId: id });
  },

  // Customer explicitly picked a saved address from the "Deliver to" sheet.
  chooseSavedAddress: (id) => {
    writePref('mk_selected_address_id', id);
    writePref('mk_delivery_mode', 'saved');
    set({ selectedAddressId: id, deliveryMode: 'saved' });
  },

  setDeliveryMode: (mode) => {
    writePref('mk_delivery_mode', mode);
    set({ deliveryMode: mode });
  },

  setSavedAddresses: (savedAddresses) => set({ savedAddresses }),

  toggleDarkMode: () => set({ isDarkMode: false }),

  updateProfile: (newData) =>
    set((state) => ({
      userProfile: { ...state.userProfile, ...newData },
    })),

  setOrders: (orders) => set({ orders }),

  setWishlist: (wishlist) => set({ wishlist }),

  setCoupons: (coupons) => set({ coupons }),

  addAddress: (address) =>
    set((state) => ({
      savedAddresses: [...state.savedAddresses, { ...address, id: Date.now() }],
    })),

  removeAddress: (id) =>
    set((state) => ({
      savedAddresses: state.savedAddresses.filter((a) => a.id !== id),
    })),

  updateAddress: (updatedAddr) =>
    set((state) => ({
      savedAddresses: state.savedAddresses.map((a) =>
        a.id === updatedAddr.id ? updatedAddr : a
      ),
    })),

  addCard: (card) =>
    set((state) => ({
      savedCards: [...state.savedCards, { ...card, id: Date.now() }],
    })),

  removeCard: (id) =>
    set((state) => ({
      savedCards: state.savedCards.filter((c) => c.id !== id),
    })),

  addToWishlist: (product) =>
    set((state) => ({
      wishlist: [...(Array.isArray(state.wishlist) ? state.wishlist : []), product],
    })),

  removeFromWishlist: (id) =>
    set((state) => ({
      wishlist: (Array.isArray(state.wishlist) ? state.wishlist : []).filter((item) => item.id !== id),
    })),

  addOrder: (order) =>
    set((state) => ({
      orders: [order, ...state.orders],
    })),
}));

export default useAccountStore;
