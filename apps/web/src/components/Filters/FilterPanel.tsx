import { useId, useState } from 'react';
import type { ReactNode } from 'react';

import { PRODUCT_COLORS, getColorValue } from '@/data/colors';
import { SIZES } from '@/data/sizes';
import type { CatalogFilters } from '@/types/catalog';
import type { CategoryDto } from '@/types/product';

import styles from './FilterPanel.module.css';

interface FilterPanelProps {
  filters: CatalogFilters;
  categories: CategoryDto[];
  onChange: (changes: Partial<CatalogFilters>) => void;
  idPrefix?: string;
}

interface RadioOptionProps {
  id: string;
  name: string;
  checked: boolean;
  onSelect: () => void;
  children: ReactNode;
}

function RadioOption({ id, name, checked, onSelect, children }: RadioOptionProps) {
  return (
    <div className={styles.option}>
      <input
        type="radio"
        id={id}
        name={name}
        className={styles.input}
        checked={checked}
        onChange={onSelect}
      />
      <label htmlFor={id} className={styles.label}>
        {children}
      </label>
    </div>
  );
}

interface PriceFieldsProps {
  minPrice?: number;
  maxPrice?: number;
  idPrefix: string;
  onCommit: (minPrice: number | undefined, maxPrice: number | undefined) => void;
}

function PriceFields({ minPrice, maxPrice, idPrefix, onCommit }: PriceFieldsProps) {
  const fieldId = useId();
  const [min, setMin] = useState(minPrice?.toString() ?? '');
  const [max, setMax] = useState(maxPrice?.toString() ?? '');

  function commit() {
    const parsedMin = Number.parseFloat(min);
    const parsedMax = Number.parseFloat(max);
    const nextMin = Number.isFinite(parsedMin) && parsedMin >= 0 ? parsedMin : undefined;
    const nextMax = Number.isFinite(parsedMax) && parsedMax >= 0 ? parsedMax : undefined;

    if (nextMin === minPrice && nextMax === maxPrice) {
      return;
    }

    onCommit(nextMin, nextMax);
  }

  return (
    <div className={styles.priceRow}>
      <div className={styles.priceField}>
        <label htmlFor={`${idPrefix}-min-${fieldId}`} className={styles.priceLabel}>
          Min (€)
        </label>
        <input
          id={`${idPrefix}-min-${fieldId}`}
          type="number"
          inputMode="numeric"
          min={0}
          className={styles.priceInput}
          placeholder="0"
          value={min}
          onChange={(event) => setMin(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commit();
            }
          }}
        />
      </div>
      <div className={styles.priceField}>
        <label htmlFor={`${idPrefix}-max-${fieldId}`} className={styles.priceLabel}>
          Max (€)
        </label>
        <input
          id={`${idPrefix}-max-${fieldId}`}
          type="number"
          inputMode="numeric"
          min={0}
          className={styles.priceInput}
          placeholder="1000"
          value={max}
          onChange={(event) => setMax(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commit();
            }
          }}
        />
      </div>
    </div>
  );
}

export function FilterPanel({
  filters,
  categories,
  onChange,
  idPrefix = 'filter',
}: FilterPanelProps) {
  const groupId = useId();
  const categoryName = `${idPrefix}-category-${groupId}`;
  const sizeName = `${idPrefix}-size-${groupId}`;
  const colorName = `${idPrefix}-color-${groupId}`;

  return (
    <div className={styles.panel}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Category</h3>
        <div className={styles.options}>
          <RadioOption
            id={`${categoryName}-all`}
            name={categoryName}
            checked={filters.category === undefined}
            onSelect={() => onChange({ category: undefined })}
          >
            All
          </RadioOption>
          {categories.map((category) => (
            <RadioOption
              key={category.id}
              id={`${categoryName}-${category.slug}`}
              name={categoryName}
              checked={filters.category === category.slug}
              onSelect={() => onChange({ category: category.slug })}
            >
              {category.name}
            </RadioOption>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Size</h3>
        <div className={styles.options}>
          <RadioOption
            id={`${sizeName}-all`}
            name={sizeName}
            checked={filters.size === undefined}
            onSelect={() => onChange({ size: undefined })}
          >
            All
          </RadioOption>
          {SIZES.map((size) => (
            <RadioOption
              key={size}
              id={`${sizeName}-${size}`}
              name={sizeName}
              checked={filters.size === size}
              onSelect={() => onChange({ size })}
            >
              {size}
            </RadioOption>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Colour</h3>
        <div className={styles.options}>
          <RadioOption
            id={`${colorName}-all`}
            name={colorName}
            checked={filters.color === undefined}
            onSelect={() => onChange({ color: undefined })}
          >
            All
          </RadioOption>
          {PRODUCT_COLORS.map((color) => (
            <RadioOption
              key={color.name}
              id={`${colorName}-${color.name}`}
              name={colorName}
              checked={filters.color === color.name}
              onSelect={() => onChange({ color: color.name })}
            >
              <span
                className={styles.swatch}
                style={{ backgroundColor: getColorValue(color.name) }}
                aria-hidden="true"
              />
              {color.name}
            </RadioOption>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Price</h3>
        <PriceFields
          key={`${filters.minPrice ?? ''}:${filters.maxPrice ?? ''}`}
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          idPrefix={idPrefix}
          onCommit={(minPrice, maxPrice) => onChange({ minPrice, maxPrice })}
        />
      </section>
    </div>
  );
}
