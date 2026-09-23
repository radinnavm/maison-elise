import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { addItem } from '@/features/cart/cartSlice';
import { CartPage } from '@/pages/Cart/CartPage';
import { createTestStore, renderWithProviders } from '@/test/renderWithProviders';

describe('CartPage', () => {
  it('shows an empty state for a guest with no items', () => {
    renderWithProviders(<CartPage />);

    expect(screen.getByText(/your bag is empty/i)).toBeInTheDocument();
  });

  it('renders guest cart items and the checkout action', () => {
    const store = createTestStore();
    store.dispatch(
      addItem({
        variantId: 'var-m-black',
        productId: 'prod-1',
        slug: 'aurelia-satin-dress',
        name: 'Aurelia Satin Dress',
        image: 'https://cdn.example.com/a.svg',
        size: 'M',
        color: 'Black',
        unitPrice: 189,
        quantity: 2,
      }),
    );

    renderWithProviders(<CartPage />, { store });

    expect(screen.getByRole('heading', { name: 'Aurelia Satin Dress' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /proceed to checkout/i })).toBeInTheDocument();
    expect(screen.getAllByText('€378').length).toBeGreaterThan(0);
  });
});
