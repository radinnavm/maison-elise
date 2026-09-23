import { configureStore } from '@reduxjs/toolkit';

import { baseApi } from '@/api/baseApi';
import authReducer from '@/features/auth/authSlice';

import '@/api/adminApi';
import '@/api/authApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
