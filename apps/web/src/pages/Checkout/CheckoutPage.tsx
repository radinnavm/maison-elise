import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import type { AddressDto } from '@maison-elise/shared';

import { normalizeApiError } from '@/api/apiError';
import { useGetAddressesQuery } from '@/api/addressApi';
import { useCreateOrderMutation } from '@/api/ordersApi';
import { useAppSelector } from '@/app/hooks';
import { AddressForm } from '@/components/AddressForm/AddressForm';
import { Button, ButtonLink } from '@/components/Button/Button';
import { EmptyState } from '@/components/EmptyState/EmptyState';
import { ProductImagePlaceholder } from '@/components/ProductImagePlaceholder/ProductImagePlaceholder';
import { Seo } from '@/components/Seo/Seo';
import { LoadingState } from '@/components/StateMessage/LoadingState';
import { env } from '@/config/env';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/utils/format';

import { DemoCheckoutPage } from './DemoCheckoutPage';
import styles from './CheckoutPage.module.css';

const ORDER_ERROR_MESSAGES: Record<string, string> = {
  CART_EMPTY: 'Your bag is empty. Add an item before placing an order.',
  ADDRESS_NOT_FOUND: 'The selected shipping address is no longer available. Please choose another.',
  INSUFFICIENT_STOCK: 'One or more items are no longer available in the requested quantity.',
  PRODUCT_UNAVAILABLE: 'One or more items are no longer available.',
  VARIANT_NOT_FOUND: 'One of the selected options is no longer available.',
};

const REFRESH_CART_CODES = ['INSUFFICIENT_STOCK', 'PRODUCT_UNAVAILABLE', 'VARIANT_NOT_FOUND'];

export function CheckoutPage() {
  if (env.demoCatalog) {
    return <DemoCheckoutPage />;
  }

  return <LiveCheckoutPage />;
}

function LiveCheckoutPage() {
  const cart = useCart();
  const user = useAppSelector(selectCurrentUser);
  const navigate = useNavigate();
  const [createOrder, { isLoading }] = useCreateOrderMutation();
  const { data: addressData, isLoading: isLoadingAddresses } = useGetAddressesQuery();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const addresses = addressData?.data ?? [];
  const defaultAddressId =
    addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id ?? null;
  const effectiveAddressId = selectedAddressId ?? defaultAddressId;
  const busy = isLoading || isSubmitting;

  function handleAddressCreated(address: AddressDto) {
    setSelectedAddressId(address.id);
    setShowAddressForm(false);
  }

  async function handlePlaceOrder() {
    if (submittingRef.current) {
      return;
    }

    if (!effectiveAddressId) {
      setError('Please add a shipping address before placing your order.');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createOrder({ addressId: effectiveAddressId }).unwrap();
      navigate(`/order/${result.data.id}`, { replace: true });
    } catch (submitError) {
      const info = normalizeApiError(submitError);

      if (info.code && REFRESH_CART_CODES.includes(info.code)) {
        cart.refetch();
      }

      setError((info.code ? ORDER_ERROR_MESSAGES[info.code] : undefined) ?? info.message);
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div className={`container ${styles.page}`}>
      <Seo
        title="Checkout"
        description="Complete your Maison Élise order."
        canonicalPath="/checkout"
        robots="noindex"
      />
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Checkout</p>
        <h1 className={styles.title}>Review &amp; Order</h1>
      </header>

      {cart.isLoading ? (
        <LoadingState label="Loading your bag" />
      ) : cart.items.length === 0 ? (
        <EmptyState
          title="Your bag is empty."
          description="There are no items to purchase yet. Add a piece to your bag before checking out."
          action={
            <ButtonLink to="/shop" variant="primary" size="md">
              Continue shopping
            </ButtonLink>
          }
        />
      ) : (
        <div className={styles.layout}>
          <div className={styles.column}>
            <section className={styles.section} aria-labelledby="shipping-title">
              <h2 id="shipping-title" className={styles.sectionTitle}>
                Shipping information
              </h2>

              {isLoadingAddresses ? (
                <LoadingState label="Loading your addresses" />
              ) : addresses.length === 0 || showAddressForm ? (
                <AddressForm
                  onCreated={handleAddressCreated}
                  {...(addresses.length > 0 ? { onCancel: () => setShowAddressForm(false) } : {})}
                />
              ) : (
                <>
                  <ul className={styles.addressList}>
                    {addresses.map((address) => (
                      <li key={address.id}>
                        <label className={styles.addressCard}>
                          <input
                            type="radio"
                            name="shippingAddress"
                            value={address.id}
                            checked={effectiveAddressId === address.id}
                            onChange={() => setSelectedAddressId(address.id)}
                          />
                          <span>
                            <span className={styles.addressName}>
                              {address.firstName} {address.lastName}
                              {address.isDefault ? (
                                <span className={styles.defaultBadge}>Default</span>
                              ) : null}
                            </span>
                            <span className={styles.addressLine}>
                              {address.addressLine1}
                              {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                            </span>
                            <span className={styles.addressLine}>
                              {address.postalCode} {address.city}, {address.countryCode}
                            </span>
                            <span className={styles.addressLine}>{address.phone}</span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className={styles.addAddress}
                    onClick={() => setShowAddressForm(true)}
                  >
                    Add a new address
                  </Button>
                </>
              )}
            </section>

            <section className={styles.section} aria-labelledby="items-title">
              <h2 id="items-title" className={styles.sectionTitle}>
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

          <aside className={styles.summary} aria-label="Order totals" aria-busy={busy}>
            <h2 className={styles.summaryTitle}>Totals</h2>

            {user ? (
              <p className={styles.customer}>
                {user.name}
                <br />
                {user.email}
              </p>
            ) : null}

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

            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}

            <p className={styles.note}>
              This creates your order. You will complete payment securely with Stripe on the next
              step — your order is not paid until then.
            </p>

            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              disabled={busy || !effectiveAddressId}
              onClick={() => void handlePlaceOrder()}
            >
              {busy ? 'Creating Order…' : 'Create Order'}
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
