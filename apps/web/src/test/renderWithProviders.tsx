import type { ReactElement } from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';

import '@/api/cartApi';
import { baseApi } from '@/api/baseApi';
import authReducer from '@/features/auth/authSlice';
import cartReducer from '@/features/cart/cartSlice';
import uiReducer from '@/features/ui/uiSlice';
import wishlistReducer from '@/features/wishlist/wishlistSlice';

export function createTestStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      cart: cartReducer,
      wishlist: wishlistReducer,
      ui: uiReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  });
}

export type TestStore = ReturnType<typeof createTestStore>;

interface RenderOptions {
  store?: TestStore;
  route?: string;
}

export function renderWithProviders(ui: ReactElement, options: RenderOptions = {}) {
  const store = options.store ?? createTestStore();

  const result = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[options.route ?? '/']}>{ui}</MemoryRouter>
    </Provider>,
  );

  return { store, ...result };
}
