import type { ProductDto, ProductListResponse, ProductStatus } from '@maison-elise/shared';

import type { ProductQueryParams } from '@/types/catalog';

import { baseApi } from './baseApi';

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
  variants?: { sku: string; size: string; color: string; stockQuantity?: number; price?: number }[];
}

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<ProductListResponse, ProductQueryParams>({
      query: (params) => ({ url: '/products', params }),
      // Catalogue browsing is read-only and changes rarely; keep it cached longer
      // to avoid refetching when navigating between shop and product pages.
      keepUnusedDataFor: 300,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((product) => ({ type: 'Product' as const, id: product.id })),
              { type: 'Products' as const },
            ]
          : [{ type: 'Products' as const }],
    }),

    getProductBySlug: builder.query<ProductDto, string>({
      query: (slug) => `/products/${slug}`,
      keepUnusedDataFor: 300,
      providesTags: (_result, _error, slug) => [{ type: 'Product', id: slug }],
    }),

    createProduct: builder.mutation<ProductDto, ProductWriteInput>({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      invalidatesTags: [{ type: 'Products' }],
    }),

    updateProduct: builder.mutation<ProductDto, { id: string; body: Partial<ProductWriteInput> }>({
      query: ({ id, body }) => ({ url: `/products/${id}`, method: 'PATCH', body }),
      invalidatesTags: [{ type: 'Products' }],
    }),

    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Products' }],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductBySlugQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi;
