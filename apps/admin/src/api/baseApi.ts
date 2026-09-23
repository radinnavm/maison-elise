import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { env } from '@/config/env';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: env.apiUrl,
    credentials: 'include',
  }),
  tagTypes: [
    'Dashboard',
    'Order',
    'Orders',
    'Product',
    'Products',
    'Inventory',
    'Category',
    'Categories',
    'Customer',
    'Customers',
    'User',
  ],
  endpoints: () => ({}),
});
