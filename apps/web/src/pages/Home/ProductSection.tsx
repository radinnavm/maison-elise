import { ButtonLink } from '@/components/Button/Button';
import type { Product } from '@/types/product';
import { ProductGrid } from '@/components/ProductGrid/ProductGrid';
import { SectionHeading } from '@/components/SectionHeading/SectionHeading';

import styles from './ProductSection.module.css';

interface ProductSectionProps {
  eyebrow?: string;
  title: string;
  products: Product[];
  viewAllTo: string;
  viewAllLabel?: string;
  priorityCount?: number;
}

export function ProductSection({
  eyebrow,
  title,
  products,
  viewAllTo,
  viewAllLabel = 'View all',
  priorityCount = 0,
}: ProductSectionProps) {
  return (
    <section className={styles.section} aria-label={title}>
      <div className="container">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          action={
            <ButtonLink to={viewAllTo} variant="ghost" size="sm">
              {viewAllLabel}
            </ButtonLink>
          }
        />
        <ProductGrid products={products} priorityCount={priorityCount} />
      </div>
    </section>
  );
}
