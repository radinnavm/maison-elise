import { Link, useSearchParams } from 'react-router';

import { useGetOrdersQuery } from '@/api/ordersApi';
import { ButtonLink } from '@/components/Button/Button';
import { EmptyState } from '@/components/EmptyState/EmptyState';
import { Pagination } from '@/components/Pagination/Pagination';
import { ErrorState } from '@/components/StateMessage/ErrorState';
import { LoadingState } from '@/components/StateMessage/LoadingState';
import { formatDateTime, formatOrderStatus, formatPrice } from '@/utils/format';

import styles from './Account.module.css';

const PAGE_SIZE = 10;

export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedPage = Number.parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(requestedPage) && requestedPage >= 1 ? requestedPage : 1;

  const { data, isLoading, isError } = useGetOrdersQuery({ page, limit: PAGE_SIZE });
  const orders = data?.data ?? [];
  const meta = data?.meta;

  function handlePageChange(next: number) {
    const params = new URLSearchParams(searchParams);

    if (next <= 1) {
      params.delete('page');
    } else {
      params.set('page', String(next));
    }

    setSearchParams(params);
  }

  return (
    <section aria-labelledby="orders-title">
      <h2 id="orders-title" className={styles.sectionTitle}>
        Orders
      </h2>

      {isLoading ? (
        <LoadingState label="Loading your orders" />
      ) : isError ? (
        <ErrorState
          title="We couldn't load your orders."
          description="Please check your connection and try again."
        />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="When you place an order, it will appear here."
          action={
            <ButtonLink to="/shop" variant="secondary" size="md">
              Continue shopping
            </ButtonLink>
          }
        />
      ) : (
        <ul className={styles.orderList}>
          {orders.map((order) => (
            <li key={order.id} className={styles.orderItem}>
              <Link to={`/account/orders/${order.id}`} className={styles.orderLink}>
                <span className={styles.orderNumber}>{order.orderNumber}</span>
                <span className={styles.orderDate}>{formatDateTime(order.createdAt)}</span>
                <span className={styles.orderStatus}>{formatOrderStatus(order.status)}</span>
                <span className={styles.orderCount}>
                  {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                </span>
                <span className={styles.orderTotal}>
                  {formatPrice(order.total, order.currency)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {meta ? (
        <Pagination page={meta.page} totalPages={meta.totalPages} onChange={handlePageChange} />
      ) : null}
    </section>
  );
}
