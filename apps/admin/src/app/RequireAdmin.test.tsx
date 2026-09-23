import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';

import { RequireAdmin } from '@/app/RequireAdmin';
import { clearCredentials, setCredentials } from '@/features/auth/authSlice';
import { createTestStore, renderWithProviders } from '@/test/renderWithProviders';

function renderRoute(store: ReturnType<typeof createTestStore>) {
  return renderWithProviders(
    <Routes>
      <Route element={<RequireAdmin />}>
        <Route path="/orders" element={<div>Admin orders</div>} />
      </Route>
      <Route path="/login" element={<div>Login page</div>} />
    </Routes>,
    { store, route: '/orders' },
  );
}

describe('RequireAdmin', () => {
  it('redirects a guest to login', () => {
    const store = createTestStore();
    store.dispatch(clearCredentials());

    renderRoute(store);

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Admin orders')).not.toBeInTheDocument();
  });

  it('allows an admin through', () => {
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 'admin-1',
        firstName: 'Elise',
        lastName: 'Moreau',
        name: 'Elise Moreau',
        email: 'admin@example.com',
        role: 'ADMIN',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    );

    renderRoute(store);

    expect(screen.getByText('Admin orders')).toBeInTheDocument();
  });
});
