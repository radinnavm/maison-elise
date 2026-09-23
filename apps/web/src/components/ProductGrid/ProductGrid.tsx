import type { Product } from '@/types/product';

import { ProductCard } from '../ProductCard/ProductCard';
import styles from './ProductGrid.module.css';

interface ProductGridProps {
  products: Product[];
  priorityCount?: number;
}

export function ProductGrid({ products, priorityCount = 0 }: ProductGridProps) {
  return (
    <ul className={styles.grid}>
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} priority={index < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
