import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  allProducts: [],
  categories: [],
  banners: [],
  loading: false,
  error: null,
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.allProducts = action.payload;
    },
    setCategories: (state, action) => {
      state.categories = action.payload;
    },
    setBanners: (state, action) => {
      state.banners = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    addProduct: (state, action) => {
      state.allProducts.push({ ...action.payload, status: 'Pending', sales: 0 });
    },
    updateProduct: (state, action) => {
      const index = state.allProducts.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) state.allProducts[index] = { ...state.allProducts[index], ...action.payload };
    },
    approveProduct: (state, action) => {
      const product = state.allProducts.find((p) => p.id === action.payload);
      if (product) product.status = 'Approved';
    },
    deleteProduct: (state, action) => {
      state.allProducts = state.allProducts.filter((p) => p.id !== action.payload);
    },
  },
});

export const {
  setProducts,
  setCategories,
  setBanners,
  setLoading,
  setError,
  addProduct,
  updateProduct,
  approveProduct,
  deleteProduct,
} = productSlice.actions;
export default productSlice.reducer;
