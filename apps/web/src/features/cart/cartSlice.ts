import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import { loadCartItems } from '@/features/cart/cartStorage';
import type { AddCartItemInput, CartItem } from '@/types/cart';

export interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: loadCartItems(),
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: {
      reducer(state, action: PayloadAction<CartItem>) {
        const existing = state.items.find((item) => item.variantId === action.payload.variantId);

        if (existing) {
          existing.quantity += action.payload.quantity;
          return;
        }

        state.items.push(action.payload);
      },
      prepare(input: AddCartItemInput) {
        const payload = { ...input, quantity: Math.max(1, input.quantity ?? 1) } as CartItem;
        return { payload };
      },
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.variantId !== action.payload);
    },
    updateQuantity(state, action: PayloadAction<{ variantId: string; quantity: number }>) {
      const item = state.items.find((entry) => entry.variantId === action.payload.variantId);

      if (item) {
        item.quantity = Math.max(1, action.payload.quantity);
      }
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearCart } = cartSlice.actions;

export default cartSlice.reducer;

interface CartRootState {
  cart: CartState;
}

export const selectCartItems = (state: CartRootState) => state.cart.items;

export const selectCartCount = (state: CartRootState) =>
  state.cart.items.reduce((total, item) => total + item.quantity, 0);

export const selectCartSubtotal = (state: CartRootState) =>
  state.cart.items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
