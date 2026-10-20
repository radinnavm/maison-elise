import { Link } from 'react-router';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { HeartIcon } from '@/components/icons/Icons';
import { IconButton } from '@/components/IconButton/IconButton';
import { ProductImagePlaceholder } from '@/components/ProductImagePlaceholder/ProductImagePlaceholder';
import { selectIsWishlisted, toggleWishlist } from '@/features/wishlist/wishlistSlice';
import type { Product } from '@/types/product';
import { formatPrice } from '@/utils/format';
import { isInStock, isOnSale } from '@/utils/product';

import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const isWishlisted = useAppSelector((state) => selectIsWishlisted(state, product.id));
  const inStock = isInStock(product);
  const onSale = isOnSale(product);
  const tag = product.isNew ? 'New In' : undefined;

  function handleWishlistToggle() {
    dispatch(
      toggleWishlist({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
      }),
    );
  }

  return (
    <article className={styles.card} data-priority={priority ? 'true' : undefined}>
      <div className={[styles.media, inStock ? '' : styles.mediaSoldOut].filter(Boolean).join(' ')}>
        <Link
          to={`/product/${product.slug}`}
          className={styles.imageLink}
          aria-label={`View ${product.name}`}
        >
          <ProductImagePlaceholder name={product.name} />
        </Link>

        <div className={styles.badges}>
          {tag ? <span className={styles.badgeTag}>{tag}</span> : null}
          {onSale ? <span className={styles.badgeSale}>Sale</span> : null}
          {!inStock ? <span className={styles.badgeSoldOut}>Sold out</span> : null}
        </div>

        <IconButton
          label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          className={styles.wishlist}
          aria-pressed={isWishlisted}
          onClick={handleWishlistToggle}
        >
          <HeartIcon className={isWishlisted ? styles.heartActive : undefined} />
        </IconButton>
      </div>

      <div className={styles.info}>
        <p className={styles.category}>{product.category.name}</p>
        <h3 className={styles.name}>
          <Link to={`/product/${product.slug}`} className={styles.nameLink}>
            {product.name}
          </Link>
        </h3>
        <p className={styles.price}>
          {onSale && product.compareAtPrice !== undefined ? (
            <span className={styles.comparePrice}>
              {formatPrice(product.compareAtPrice, product.currency)}
            </span>
          ) : null}
          <span className={onSale ? styles.salePrice : undefined}>
            {formatPrice(product.price, product.currency)}
          </span>
        </p>
      </div>
    </article>
  );
}
