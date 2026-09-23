import { configureStore } from '@reduxjs/toolkit';

import { baseApi } from '@/api/baseApi';
import authReducer from '@/features/auth/authSlice';
import { saveCartItems } from '@/features/cart/cartStorage';
import cartReducer from '@/features/cart/cartSlice';
import uiReducer from '@/features/ui/uiSlice';
import { saveWishlistItems } from '@/features/wishlist/wishlistStorage';
import wishlistReducer from '@/features/wishlist/wishlistSlice';

import '@/api/authApi';
import '@/api/cartApi';
import '@/api/categoriesApi';
import '@/api/ordersApi';
import '@/api/productsApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    ui: uiReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
});

let lastCart = store.getState().cart;
let lastWishlist = store.getState().wishlist;

store.subscribe(() => {
  const state = store.getState();

  if (state.cart !== lastCart) {
    lastCart = state.cart;
    saveCartItems(state.cart.items);
  }

  if (state.wishlist !== lastWishlist) {
    lastWishlist = state.wishlist;
    saveWishlistItems(state.wishlist.items);
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
