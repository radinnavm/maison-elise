import { describe, expect, it } from 'vitest';

import cartReducer, {
  addItem,
  clearCart,
  removeItem,
  selectCartCount,
  selectCartSubtotal,
  updateQuantity,
} from '@/features/cart/cartSlice';

const baseInput = {
  variantId: 'var-m-black',
  productId: 'prod-1',
  slug: 'aurelia-satin-dress',
  name: 'Aurelia Satin Dress',
  image: 'https://cdn.example.com/a.svg',
  size: 'M',
  color: 'Black',
  unitPrice: 189,
};

describe('cartSlice', () => {
  it('starts empty', () => {
    const state = cartReducer(undefined, { type: '@@init' });
    expect(state.items).toEqual([]);
  });

  it('adds a variant', () => {
    const state = cartReducer(undefined, addItem(baseInput));
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.quantity).toBe(1);
  });

  it('increments quantity when the same variant is added again', () => {
    let state = cartReducer(undefined, addItem(baseInput));
    state = cartReducer(state, addItem({ ...baseInput, quantity: 2 }));

    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.quantity).toBe(3);
  });

  it('keeps different variants as separate lines', () => {
    let state = cartReducer(undefined, addItem(baseInput));
    state = cartReducer(state, addItem({ ...baseInput, variantId: 'var-s-beige', size: 'S' }));

    expect(state.items).toHaveLength(2);
  });

  it('updates quantity but never below 1', () => {
    let state = cartReducer(undefined, addItem(baseInput));
    state = cartReducer(state, updateQuantity({ variantId: 'var-m-black', quantity: 5 }));
    expect(state.items[0]?.quantity).toBe(5);

    state = cartReducer(state, updateQuantity({ variantId: 'var-m-black', quantity: 0 }));
    expect(state.items[0]?.quantity).toBe(1);
  });

  it('removes an item', () => {
    let state = cartReducer(undefined, addItem(baseInput));
    state = cartReducer(state, removeItem('var-m-black'));
    expect(state.items).toHaveLength(0);
  });

  it('clears the cart', () => {
    let state = cartReducer(undefined, addItem(baseInput));
    state = cartReducer(state, clearCart());
    expect(state.items).toHaveLength(0);
  });

  it('derives count and subtotal', () => {
    const state = cartReducer(undefined, addItem({ ...baseInput, quantity: 2 }));

    expect(selectCartCount({ cart: state })).toBe(2);
    expect(selectCartSubtotal({ cart: state })).toBe(378);
  });
});
