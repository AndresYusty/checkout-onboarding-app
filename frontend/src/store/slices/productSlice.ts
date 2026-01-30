import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../../services/api';

interface ProductState {
  currentProduct: Product | null;
  products: Product[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  currentProduct: null,
  products: [],
  isLoading: false,
  error: null,
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setCurrentProduct: (state, action: PayloadAction<Product | null>) => {
      state.currentProduct = action.payload;
      if (action.payload) {
        localStorage.setItem('currentProduct', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('currentProduct');
      }
    },
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
    },
    updateProductStock: (state, action: PayloadAction<{ productId: string; newStock: number }>) => {
      const { productId, newStock } = action.payload;
      const product = state.products.find((p) => p.id === productId);
      if (product) {
        product.stock = newStock;
      }
      if (state.currentProduct?.id === productId) {
        state.currentProduct.stock = newStock;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setCurrentProduct, setProducts, updateProductStock, setLoading, setError } =
  productSlice.actions;

export default productSlice.reducer;

