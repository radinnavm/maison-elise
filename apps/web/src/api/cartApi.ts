import type {
  AddCartItemRequest,
  CartResponse,
  MergeCartRequest,
  UpdateCartItemRequest,
} from '@maison-elise/shared';

import { baseApi } from './baseApi';

export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query<CartResponse, void>({
      query: () => '/cart',
      providesTags: ['Cart'],
    }),

    addCartItem: builder.mutation<CartResponse, AddCartItemRequest>({
      query: (body) => ({ url: '/cart/items', method: 'POST', body }),
      invalidatesTags: ['Cart'],
    }),

    updateCartItem: builder.mutation<CartResponse, { itemId: string; body: UpdateCartItemRequest }>(
      {
        query: ({ itemId, body }) => ({ url: `/cart/items/${itemId}`, method: 'PATCH', body }),
        invalidatesTags: ['Cart'],
      },
    ),

    removeCartItem: builder.mutation<CartResponse, string>({
      query: (itemId) => ({ url: `/cart/items/${itemId}`, method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),

    clearCart: builder.mutation<CartResponse, void>({
      query: () => ({ url: '/cart', method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),

    mergeCart: builder.mutation<CartResponse, MergeCartRequest>({
      query: (body) => ({ url: '/cart/merge', method: 'POST', body }),
      invalidatesTags: ['Cart'],
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddCartItemMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  useMergeCartMutation,
} = cartApi;
