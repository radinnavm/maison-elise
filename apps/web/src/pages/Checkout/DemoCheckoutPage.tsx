import { useState } from 'react';

import { Button, ButtonLink } from '@/components/Button/Button';
import { EmptyState } from '@/components/EmptyState/EmptyState';
import { ProductImagePlaceholder } from '@/components/ProductImagePlaceholder/ProductImagePlaceholder';
import { Seo } from '@/components/Seo/Seo';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/utils/format';

import styles from './CheckoutPage.module.css';

export function DemoCheckoutPage() {
  const cart = useCart();
  const [reference] = useState(
    () => `DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  );
  const [isComplete, setIsComplete] = useState(false);

  async function handleComplete() {
    await cart.clear();
    setIsComplete(true);
  }

  if (isComplete) {
    return (
      <div className={`container ${styles.page}`}>
        <Seo
          title="Demo Checkout Complete"
          description="This was a portfolio demonstration. No order was created and no payment was taken."
          canonicalPath="/checkout"
          robots="noindex"
        />
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>Demo checkout</p>
          <h1 className={styles.title}>Thank You</h1>
        </header>
        <EmptyState
          title="Your demo order is complete."
          description={`Reference ${reference}. This was a portfolio demonstration — no payment was taken and no real order was created.`}
          action={
            <ButtonLink to="/shop" variant="primary" size="md">
              Continue browsing
            </ButtonLink>
          }
        />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className={`container ${styles.page}`}>
        <Seo
          title="Demo Checkout"
          description="Review the pieces in your Maison Élise demo bag."
          canonicalPath="/checkout"
          robots="noindex"
        />
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>Demo checkout</p>
          <h1 className={styles.title}>Review &amp; Order</h1>
        </header>
        <EmptyState
          title="Your bag is empty."
          description="Add a piece to your bag to preview the demo checkout experience."
          action={
            <ButtonLink to="/shop" variant="primary" size="md">
              Continue shopping
            </ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <div className={`container ${styles.page}`}>
      <Seo
        title="Demo Checkout"
        description="Preview the Maison Élise checkout. No payment is taken and no order is created."
        canonicalPath="/checkout"
        robots="noindex"
      />
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Demo checkout</p>
        <h1 className={styles.title}>Review &amp; Order</h1>
      </header>

      <p className={styles.demoNotice} role="note">
        This catalog is a portfolio demonstration. Checkout is a preview only — no payment details
        are collected, no Stripe request is made and no order is created.
      </p>

      <div className={styles.layout}>
        <div className={styles.column}>
          <section className={styles.section} aria-labelledby="demo-items-title">
            <h2 id="demo-items-title" className={styles.sectionTitle}>
              Order summary
            </h2>
            <ul className={styles.items}>
              {cart.items.map((line) => (
                <li key={line.variantId} className={styles.item}>
                  <div className={styles.image}>
                    <ProductImagePlaceholder name={line.name} />
                  </div>
                  <div className={styles.info}>
                    <p className={styles.meta}>
                      {line.color} / {line.size}
                    </p>
                    <h3 className={styles.name}>{line.name}</h3>
                    <p className={styles.unit}>
                      {formatPrice(line.unitPrice)} × {line.quantity}
                    </p>
                  </div>
                  <p className={styles.lineTotal}>{formatPrice(line.lineTotal)}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className={styles.summary} aria-label="Demo order totals">
          <h2 className={styles.summaryTitle}>Totals</h2>
          <dl className={styles.summaryList}>
            <div className={styles.summaryRow}>
              <dt>Items</dt>
              <dd>{cart.itemCount}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>Subtotal</dt>
              <dd>{formatPrice(cart.subtotal)}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>Shipping</dt>
              <dd>Free</dd>
            </div>
            <div className={`${styles.summaryRow} ${styles.grand}`}>
              <dt>Total</dt>
              <dd>{formatPrice(cart.subtotal)}</dd>
            </div>
          </dl>

          <p className={styles.note}>
            Reference {reference}. Completing this demo clears your bag and shows a confirmation.
            No real order or payment is created.
          </p>

          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => void handleComplete()}
          >
            Complete Demo Checkout
          </Button>
        </aside>
      </div>
    </div>
  );
}
