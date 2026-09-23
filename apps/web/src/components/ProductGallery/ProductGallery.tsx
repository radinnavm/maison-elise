import { useState } from 'react';

import type { ProductImageDto } from '@/types/product';

import styles from './ProductGallery.module.css';

interface ProductGalleryProps {
  images: ProductImageDto[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  if (!activeImage) {
    return null;
  }

  return (
    <div className={styles.gallery}>
      <div className={styles.thumbs} role="group" aria-label={`${productName} images`}>
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            className={[styles.thumb, index === activeIndex ? styles.thumbActive : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => setActiveIndex(index)}
            aria-label={`View image ${index + 1} of ${images.length}`}
            aria-current={index === activeIndex}
          >
            <img src={image.url} alt="" width="200" height="250" loading="lazy" decoding="async" />
          </button>
        ))}
      </div>

      <div className={styles.main}>
        <img
          src={activeImage.url}
          alt={activeImage.alt || `${productName} — view ${activeIndex + 1}`}
          width="800"
          height="1000"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </div>
    </div>
  );
}
