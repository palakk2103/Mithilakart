import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  pendingVendors: [],
  allVendors: [],
  systemStats: {
    totalRevenue: 0,
    totalOrders: 0,
    activeVendors: 0,
    platformCommission: 0,
  },
  payoutRequests: [],
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    approveVendor: (state, action) => {
      const vendorId = action.payload;
      const vendor = state.pendingVendors.find(v => v.id === vendorId);
      if (vendor) {
        vendor.status = 'Approved';
        state.allVendors.push(vendor);
        state.pendingVendors = state.pendingVendors.filter(v => v.id !== vendorId);
      }
    },
    rejectVendor: (state, action) => {
      state.pendingVendors = state.pendingVendors.filter(v => v.id !== action.payload);
    },
    updateSystemStats: (state, action) => {
      state.systemStats = { ...state.systemStats, ...action.payload };
    },
  },
});

export const { approveVendor, rejectVendor, updateSystemStats } = adminSlice.actions;
export default adminSlice.reducer;
