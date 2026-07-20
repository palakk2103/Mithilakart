import { create } from 'zustand';

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
  selectedAddressId: null,
  isDarkMode: false,

  setSelectedAddress: (id) => set({ selectedAddressId: id }),
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
      wishlist: [...state.wishlist, product],
    })),

  removeFromWishlist: (id) =>
    set((state) => ({
      wishlist: state.wishlist.filter((item) => item.id !== id),
    })),

  addOrder: (order) =>
    set((state) => ({
      orders: [order, ...state.orders],
    })),
}));

export default useAccountStore;
