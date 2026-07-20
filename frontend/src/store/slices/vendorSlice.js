import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentVendor: null,
  earnings: { totalRevenue: 0, withdrawable: 0, pending: 0, payoutHistory: [] },
  inventory: { totalProducts: 0, outOfStock: 0, pendingApproval: 0 },
  loading: false,
  error: null,
};

const vendorSlice = createSlice({
  name: 'vendor',
  initialState,
  reducers: {
    setCurrentVendor: (state, action) => {
      state.currentVendor = action.payload;
    },
    setEarnings: (state, action) => {
      state.earnings = action.payload;
    },
    setInventory: (state, action) => {
      state.inventory = action.payload;
    },
    updateVendorProfile: (state, action) => {
      state.currentVendor = { ...state.currentVendor, ...action.payload };
    },
    addPayoutRequest: (state, action) => {
      state.earnings.payoutHistory.unshift({
        id: `TX${Date.now()}`,
        amount: action.payload,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
      });
      state.earnings.withdrawable -= action.payload;
    },
  },
});

export const {
  setCurrentVendor,
  setEarnings,
  setInventory,
  updateVendorProfile,
  addPayoutRequest,
} = vendorSlice.actions;
export default vendorSlice.reducer;
