import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';

import type { AdminOrderDto, OrderStatus, PaymentStatus } from '@maison-elise/shared';

import { useGetOrdersQuery } from '@/api/adminApi';
import { DataTable } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateMessage';
import {
  formatDateTime,
  formatOrderStatus,
  formatPaymentStatus,
  formatPrice,
  orderStatusTone,
  paymentStatusTone,
} from '@/utils/format';

const PAGE_SIZE = 20;

export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const paymentStatus = searchParams.get('paymentStatus') ?? '';
  const [searchInput, setSearchInput] = useState(search);

  const { data, isLoading, isError } = useGetOrdersQuery({
    page,
    limit: PAGE_SIZE,
    ...(search ? { search } : {}),
    ...(status ? { status: status as OrderStatus } : {}),
    ...(paymentStatus ? { paymentStatus: paymentStatus as PaymentStatus } : {}),
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

  const columns: Column<AdminOrderDto>[] = [
    {
      key: 'orderNumber',
      header: 'Order',
      render: (order) => (
        <Link className="link" to={`/orders/${order.id}`}>
          {order.orderNumber}
        </Link>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (order) => (
        <>
          {order.customer.name}
          <br />
          <span style={{ color: 'var(--color-text-muted)' }}>{order.customer.email}</span>
        </>
      ),
    },
    { key: 'createdAt', header: 'Date', render: (order) => formatDateTime(order.createdAt) },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (order) => formatPrice(order.total, order.currency),
    },
    {
      key: 'status',
      header: 'Status',
      render: (order) => (
        <StatusBadge label={formatOrderStatus(order.status)} tone={orderStatusTone(order.status)} />
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (order) => (
        <StatusBadge
          label={formatPaymentStatus(order.paymentStatus)}
          tone={paymentStatusTone(order.paymentStatus)}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Orders" description="All customer orders." />

      <div className="toolbar">
        <form className="field" onSubmit={handleSearch}>
          <label htmlFor="order-search">Search</label>
          <input
            id="order-search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Order #, name or email"
          />
        </form>

        <div className="field">
          <label htmlFor="order-status">Order status</label>
          <select
            id="order-status"
            value={status}
            onChange={(event) => updateParam('status', event.target.value)}
          >
            <option value="">All</option>
            <option value="PENDING">Awaiting payment</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="order-payment">Payment status</label>
          <select
            id="order-payment"
            value={paymentStatus}
            onChange={(event) => updateParam('paymentStatus', event.target.value)}
          >
            <option value="">All</option>
            <option value="UNPAID">Not paid</option>
            <option value="PROCESSING">Processing</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Loading orders…" />
      ) : isError || !data ? (
        <ErrorState title="We couldn't load orders." description="Please try again." />
      ) : data.data.length === 0 ? (
        <EmptyState title="No orders found" description="Try adjusting the filters." />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data.data}
            rowKey={(order) => order.id}
            caption="Orders"
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
