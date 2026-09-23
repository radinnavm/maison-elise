import { useId } from 'react';

import { ChevronDownIcon } from '@/components/icons/Icons';
import type { SortOption } from '@/types/catalog';
import { isSortOption, sortOptionEntries } from '@/utils/catalog';

import styles from './SortSelect.module.css';

interface SortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function SortSelect({ value, onChange }: SortSelectProps) {
  const selectId = useId();
  const options = sortOptionEntries();

  return (
    <div className={styles.wrap}>
      <label htmlFor={selectId} className={styles.label}>
        Sort
      </label>
      <div className={styles.selectWrap}>
        <select
          id={selectId}
          className={styles.select}
          value={value}
          onChange={(event) => {
            const next = event.target.value;
            if (isSortOption(next)) {
              onChange(next);
            }
          }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className={styles.icon} />
      </div>
    </div>
  );
}
