import type { OrderDto } from '@maison-elise/shared';

import {
  formatDateTime,
  formatOrderStatus,
  formatPaymentStatus,
  formatPrice,
} from '@/utils/format';

import styles from './OrderSummary.module.css';

interface OrderSummaryProps {
  order: OrderDto;
}

export function OrderSummary({ order }: OrderSummaryProps) {
  return (
    <div className={styles.summary}>
      <dl className={styles.meta}>
        <div className={styles.metaRow}>
          <dt>Order</dt>
          <dd>{order.orderNumber}</dd>
        </div>
        <div className={styles.metaRow}>
          <dt>Placed</dt>
          <dd>{formatDateTime(order.createdAt)}</dd>
        </div>
        <div className={styles.metaRow}>
          <dt>Status</dt>
          <dd>{formatOrderStatus(order.status)}</dd>
        </div>
        <div className={styles.metaRow}>
          <dt>Payment</dt>
          <dd>{formatPaymentStatus(order.paymentStatus)}</dd>
        </div>
        <div className={styles.metaRow}>
          <dt>Items</dt>
          <dd>{order.itemCount}</dd>
        </div>
      </dl>

      <ul className={styles.items}>
        {order.items.map((item) => (
          <li key={item.id} className={styles.item}>
            <div className={styles.itemInfo}>
              <p className={styles.itemMeta}>
                {item.color} / {item.size}
              </p>
              <p className={styles.itemName}>{item.productName}</p>
              <p className={styles.itemUnit}>
                {formatPrice(item.unitPrice, order.currency)} × {item.quantity}
              </p>
            </div>
            <p className={styles.itemTotal}>{formatPrice(item.lineTotal, order.currency)}</p>
          </li>
        ))}
      </ul>

      {order.shippingAddress ? (
        <div className={styles.shipping}>
          <h3 className={styles.shippingTitle}>Shipping address</h3>
          <p className={styles.shippingLine}>
            {order.shippingAddress.firstName} {order.shippingAddress.lastName}
          </p>
          <p className={styles.shippingLine}>
            {order.shippingAddress.addressLine1}
            {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}
          </p>
          <p className={styles.shippingLine}>
            {order.shippingAddress.postalCode} {order.shippingAddress.city},{' '}
            {order.shippingAddress.countryCode}
          </p>
          <p className={styles.shippingLine}>{order.shippingAddress.phone}</p>
        </div>
      ) : null}

      <dl className={styles.totals}>
        <div className={styles.totalRow}>
          <dt>Subtotal</dt>
          <dd>{formatPrice(order.subtotal, order.currency)}</dd>
        </div>
        <div className={styles.totalRow}>
          <dt>Shipping</dt>
          <dd>
            {order.shippingAmount > 0 ? formatPrice(order.shippingAmount, order.currency) : 'Free'}
          </dd>
        </div>
        <div className={`${styles.totalRow} ${styles.grand}`}>
          <dt>Total</dt>
          <dd>{formatPrice(order.total, order.currency)}</dd>
        </div>
      </dl>
    </div>
  );
}
