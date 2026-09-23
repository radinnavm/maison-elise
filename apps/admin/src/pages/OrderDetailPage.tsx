import { useState } from 'react';
import { useParams } from 'react-router';

import type { OrderStatus } from '@maison-elise/shared';

import { getErrorMessage } from '@/api/apiError';
import { useGetOrderQuery, useUpdateOrderStatusMutation } from '@/api/adminApi';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { ErrorState, LoadingState } from '@/components/StateMessage';
import {
  emailStatusTone,
  formatDateTime,
  formatEmailType,
  formatOrderStatus,
  formatPaymentStatus,
  formatPrice,
  orderStatusTone,
  paymentStatusTone,
} from '@/utils/format';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useGetOrderQuery(id ?? '', { skip: !id });
  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const order = data?.data;

  async function applyStatus(status: OrderStatus) {
    if (!order) {
      return;
    }

    setError(null);

    try {
      await updateStatus({ id: order.id, status }).unwrap();
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    } finally {
      setPendingStatus(null);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading order…" />;
  }

  if (isError || !order) {
    return <ErrorState title="We couldn't find that order." description="It may not exist." />;
  }

  const canConfirm = order.status === 'PENDING' && order.paymentStatus === 'PAID';
  const canCancel = order.status !== 'CANCELLED';

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        description={`Placed ${formatDateTime(order.createdAt)}`}
        action={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {canConfirm ? (
              <Button variant="primary" onClick={() => setPendingStatus('CONFIRMED')}>
                Confirm order
              </Button>
            ) : null}
            {canCancel ? (
              <Button variant="secondary" onClick={() => setPendingStatus('CANCELLED')}>
                Cancel order
              </Button>
            ) : null}
          </div>
        }
      />

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="stat-grid">
        <div className="stat-card">
          <h2>Customer</h2>
          <p className="stat-meta" style={{ marginTop: '0.5rem' }}>
            {order.customer.name}
            <br />
            {order.customer.email}
          </p>
        </div>
        <div className="stat-card">
          <h2>Order status</h2>
          <p style={{ marginTop: '0.5rem' }}>
            <StatusBadge
              label={formatOrderStatus(order.status)}
              tone={orderStatusTone(order.status)}
            />
          </p>
        </div>
        <div className="stat-card">
          <h2>Payment status</h2>
          <p style={{ marginTop: '0.5rem' }}>
            <StatusBadge
              label={formatPaymentStatus(order.paymentStatus)}
              tone={paymentStatusTone(order.paymentStatus)}
            />
          </p>
        </div>
        <div className="stat-card">
          <h2>Total</h2>
          <p className="stat-value">{formatPrice(order.total, order.currency)}</p>
        </div>
      </div>

      <div className="section">
        <h2>Emails</h2>
        {order.emails.length === 0 ? (
          <p className="stat-meta">No emails recorded for this order.</p>
        ) : (
          <ul>
            {order.emails.map((email) => (
              <li key={email.id} className="stat-row">
                <span>{formatEmailType(email.type)}</span>
                <StatusBadge label={email.status} tone={emailStatusTone(email.status)} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="section">
        <h2>Shipping address</h2>
        {order.shippingAddress ? (
          <p className="stat-meta" style={{ lineHeight: 1.7 }}>
            {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            <br />
            {order.shippingAddress.addressLine1}
            {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}
            <br />
            {order.shippingAddress.postalCode} {order.shippingAddress.city},{' '}
            {order.shippingAddress.countryCode}
            <br />
            {order.shippingAddress.phone}
          </p>
        ) : (
          <p className="stat-meta">No shipping address on this order.</p>
        )}
      </div>

      <div className="section">
        <h2>Items</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Variant</th>
                <th className="num">Qty</th>
                <th className="num">Unit</th>
                <th className="num">Line total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.productName}</td>
                  <td>
                    {item.color} / {item.size}
                  </td>
                  <td className="num">{item.quantity}</td>
                  <td className="num">{formatPrice(item.unitPrice, order.currency)}</td>
                  <td className="num">{formatPrice(item.lineTotal, order.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ maxWidth: '18rem', marginTop: '1rem', marginLeft: 'auto' }}>
          <div className="stat-row">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal, order.currency)}</span>
          </div>
          <div className="stat-row">
            <span>Shipping</span>
            <span>
              {order.shippingAmount > 0
                ? formatPrice(order.shippingAmount, order.currency)
                : 'Free'}
            </span>
          </div>
          <div className="stat-row">
            <span>Total</span>
            <span>{formatPrice(order.total, order.currency)}</span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={pendingStatus !== null}
        title={pendingStatus === 'CANCELLED' ? 'Cancel this order?' : 'Confirm this order?'}
        description={
          pendingStatus === 'CANCELLED'
            ? 'Cancelling restores the reserved stock for this order. This cannot be undone.'
            : 'This marks the order as confirmed for fulfilment.'
        }
        confirmLabel={pendingStatus === 'CANCELLED' ? 'Cancel order' : 'Confirm order'}
        busy={isUpdating}
        onConfirm={() => {
          if (pendingStatus) {
            void applyStatus(pendingStatus);
          }
        }}
        onCancel={() => setPendingStatus(null)}
      />
    </>
  );
}
