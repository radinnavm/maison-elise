import type { AuthResponse, LoginRequest, RegisterRequest } from '@maison-elise/shared';

import { cartApi } from '@/api/cartApi';
import { env } from '@/config/env';
import { clearCredentials, setCredentials } from '@/features/auth/authSlice';
import { clearCart, selectCartItems, type CartState } from '@/features/cart/cartSlice';

import { baseApi } from './baseApi';

interface GuestCartLine {
  variantId: string;
  quantity: number;
}

async function mergeGuestCart(
  guestItems: GuestCartLine[],
  merge: (items: GuestCartLine[]) => { unwrap: () => Promise<unknown> },
  clearGuest: () => void,
): Promise<void> {
  if (env.demoCatalog || guestItems.length === 0) {
    return;
  }

  try {
    await merge(guestItems).unwrap();
    clearGuest();
  } catch {
    // Keep the guest cart intact if the merge fails.
  }
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, getState, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data.user));

          const guestItems = selectCartItems(getState() as unknown as { cart: CartState });
          await mergeGuestCart(
            guestItems.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
            (items) => dispatch(cartApi.endpoints.mergeCart.initiate({ items })),
            () => dispatch(clearCart()),
          );
        } catch {
          // The component surfaces the error from the mutation result.
        }
      },
    }),

    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, getState, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data.user));

          const guestItems = selectCartItems(getState() as unknown as { cart: CartState });
          await mergeGuestCart(
            guestItems.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
            (items) => dispatch(cartApi.endpoints.mergeCart.initiate({ items })),
            () => dispatch(clearCart()),
          );
        } catch {
          // The component surfaces the error from the mutation result.
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
          // Clear all cached server data so the previous user's cart can never be shown.
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

export const { useLoginMutation, useRegisterMutation, useLogoutMutation, useGetCurrentUserQuery } =
  authApi;
