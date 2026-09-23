import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { OrderDto } from '@maison-elise/shared';

import { normalizeApiError } from '@/api/apiError';
import { ordersApi, useCreatePaymentIntentMutation } from '@/api/ordersApi';
import { useAppDispatch } from '@/app/hooks';
import { Button } from '@/components/Button/Button';
import { isStripeConfigured, stripePromise } from '@/lib/stripe';

import styles from './OrderPayment.module.css';

interface OrderPaymentProps {
  order: OrderDto;
}

export function OrderPayment({ order }: OrderPaymentProps) {
  const [createPaymentIntent, { isLoading }] = useCreatePaymentIntentMutation();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const payable = order.status !== 'CANCELLED' && order.paymentStatus !== 'PAID';

  useEffect(() => {
    if (!payable || !isStripeConfigured) {
      return;
    }

    let active = true;

    createPaymentIntent(order.id)
      .unwrap()
      .then((result) => {
        if (active && result.data.clientSecret) {
          setClientSecret(result.data.clientSecret);
        }
      })
      .catch((intentError) => {
        if (active) {
          setError(normalizeApiError(intentError).message);
        }
      });

    return () => {
      active = false;
    };
  }, [order.id, payable, createPaymentIntent]);

  if (order.paymentStatus === 'PAID') {
    return <p className={styles.paid}>Payment successful. Your order is confirmed.</p>;
  }

  if (order.status === 'CANCELLED') {
    return <p className={styles.error}>This order has been cancelled and can no longer be paid.</p>;
  }

  if (!isStripeConfigured) {
    return <p className={styles.note}>Payments are not configured in this environment.</p>;
  }

  return (
    <div className={styles.payment}>
      {order.paymentStatus === 'FAILED' ? (
        <p className={styles.error} role="alert">
          Your payment could not be completed. You can try again below.
        </p>
      ) : null}
      {order.paymentStatus === 'CANCELLED' ? (
        <p className={styles.note}>
          Your previous payment was cancelled. Start a new payment below.
        </p>
      ) : null}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {isLoading || !clientSecret || !stripePromise ? (
        <p className={styles.note}>Preparing secure payment…</p>
      ) : (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              variables: {
                colorPrimary: '#2c2420',
                fontFamily: 'Inter, system-ui, sans-serif',
                borderRadius: '2px',
              },
            },
          }}
        >
          <PaymentForm orderId={order.id} />
        </Elements>
      )}
    </div>
  );
}

interface PaymentFormProps {
  orderId: string;
}

function PaymentForm({ orderId }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!stripe || !elements || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const { error: submitError } = await elements.submit();

    if (submitError) {
      setMessage(submitError.message ?? 'Payment could not be submitted.');
      setIsSubmitting(false);
      return;
    }

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/order/${orderId}` },
      redirect: 'if_required',
    });

    if (result.error) {
      setMessage(result.error.message ?? 'Payment could not be completed.');
      setIsSubmitting(false);
      dispatch(ordersApi.util.invalidateTags([{ type: 'Order', id: orderId }]));
      return;
    }

    // Payment submitted; the backend webhook is the source of truth for confirmation.
    setMessage('Your payment is being confirmed.');
    setIsSubmitting(false);
    dispatch(ordersApi.util.invalidateTags([{ type: 'Order', id: orderId }]));
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <PaymentElement />

      {message ? (
        <p className={styles.status} role="status">
          {message}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        disabled={!stripe || isSubmitting}
      >
        {isSubmitting ? 'Processing…' : 'Pay now'}
      </Button>

      <p className={styles.note}>
        Payments are processed securely by Stripe. Your card details never reach Maison Élise.
      </p>
    </form>
  );
}
