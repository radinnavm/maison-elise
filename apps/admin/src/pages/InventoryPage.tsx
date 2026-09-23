import { useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router';

import type { AdminInventoryItem } from '@maison-elise/shared';

import { getErrorMessage } from '@/api/apiError';
import { useGetInventoryQuery, useUpdateInventoryMutation } from '@/api/adminApi';
import { Button } from '@/components/Button';
import { DataTable } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateMessage';
import { formatPrice } from '@/utils/format';

const PAGE_SIZE = 20;

export function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const search = searchParams.get('search') ?? '';
  const stock = searchParams.get('stock') ?? 'all';
  const [searchInput, setSearchInput] = useState(search);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError } = useGetInventoryQuery({
    page,
    limit: PAGE_SIZE,
    stock: stock as 'all' | 'low' | 'out',
    ...(search ? { search } : {}),
  });
  const [updateInventory, { isLoading: isSaving }] = useUpdateInventoryMutation();

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

  async function save(item: AdminInventoryItem) {
    const value = drafts[item.id];

    if (value === undefined) {
      return;
    }

    setError(null);

    try {
      await updateInventory({ variantId: item.id, stockQuantity: Number(value) }).unwrap();
      setDrafts((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    }
  }

  const columns: Column<AdminInventoryItem>[] = [
    { key: 'productName', header: 'Product', render: (item) => item.productName },
    {
      key: 'variant',
      header: 'Variant',
      render: (item) => `${item.color} / ${item.size}`,
    },
    { key: 'sku', header: 'SKU', render: (item) => item.sku },
    {
      key: 'stockQuantity',
      header: 'Stock',
      align: 'right',
      render: (item) => (
        <input
          aria-label={`Stock for ${item.productName} ${item.size} ${item.color}`}
          type="number"
          min={0}
          style={{
            width: '5rem',
            padding: '0.35rem',
            border: '1px solid var(--color-border-strong)',
          }}
          value={drafts[item.id] ?? String(item.stockQuantity)}
          onChange={(event) =>
            setDrafts((current) => ({ ...current, [item.id]: event.target.value }))
          }
        />
      ),
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      render: (item) => formatPrice(item.price),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (item) => (
        <Button
          variant="secondary"
          disabled={isSaving || drafts[item.id] === undefined}
          onClick={() => void save(item)}
        >
          Save
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Inventory" description="Variant-level stock across the catalogue." />

      <div className="toolbar">
        <form className="field" onSubmit={handleSearch}>
          <label htmlFor="inventory-search">Search</label>
          <input
            id="inventory-search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Product, SKU, size or colour"
          />
        </form>

        <div className="field">
          <label htmlFor="inventory-stock">Stock</label>
          <select
            id="inventory-stock"
            value={stock}
            onChange={(event) => updateParam('stock', event.target.value)}
          >
            <option value="all">All</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
        </div>
      </div>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <LoadingState label="Loading inventory…" />
      ) : isError || !data ? (
        <ErrorState title="We couldn't load inventory." description="Please try again." />
      ) : data.data.length === 0 ? (
        <EmptyState title="No variants found" description="Try adjusting the filters." />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data.data}
            rowKey={(item) => item.id}
            caption="Inventory"
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
