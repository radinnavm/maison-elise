import { useParams } from 'react-router';

import { useGetCustomerQuery } from '@/api/adminApi';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { ErrorState, LoadingState } from '@/components/StateMessage';
import {
  formatDateTime,
  formatOrderStatus,
  formatPaymentStatus,
  formatPrice,
  orderStatusTone,
  paymentStatusTone,
} from '@/utils/format';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useGetCustomerQuery(id ?? '', { skip: !id });
  const customer = data?.data;

  if (isLoading) {
    return <LoadingState label="Loading customer…" />;
  }

  if (isError || !customer) {
    return <ErrorState title="We couldn't find that customer." description="It may not exist." />;
  }

  return (
    <>
      <PageHeader title={customer.name} description={customer.email} />

      <div className="stat-grid">
        <div className="stat-card">
          <h2>Role</h2>
          <p style={{ marginTop: '0.5rem' }}>
            <StatusBadge label={customer.role === 'ADMIN' ? 'Admin' : 'Customer'} />
          </p>
        </div>
        <div className="stat-card">
          <h2>Registered</h2>
          <p className="stat-meta" style={{ marginTop: '0.5rem' }}>
            {formatDateTime(customer.createdAt)}
          </p>
        </div>
        <div className="stat-card">
          <h2>Orders</h2>
          <p className="stat-value">{customer.orderCount}</p>
        </div>
        <div className="stat-card">
          <h2>Confirmed spend</h2>
          <p className="stat-value">{formatPrice(customer.confirmedSpend)}</p>
        </div>
      </div>

      <div className="section">
        <h2>Recent orders</h2>
        {customer.recentOrders.length === 0 ? (
          <p className="state">No orders yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {customer.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.orderNumber}</td>
                    <td>{formatDateTime(order.createdAt)}</td>
                    <td>
                      <StatusBadge
                        label={formatOrderStatus(order.status)}
                        tone={orderStatusTone(order.status)}
                      />
                    </td>
                    <td>
                      <StatusBadge
                        label={formatPaymentStatus(order.paymentStatus)}
                        tone={paymentStatusTone(order.paymentStatus)}
                      />
                    </td>
                    <td className="num">{formatPrice(order.total, order.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
