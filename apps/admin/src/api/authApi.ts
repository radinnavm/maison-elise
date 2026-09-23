import type { AuthResponse, LoginRequest } from '@maison-elise/shared';

import { clearCredentials, setCredentials } from '@/features/auth/authSlice';

import { baseApi } from './baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data.user));
        } catch {
          // The login page surfaces the error.
        }
      },
    }),

    logout: builder.mutation<{ status: string }, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(clearCredentials());
          dispatch(baseApi.util.resetApiState());
        }
      },
    }),

    getCurrentUser: builder.query<AuthResponse, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data.user));
        } catch {
          dispatch(clearCredentials());
        }
      },
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation, useGetCurrentUserQuery } = authApi;
