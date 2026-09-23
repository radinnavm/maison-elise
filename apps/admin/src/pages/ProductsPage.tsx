import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';

import type { AdminProductListItem, ProductStatus } from '@maison-elise/shared';

import { useGetCategoriesQuery, useGetProductsQuery } from '@/api/adminApi';
import { DataTable } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateMessage';
import {
  formatDateTime,
  formatPrice,
  formatProductStatus,
  productStatusTone,
} from '@/utils/format';

const PAGE_SIZE = 20;

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const search = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? '';
  const status = searchParams.get('status') ?? '';
  const [searchInput, setSearchInput] = useState(search);

  const { data: categories = [] } = useGetCategoriesQuery();
  const { data, isLoading, isError } = useGetProductsQuery({
    page,
    limit: PAGE_SIZE,
    ...(search ? { search } : {}),
    ...(category ? { category } : {}),
    ...(status ? { status: status as ProductStatus } : {}),
  });

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams);

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    if (key !== 'page') {
      params.delete('page');
    }

    setSearchParams(params);
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    updateParam('search', searchInput.trim());
  }

  const columns: Column<AdminProductListItem>[] = [
    {
      key: 'image',
      header: '',
      render: (product) =>
        product.image ? (
          <img
            className="table-thumb"
            src={product.image}
            alt=""
            width="40"
            height="50"
            loading="lazy"
            decoding="async"
          />
        ) : null,
    },
    {
      key: 'name',
      header: 'Product',
      render: (product) => (
        <Link className="link" to={`/products/${product.id}/edit`}>
          {product.name}
        </Link>
      ),
    },
    { key: 'category', header: 'Category', render: (product) => product.category.name },
    {
      key: 'status',
      header: 'Status',
      render: (product) => (
        <StatusBadge
          label={formatProductStatus(product.status)}
          tone={productStatusTone(product.status)}
        />
      ),
    },
    {
      key: 'basePrice',
      header: 'Price',
      align: 'right',
      render: (product) => formatPrice(product.basePrice, product.currency),
    },
    { key: 'variantCount', header: 'Variants', align: 'right', render: (p) => p.variantCount },
    { key: 'createdAt', header: 'Created', render: (p) => formatDateTime(p.createdAt) },
  ];

  return (
    <>
      <PageHeader
        title="Products"
        description="The Maison Élise catalogue."
        action={
          <Link className="btn btn-primary" to="/products/new">
            New product
          </Link>
        }
      />

      <div className="toolbar">
        <form className="field" onSubmit={handleSearch}>
          <label htmlFor="product-search">Search</label>
          <input
            id="product-search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Product name"
          />
        </form>

        <div className="field">
          <label htmlFor="product-category">Category</label>
          <select
            id="product-category"
            value={category}
            onChange={(event) => updateParam('category', event.target.value)}
          >
            <option value="">All</option>
            {categories.map((entry) => (
              <option key={entry.id} value={entry.slug}>
                {entry.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="product-status">Status</label>
          <select
            id="product-status"
            value={status}
            onChange={(event) => updateParam('status', event.target.value)}
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Loading products…" />
      ) : isError || !data ? (
        <ErrorState title="We couldn't load products." description="Please try again." />
      ) : data.data.length === 0 ? (
        <EmptyState title="No products found" description="Try adjusting the filters." />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data.data}
            rowKey={(product) => product.id}
            caption="Products"
          />
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            onChange={(next) => updateParam('page', String(next))}
          />
        </>
      )}
    </>
  );
}
