import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';

import { getErrorMessage, normalizeApiError } from '@/api/apiError';
import { useGetProductBySlugQuery, useGetProductsQuery } from '@/api/productsApi';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs';
import { Button, ButtonLink } from '@/components/Button/Button';
import { ColorSelector } from '@/components/ColorSelector/ColorSelector';
import { EmptyState } from '@/components/EmptyState/EmptyState';
import { HeartIcon } from '@/components/icons/Icons';
import { ProductGallery } from '@/components/ProductGallery/ProductGallery';
import { ProductGrid } from '@/components/ProductGrid/ProductGrid';
import { QuantitySelector } from '@/components/QuantitySelector/QuantitySelector';
import { Seo } from '@/components/Seo/Seo';
import { buildProductJsonLd, truncate } from '@/components/Seo/metadata';
import { SizeSelector } from '@/components/SizeSelector/SizeSelector';
import { ErrorState } from '@/components/StateMessage/ErrorState';
import { LoadingState } from '@/components/StateMessage/LoadingState';
import { env } from '@/config/env';
import { selectIsWishlisted, toggleWishlist } from '@/features/wishlist/wishlistSlice';
import { useCart } from '@/hooks/useCart';
import type { Product } from '@/types/product';
import { formatPrice } from '@/utils/format';
import { getPrimaryImage, isInStock, isOnSale } from '@/utils/product';

import styles from './ProductPage.module.css';

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>();

  return <ProductDetailLoader key={slug ?? 'not-found'} slug={slug} />;
}

interface ProductDetailLoaderProps {
  slug?: string;
}

function ProductDetailLoader({ slug }: ProductDetailLoaderProps) {
  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useGetProductBySlugQuery(slug ?? '', {
    skip: !slug,
  });

  if (!slug) {
    return <ProductNotFound />;
  }

  if (isLoading) {
    return (
      <div className={`container ${styles.page}`}>
        <LoadingState label="Loading product" />
      </div>
    );
  }

  if (isError || !product) {
    if (error && normalizeApiError(error).status === 404) {
      return <ProductNotFound />;
    }

    return (
      <div className={`container ${styles.page}`}>
        <Seo
          title="Product unavailable"
          description="This piece could not be loaded."
          canonicalPath="/shop"
          robots="noindex"
        />
        <ErrorState
          title="We couldn't load this piece."
          description="Please check your connection and try again."
          action={
            <ButtonLink to="/shop" variant="secondary" size="md">
              Back to shop
            </ButtonLink>
          }
        />
      </div>
    );
  }

  return <ProductDetailView key={product.id} product={product} />;
}

function ProductNotFound() {
  return (
    <div className={`container ${styles.page}`}>
      <Seo
        title="Product not found"
        description="The product you are looking for may have sold out or been removed from the collection."
        canonicalPath="/shop"
        robots="noindex"
      />
      <Breadcrumbs
        items={[{ label: 'Home', to: '/' }, { label: 'Shop', to: '/shop' }, { label: 'Not found' }]}
      />
      <EmptyState
        title="We couldn't find that piece."
        description="The product you are looking for may have sold out or been removed from the collection."
        action={
          <ButtonLink to="/shop" variant="primary" size="md">
            Continue shopping
          </ButtonLink>
        }
      />
    </div>
  );
}

interface ProductDetailViewProps {
  product: Product;
}

function ProductDetailView({ product }: ProductDetailViewProps) {
  const dispatch = useAppDispatch();
  const cart = useCart();
  const isWishlisted = useAppSelector((state) => selectIsWishlisted(state, product.id));

  const [selectedColor, setSelectedColor] = useState<string | null>(
    () => product.colors[0] ?? null,
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(() =>
    product.sizes.length === 1 ? (product.sizes[0] ?? null) : null,
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const { data: relatedData } = useGetProductsQuery({
    category: product.category.slug,
    sort: 'featured',
    page: 1,
    limit: 5,
  });

  const hasVariants = product.variants.length > 0;
  const onSale = isOnSale(product);
  const requiresSize = product.sizes.length > 0;

  const selectedVariant =
    product.variants.find(
      (variant) => variant.size === selectedSize && variant.color === selectedColor,
    ) ?? null;

  const variantInStock = selectedVariant !== null && selectedVariant.stockQuantity > 0;
  const maxQuantity = selectedVariant ? Math.max(1, selectedVariant.stockQuantity) : 1;
  const effectiveQuantity = Math.min(quantity, maxQuantity);

  const unavailableSizes = selectedColor
    ? product.sizes.filter(
        (size) =>
          !product.variants.some(
            (variant) =>
              variant.size === size && variant.color === selectedColor && variant.stockQuantity > 0,
          ),
      )
    : [];

  const related = (relatedData?.data ?? [])
    .filter((candidate) => candidate.id !== product.id)
    .slice(0, 4);

  const stockLabel = selectedVariant
    ? selectedVariant.stockQuantity > 0
      ? selectedVariant.stockQuantity <= 3
        ? `Only ${selectedVariant.stockQuantity} left`
        : 'In stock'
      : 'Out of stock'
    : isInStock(product)
      ? 'In stock'
      : 'Out of stock';

  const buttonLabel = !hasVariants
    ? 'Unavailable'
    : !selectedVariant
      ? 'Select options'
      : !variantInStock
        ? 'Out of stock'
        : isAdded
          ? 'Added to Bag'
          : 'Add to Bag';

  const canAdd = hasVariants && variantInStock && !cart.isMutating;

  async function handleAddToBag() {
    if (!selectedVariant) {
      setAddError('Please select an available size and colour.');
      return;
    }

    if (selectedVariant.stockQuantity <= 0) {
      setAddError('This option is out of stock.');
      return;
    }

    try {
      await cart.addItem({
        variantId: selectedVariant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: getPrimaryImage(product),
        size: selectedVariant.size,
        color: selectedVariant.color,
        unitPrice: selectedVariant.price,
        quantity: effectiveQuantity,
      });

      setAddError(null);
      setIsAdded(true);

      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => setIsAdded(false), 2500);
    } catch (error) {
      setAddError(getErrorMessage(error));
    }
  }

  function handleWishlistToggle() {
    dispatch(
      toggleWishlist({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: getPrimaryImage(product),
        price: product.price,
      }),
    );
  }

  const reference = selectedVariant?.sku ?? product.variants[0]?.sku;

  return (
    <div className={`container ${styles.page}`}>
      <Seo
        title={product.name}
        description={truncate(product.description)}
        canonicalPath={`/product/${product.slug}`}
        ogType="product"
        ogImage={product.images[0]?.url}
        jsonLd={buildProductJsonLd(product, env.siteUrl)}
      />
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: product.category.name, to: `/shop/${product.category.slug}` },
          { label: product.name },
        ]}
      />

      <div className={styles.layout}>
        <div className={styles.galleryColumn}>
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        <div className={styles.infoColumn}>
          <p className={styles.category}>{product.category.name}</p>
          <h1 className={styles.title}>{product.name}</h1>

          <p className={styles.price}>
            {onSale && product.compareAtPrice !== undefined ? (
              <span className={styles.comparePrice}>
                {formatPrice(product.compareAtPrice, product.currency)}
              </span>
            ) : null}
            <span className={onSale ? styles.salePrice : undefined}>
              {formatPrice(product.price, product.currency)}
            </span>
            {onSale ? <span className={styles.saleTag}>Sale</span> : null}
          </p>

          <p className={styles.description}>{product.description}</p>

          <p className={styles.stock}>{stockLabel}</p>

          {product.colors.length > 0 ? (
            <div className={styles.field}>
              <ColorSelector
                colors={product.colors}
                value={selectedColor}
                onChange={(color) => {
                  setSelectedColor(color);
                  setQuantity(1);
                  setAddError(null);
                }}
              />
            </div>
          ) : null}

          {requiresSize ? (
            <div className={styles.field}>
              <SizeSelector
                sizes={product.sizes}
                unavailableSizes={unavailableSizes}
                value={selectedSize}
                onChange={(size) => {
                  setSelectedSize(size);
                  setQuantity(1);
                  setAddError(null);
                }}
                action={
                  <button
                    type="button"
                    className={styles.sizeGuide}
                    onClick={() => setShowSizeGuide((current) => !current)}
                    aria-expanded={showSizeGuide}
                  >
                    Size guide
                  </button>
                }
              />
              {showSizeGuide ? (
                <p className={styles.sizeGuidePanel}>
                  Our size guide is coming soon. For now, Maison Élise pieces run true to size.
                </p>
              ) : null}
            </div>
          ) : null}

          {variantInStock ? (
            <div className={styles.field}>
              <QuantitySelector
                value={effectiveQuantity}
                max={maxQuantity}
                onChange={setQuantity}
              />
            </div>
          ) : null}

          <div className={styles.actions}>
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              disabled={!canAdd}
              onClick={handleAddToBag}
            >
              {buttonLabel}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className={styles.wishlistButton}
              aria-pressed={isWishlisted}
              onClick={handleWishlistToggle}
            >
              <HeartIcon className={isWishlisted ? styles.heartActive : undefined} />
              <span className="visually-hidden">
                {isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              </span>
            </Button>
          </div>

          {addError ? (
            <p className={styles.error} role="alert">
              {addError}
            </p>
          ) : null}

          <p className={styles.feedback} role="status" aria-live="polite">
            {isAdded ? `${product.name} added to your bag.` : ''}
          </p>

          <section className={styles.details} aria-labelledby="product-details">
            <h2 id="product-details" className={styles.detailsTitle}>
              Details
            </h2>
            <ul className={styles.composition}>
              <li>Category: {product.category.name}</li>
              <li>Available sizes: {product.sizes.join(', ') || 'One size'}</li>
              <li>Colours: {product.colors.join(', ') || '—'}</li>
              {reference ? <li>Reference: {reference}</li> : null}
            </ul>
          </section>
        </div>
      </div>

      {related.length > 0 ? (
        <section className={styles.related} aria-labelledby="related-title">
          <h2 id="related-title" className={styles.relatedTitle}>
            You may also like
          </h2>
          <ProductGrid products={related} />
        </section>
      ) : null}
    </div>
  );
}
