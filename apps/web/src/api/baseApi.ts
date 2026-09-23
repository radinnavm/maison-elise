import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { env } from '@/config/env';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: env.apiUrl,
    credentials: 'include',
  }),
  tagTypes: [
    'Product',
    'Products',
    'Category',
    'Categories',
    'User',
    'Cart',
    'Order',
    'Orders',
    'Addresses',
  ],
  endpoints: () => ({}),
});
