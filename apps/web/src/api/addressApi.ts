import type { AddressInput, AddressListResponse, AddressResponse } from '@maison-elise/shared';

import { baseApi } from './baseApi';

export const addressApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAddresses: builder.query<AddressListResponse, void>({
      query: () => '/addresses',
      providesTags: ['Addresses'],
    }),

    createAddress: builder.mutation<AddressResponse, AddressInput>({
      query: (body) => ({ url: '/addresses', method: 'POST', body }),
      invalidatesTags: ['Addresses'],
    }),

    updateAddress: builder.mutation<AddressResponse, { id: string; body: Partial<AddressInput> }>({
      query: ({ id, body }) => ({ url: `/addresses/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Addresses'],
    }),

    deleteAddress: builder.mutation<void, string>({
      query: (id) => ({ url: `/addresses/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Addresses'],
    }),

    setDefaultAddress: builder.mutation<AddressResponse, string>({
      query: (id) => ({ url: `/addresses/${id}/default`, method: 'PATCH' }),
      invalidatesTags: ['Addresses'],
    }),
  }),
});

export const {
  useGetAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
} = addressApi;
