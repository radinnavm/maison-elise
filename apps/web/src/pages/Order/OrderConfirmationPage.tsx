import { useParams } from 'react-router';

import { useGetOrderByIdQuery } from '@/api/ordersApi';
import { ButtonLink } from '@/components/Button/Button';
import { OrderPayment } from '@/components/OrderPayment/OrderPayment';
import { OrderSummary } from '@/components/OrderSummary/OrderSummary';
import { Seo } from '@/components/Seo/Seo';
import { ErrorState } from '@/components/StateMessage/ErrorState';
import { LoadingState } from '@/components/StateMessage/LoadingState';

import styles from './OrderConfirmationPage.module.css';

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useGetOrderByIdQuery(id ?? '', { skip: !id });
  const order = data?.data;

  return (
    <div className={`container ${styles.page}`}>
      <Seo
        title="Order Confirmation"
        description="Your Maison Élise order confirmation."
        canonicalPath="/order"
        robots="noindex"
      />
      {isLoading ? (
        <LoadingState label="Loading your order" />
      ) : isError || !order ? (
        <ErrorState
          title="We couldn't find that order."
          description="The order may have been removed, or it belongs to another account."
          action={
            <ButtonLink to="/account/orders" variant="secondary" size="md">
              View your orders
            </ButtonLink>
          }
        />
      ) : (
        <>
          <header className={styles.header}>
            <p className={styles.eyebrow}>Order {order.orderNumber}</p>
            <h1 className={styles.title}>
              {order.paymentStatus === 'PAID'
                ? 'Thank you — your payment was successful.'
                : 'Complete your payment.'}
            </h1>
            <p className={styles.lead}>
              {order.paymentStatus === 'PAID'
                ? 'Your order is confirmed and will be prepared shortly.'
                : 'Your order has been created and is awaiting payment. Complete payment below to confirm it.'}
            </p>
          </header>

          <div className={styles.panel}>
            <OrderSummary order={order} />
          </div>

          <section className={styles.paymentSection} aria-labelledby="payment-title">
            <h2 id="payment-title" className={styles.paymentTitle}>
              Payment
            </h2>
            <OrderPayment order={order} />
          </section>

          <div className={styles.actions}>
            <ButtonLink to="/account/orders" variant="primary" size="md">
              View your orders
            </ButtonLink>
            <ButtonLink to="/shop" variant="secondary" size="md">
              Continue shopping
            </ButtonLink>
          </div>
        </>
      )}
    </div>
  );
}
