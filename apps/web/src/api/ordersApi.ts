import type { OrderListResponse, OrderResponse, PaymentIntentResponse } from '@maison-elise/shared';

import { baseApi } from './baseApi';

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation<OrderResponse, { addressId: string }>({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: ['Cart', 'Orders'],
    }),

    getOrders: builder.query<OrderListResponse, { page?: number; limit?: number } | void>({
      query: (params) => ({ url: '/orders', params: params ?? undefined }),
      providesTags: ['Orders'],
    }),

    getOrderById: builder.query<OrderResponse, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Order', id }],
    }),

    createPaymentIntent: builder.mutation<PaymentIntentResponse, string>({
      query: (orderId) => ({ url: `/orders/${orderId}/payment`, method: 'POST' }),
      invalidatesTags: (_result, _error, orderId) => [{ type: 'Order', id: orderId }],
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreatePaymentIntentMutation,
} = ordersApi;
