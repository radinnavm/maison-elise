import type { CategoryDto } from '@maison-elise/shared';

import { baseApi } from './baseApi';

export interface CategoryWriteInput {
  name: string;
  slug?: string;
}

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<CategoryDto[], void>({
      query: () => '/categories',
      keepUnusedDataFor: 300,
      providesTags: ['Categories'],
    }),

    getCategoryBySlug: builder.query<CategoryDto, string>({
      query: (slug) => `/categories/${slug}`,
      keepUnusedDataFor: 300,
      providesTags: (_result, _error, slug) => [{ type: 'Category', id: slug }],
    }),

    createCategory: builder.mutation<CategoryDto, CategoryWriteInput>({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      invalidatesTags: ['Categories'],
    }),

    updateCategory: builder.mutation<
      CategoryDto,
      { id: string; body: Partial<CategoryWriteInput> }
    >({
      query: ({ id, body }) => ({ url: `/categories/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Categories'],
    }),

    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Categories'],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryBySlugQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
