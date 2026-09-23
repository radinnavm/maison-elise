import { useParams } from 'react-router';

import { useGetOrderByIdQuery } from '@/api/ordersApi';
import { ButtonLink } from '@/components/Button/Button';
import { OrderPayment } from '@/components/OrderPayment/OrderPayment';
import { OrderSummary } from '@/components/OrderSummary/OrderSummary';
import { ErrorState } from '@/components/StateMessage/ErrorState';
import { LoadingState } from '@/components/StateMessage/LoadingState';

import styles from './Account.module.css';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useGetOrderByIdQuery(id ?? '', { skip: !id });
  const order = data?.data;

  return (
    <section aria-labelledby="order-detail-title">
      <h2 id="order-detail-title" className={styles.sectionTitle}>
        Order details
      </h2>

      {isLoading ? (
        <LoadingState label="Loading order" />
      ) : isError || !order ? (
        <ErrorState
          title="We couldn't find that order."
          description="It may have been removed, or it belongs to another account."
          action={
            <ButtonLink to="/account/orders" variant="secondary" size="md">
              Back to orders
            </ButtonLink>
          }
        />
      ) : (
        <>
          <OrderSummary order={order} />

          <div className={styles.paymentSection}>
            <h3 className={styles.paymentTitle}>Payment</h3>
            <OrderPayment order={order} />
          </div>
        </>
      )}
    </section>
  );
}
