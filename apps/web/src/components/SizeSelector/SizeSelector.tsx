import { useId } from 'react';
import type { ReactNode } from 'react';

import styles from './SizeSelector.module.css';

interface SizeSelectorProps {
  sizes: string[];
  unavailableSizes?: string[];
  value: string | null;
  onChange: (size: string) => void;
  action?: ReactNode;
}

export function SizeSelector({
  sizes,
  unavailableSizes = [],
  value,
  onChange,
  action,
}: SizeSelectorProps) {
  const groupName = useId();
  const labelId = `${groupName}-label`;

  return (
    <div className={styles.group} role="radiogroup" aria-labelledby={labelId}>
      <div className={styles.header}>
        <span id={labelId} className={styles.legend}>
          Size
        </span>
        {action ? <div className={styles.action}>{action}</div> : null}
      </div>
      <div className={styles.options}>
        {sizes.map((size) => {
          const unavailable = unavailableSizes.includes(size);
          const optionId = `${groupName}-${size}`;

          return (
            <div key={size} className={styles.option}>
              <input
                type="radio"
                id={optionId}
                name={groupName}
                value={size}
                className={styles.input}
                checked={value === size}
                disabled={unavailable}
                onChange={() => onChange(size)}
              />
              <label htmlFor={optionId} className={styles.label}>
                {size}
                {unavailable ? <span className="visually-hidden"> (unavailable)</span> : null}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
