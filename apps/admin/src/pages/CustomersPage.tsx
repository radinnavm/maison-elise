import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';

import type { AdminCustomerListItem } from '@maison-elise/shared';

import { useGetCustomersQuery } from '@/api/adminApi';
import { DataTable } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateMessage';
import { formatDateTime } from '@/utils/format';

const PAGE_SIZE = 20;

export function CustomersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const search = searchParams.get('search') ?? '';
  const [searchInput, setSearchInput] = useState(search);

  const { data, isLoading, isError } = useGetCustomersQuery({
    page,
    limit: PAGE_SIZE,
    ...(search ? { search } : {}),
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

  const columns: Column<AdminCustomerListItem>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (customer) => (
        <Link className="link" to={`/customers/${customer.id}`}>
          {customer.name}
        </Link>
      ),
    },
    { key: 'email', header: 'Email', render: (customer) => customer.email },
    {
      key: 'role',
      header: 'Role',
      render: (customer) => (
        <StatusBadge label={customer.role === 'ADMIN' ? 'Admin' : 'Customer'} />
      ),
    },
    { key: 'createdAt', header: 'Registered', render: (c) => formatDateTime(c.createdAt) },
    { key: 'orderCount', header: 'Orders', align: 'right', render: (c) => c.orderCount },
  ];

  return (
    <>
      <PageHeader title="Customers" description="Registered accounts." />

      <div className="toolbar">
        <form className="field" onSubmit={handleSearch}>
          <label htmlFor="customer-search">Search</label>
          <input
            id="customer-search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Name or email"
          />
        </form>
      </div>

      {isLoading ? (
        <LoadingState label="Loading customers…" />
      ) : isError || !data ? (
        <ErrorState title="We couldn't load customers." description="Please try again." />
      ) : data.data.length === 0 ? (
        <EmptyState title="No customers found" description="Try adjusting the search." />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data.data}
            rowKey={(customer) => customer.id}
            caption="Customers"
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
