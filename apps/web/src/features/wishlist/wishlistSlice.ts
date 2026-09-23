import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import { loadWishlistItems } from '@/features/wishlist/wishlistStorage';
import type { WishlistItem, WishlistItemInput } from '@/types/wishlist';

export interface WishlistState {
  items: WishlistItem[];
}

const initialState: WishlistState = {
  items: loadWishlistItems(),
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlist: {
      reducer(state, action: PayloadAction<WishlistItem>) {
        if (!state.items.some((item) => item.productId === action.payload.productId)) {
          state.items.push(action.payload);
        }
      },
      prepare(input: WishlistItemInput) {
        return { payload: { ...input, addedAt: new Date().toISOString() } };
      },
    },
    removeFromWishlist(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.productId !== action.payload);
    },
    toggleWishlist: {
      reducer(state, action: PayloadAction<WishlistItem>) {
        const exists = state.items.some((item) => item.productId === action.payload.productId);

        state.items = exists
          ? state.items.filter((item) => item.productId !== action.payload.productId)
          : [...state.items, action.payload];
      },
      prepare(input: WishlistItemInput) {
        return { payload: { ...input, addedAt: new Date().toISOString() } };
      },
    },
    clearWishlist(state) {
      state.items = [];
    },
  },
});

export const { addToWishlist, removeFromWishlist, toggleWishlist, clearWishlist } =
  wishlistSlice.actions;

export default wishlistSlice.reducer;

interface WishlistRootState {
  wishlist: WishlistState;
}

export const selectWishlistItems = (state: WishlistRootState) => state.wishlist.items;

export const selectWishlistCount = (state: WishlistRootState) => state.wishlist.items.length;

export const selectIsWishlisted = (state: WishlistRootState, productId: string) =>
  state.wishlist.items.some((item) => item.productId === productId);
