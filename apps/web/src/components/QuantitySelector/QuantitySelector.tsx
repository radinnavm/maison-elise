import { MinusIcon, PlusIcon } from '@/components/icons/Icons';

import styles from './QuantitySelector.module.css';

interface QuantitySelectorProps {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
}

export function QuantitySelector({ value, min = 1, max, onChange }: QuantitySelectorProps) {
  const upperBound = Math.max(min, max);
  const clamp = (next: number) => Math.min(Math.max(next, min), upperBound);

  return (
    <div className={styles.selector} role="group" aria-label="Quantity">
      <button
        type="button"
        className={styles.button}
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <MinusIcon />
      </button>
      <span className={styles.value} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={styles.button}
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= upperBound}
        aria-label="Increase quantity"
      >
        <PlusIcon />
      </button>
    </div>
  );
}
