import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/config/env', () => ({
  env: {
    apiUrl: '/api/v1',
    isDevelopment: true,
    siteUrl: 'http://localhost:5175',
    allowIndexing: true,
    demoCatalog: true,
  },
}));

import { renderWithProviders } from '@/test/renderWithProviders';

import { ShopPage } from './ShopPage';

function renderShop(path: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/shop/:category" element={<ShopPage />} />
    </Routes>,
    { route: path },
  );
}

describe('ShopPage demo categories', () => {
  it('recognises the women category and lists women products', () => {
    renderShop('/shop/women');

    expect(screen.getByRole('heading', { level: 1, name: 'Women' })).toBeInTheDocument();
    expect(screen.getByText('30 pieces')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view juliette mini dress/i })).toHaveAttribute(
      'href',
      '/product/juliette-mini-dress',
    );
  });

  it('recognises the men category and lists men products', () => {
    renderShop('/shop/men');

    expect(screen.getByRole('heading', { level: 1, name: 'Men' })).toBeInTheDocument();
    expect(screen.getByText('30 pieces')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view henri oxford shirt/i })).toHaveAttribute(
      'href',
      '/product/henri-oxford-shirt',
    );
  });
});
