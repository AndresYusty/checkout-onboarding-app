import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './slices/cartSlice';
import transactionReducer from './slices/transactionSlice';
import productReducer from './slices/productSlice';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    transaction: transactionReducer,
    product: productReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

