import type { ReactElement } from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';

import '@/api/adminApi';
import { baseApi } from '@/api/baseApi';
import authReducer from '@/features/auth/authSlice';

export function createTestStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  });
}

export type TestStore = ReturnType<typeof createTestStore>;

export function renderWithProviders(
  ui: ReactElement,
  options: { store?: TestStore; route?: string } = {},
) {
  const store = options.store ?? createTestStore();

  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[options.route ?? '/']}>{ui}</MemoryRouter>
      </Provider>,
    ),
  };
}
