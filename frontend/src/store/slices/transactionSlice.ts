import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TransactionState {
  currentTransaction: {
    orderId?: string;
    paymentId?: string;
    status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
    productId?: string;
    quantity?: number;
  } | null;
  isLoading: boolean;
  error: string | null;
}

const loadTransactionFromStorage = () => {
  try {
    const stored = localStorage.getItem('currentTransaction');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const initialState: TransactionState = {
  currentTransaction: loadTransactionFromStorage(),
  isLoading: false,
  error: null,
};

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    setTransaction: (state, action: PayloadAction<TransactionState['currentTransaction']>) => {
      state.currentTransaction = action.payload;
      if (action.payload) {
        localStorage.setItem('currentTransaction', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('currentTransaction');
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearTransaction: (state) => {
      state.currentTransaction = null;
      state.error = null;
      localStorage.removeItem('currentTransaction');
    },
  },
});

export const { setTransaction, setLoading, setError, clearTransaction } = transactionSlice.actions;

export default transactionSlice.reducer;

