import { useState } from 'react';
import { Link } from 'react-router';

import { getErrorMessage } from '@/api/apiError';
import { Button, ButtonLink } from '@/components/Button/Button';
import { EmptyState } from '@/components/EmptyState/EmptyState';
import { QuantitySelector } from '@/components/QuantitySelector/QuantitySelector';
import { Seo } from '@/components/Seo/Seo';
import { ErrorState } from '@/components/StateMessage/ErrorState';
import { LoadingState } from '@/components/StateMessage/LoadingState';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/utils/format';

import styles from './CartPage.module.css';

export function CartPage() {
  const cart = useCart();
  const [mutationError, setMutationError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    try {
      setMutationError(null);
      await action();
    } catch (error) {
      setMutationError(getErrorMessage(error));
    }
  }

  return (
    <div className={`container ${styles.page}`}>
      <Seo
        title="Shopping Bag"
        description="Review the pieces in your Maison Élise shopping bag."
        canonicalPath="/cart"
        robots="noindex"
      />
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Your selection</p>
        <h1 className={styles.title}>Shopping Bag</h1>
      </header>

      {cart.isLoading ? (
        <LoadingState label="Loading your bag" />
      ) : cart.error && cart.items.length === 0 ? (
        <ErrorState
          title="We couldn't load your bag."
          description="Please check your connection and try again."
          action={
            <ButtonLink to="/shop" variant="secondary" size="md">
              Continue shopping
            </ButtonLink>
          }
        />
      ) : cart.items.length === 0 ? (
        <EmptyState
          title="Your bag is empty."
          description="Discover considered silhouettes and timeless pieces to begin your selection."
          action={
            <ButtonLink to="/shop" variant="primary" size="md">
              Continue shopping
            </ButtonLink>
          }
        />
      ) : (
        <div className={styles.layout}>
          <ul className={styles.items}>
            {cart.items.map((line) => (
              <li key={line.variantId} className={styles.item}>
                <Link
                  to={`/product/${line.slug}`}
                  className={styles.imageLink}
                  aria-label={`View ${line.name}`}
                >
                  <img
                    className={styles.image}
                    src={line.image}
                    alt={line.name}
                    width="160"
                    height="200"
                    loading="lazy"
                    decoding="async"
                  />
                </Link>

                <div className={styles.info}>
                  <p className={styles.meta}>
                    {line.color} / {line.size}
                  </p>
                  <h2 className={styles.name}>
                    <Link to={`/product/${line.slug}`} className={styles.nameLink}>
                      {line.name}
                    </Link>
                  </h2>
                  <p className={styles.unitPrice}>{formatPrice(line.unitPrice)}</p>

                  <div className={styles.controls}>
                    <QuantitySelector
                      value={line.quantity}
                      max={Math.max(1, line.stockQuantity)}
                      onChange={(quantity) =>
                        void run(() => cart.updateQuantity(line.variantId, quantity))
                      }
                    />
                    <button
                      type="button"
                      className={styles.remove}
                      onClick={() => void run(() => cart.removeItem(line.variantId))}
                      disabled={cart.isMutating}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <p className={styles.lineTotal}>{formatPrice(line.lineTotal)}</p>
              </li>
            ))}
          </ul>

          <aside className={styles.summary} aria-label="Order summary">
            <h2 className={styles.summaryTitle}>Summary</h2>

            <dl className={styles.summaryList}>
              <div className={styles.summaryRow}>
                <dt>Items</dt>
                <dd>{cart.itemCount}</dd>
              </div>
              <div className={styles.summaryRow}>
                <dt>Subtotal</dt>
                <dd>{formatPrice(cart.subtotal)}</dd>
              </div>
            </dl>

            {mutationError ? (
              <p className={styles.error} role="alert">
                {mutationError}
              </p>
            ) : null}

            <p className={styles.note}>Shipping and checkout arrive in a later milestone.</p>

            <div className={styles.summaryActions}>
              <ButtonLink to="/checkout" variant="primary" size="md" fullWidth>
                Proceed to Checkout
              </ButtonLink>
              <Button
                type="button"
                variant="secondary"
                size="md"
                fullWidth
                disabled={cart.isMutating}
                onClick={() => void run(() => cart.clear())}
              >
                {cart.isMutating ? 'Updating…' : 'Clear bag'}
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
