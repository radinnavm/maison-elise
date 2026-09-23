import type {
  AdminCustomerDetailDto,
  AdminCustomerListResponse,
  AdminDashboardResponse,
  AdminInventoryItem,
  AdminInventoryListResponse,
  AdminOrderDetailDto,
  AdminOrderListResponse,
  AdminProductListResponse,
  CategoryDto,
  OrderDto,
  OrderResponse,
  OrderStatus,
  PaymentStatus,
  ProductDto,
  ProductStatus,
} from '@maison-elise/shared';

import { baseApi } from './baseApi';

export interface AdminOrderQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
}

export interface AdminProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: ProductStatus;
  sort?: 'newest' | 'name_asc' | 'price_asc' | 'price_desc';
}

export interface AdminInventoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  stock?: 'all' | 'low' | 'out';
}

export interface AdminCustomerQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ProductWriteInput {
  name: string;
  slug?: string;
  description: string;
  categoryId: string;
  basePrice: number;
  currency?: string;
  status?: ProductStatus;
  isNew?: boolean;
  isFeatured?: boolean;
  images?: { url: string; alt?: string; sortOrder?: number }[];
  variants?: {
    sku: string;
    size: string;
    color: string;
    stockQuantity?: number;
    price?: number;
  }[];
}

export interface CategoryWriteInput {
  name: string;
  slug?: string;
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<AdminDashboardResponse, void>({
      query: () => '/admin/dashboard',
      providesTags: ['Dashboard'],
    }),

    getOrders: builder.query<AdminOrderListResponse, AdminOrderQuery>({
      query: (params) => ({ url: '/admin/orders', params }),
      providesTags: ['Orders'],
    }),

    getOrder: builder.query<{ data: AdminOrderDetailDto }, string>({
      query: (id) => `/admin/orders/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Order', id }],
    }),

    updateOrderStatus: builder.mutation<OrderResponse, { id: string; status: OrderStatus }>({
      query: ({ id, status }) => ({
        url: `/admin/orders/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => ['Orders', 'Dashboard', { type: 'Order', id }],
    }),

    getProducts: builder.query<AdminProductListResponse, AdminProductQuery>({
      query: (params) => ({ url: '/admin/products', params }),
      providesTags: ['Products'],
    }),

    getProduct: builder.query<{ data: ProductDto }, string>({
      query: (id) => `/admin/products/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Product', id }],
    }),

    createProduct: builder.mutation<{ data: ProductDto }, ProductWriteInput>({
      query: (body) => ({ url: '/admin/products', method: 'POST', body }),
      invalidatesTags: ['Products', 'Dashboard'],
    }),

    updateProduct: builder.mutation<{ data: ProductDto }, { id: string; body: ProductWriteInput }>({
      query: ({ id, body }) => ({ url: `/admin/products/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => [
        'Products',
        'Inventory',
        'Dashboard',
        { type: 'Product', id },
      ],
    }),

    getInventory: builder.query<AdminInventoryListResponse, AdminInventoryQuery>({
      query: (params) => ({ url: '/admin/inventory', params }),
      providesTags: ['Inventory'],
    }),

    updateInventory: builder.mutation<
      { data: AdminInventoryItem },
      { variantId: string; stockQuantity: number }
    >({
      query: ({ variantId, stockQuantity }) => ({
        url: `/admin/inventory/${variantId}`,
        method: 'PATCH',
        body: { stockQuantity },
      }),
      invalidatesTags: ['Inventory', 'Products', 'Dashboard'],
    }),

    getCategories: builder.query<CategoryDto[], void>({
      query: () => '/admin/categories',
      providesTags: ['Categories'],
    }),

    createCategory: builder.mutation<{ data: CategoryDto }, CategoryWriteInput>({
      query: (body) => ({ url: '/admin/categories', method: 'POST', body }),
      invalidatesTags: ['Categories'],
    }),

    updateCategory: builder.mutation<
      { data: CategoryDto },
      { id: string; body: Partial<CategoryWriteInput> }
    >({
      query: ({ id, body }) => ({ url: `/admin/categories/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Categories'],
    }),

    getCustomers: builder.query<AdminCustomerListResponse, AdminCustomerQuery>({
      query: (params) => ({ url: '/admin/customers', params }),
      providesTags: ['Customers'],
    }),

    getCustomer: builder.query<{ data: AdminCustomerDetailDto }, string>({
      query: (id) => `/admin/customers/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Customer', id }],
    }),
  }),
});

export const {
  useGetDashboardQuery,
  useGetOrdersQuery,
  useGetOrderQuery,
  useUpdateOrderStatusMutation,
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetInventoryQuery,
  useUpdateInventoryMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useGetCustomersQuery,
  useGetCustomerQuery,
} = adminApi;

export type { OrderDto };
