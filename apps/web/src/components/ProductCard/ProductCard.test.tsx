import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ProductCard } from '@/components/ProductCard/ProductCard';
import { makeProduct } from '@/test/factories';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('ProductCard', () => {
  it('shows the product name, category and price', () => {
    renderWithProviders(<ProductCard product={makeProduct()} />);

    expect(screen.getByRole('heading', { name: 'Aurelia Satin Dress' })).toBeInTheDocument();
    expect(screen.getByText('Dresses')).toBeInTheDocument();
    expect(screen.getByText(/189/)).toBeInTheDocument();
  });

  it('toggles the wishlist state', async () => {
    renderWithProviders(<ProductCard product={makeProduct()} />);

    const button = screen.getByRole('button', { name: /wishlist/i });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(button);

    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows a sold-out badge for out-of-stock products', () => {
    renderWithProviders(<ProductCard product={makeProduct({ stock: 0, variants: [] })} />);

    expect(screen.getByText('Sold out')).toBeInTheDocument();
  });
});
