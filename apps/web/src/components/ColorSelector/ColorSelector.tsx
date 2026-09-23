import { useId } from 'react';

import { getColorValue } from '@/data/colors';

import styles from './ColorSelector.module.css';

interface ColorSelectorProps {
  colors: string[];
  value: string | null;
  onChange: (color: string) => void;
}

export function ColorSelector({ colors, value, onChange }: ColorSelectorProps) {
  const groupName = useId();

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Colour</legend>
      <div className={styles.options}>
        {colors.map((color) => {
          const optionId = `${groupName}-${color}`;

          return (
            <div key={color} className={styles.option}>
              <input
                type="radio"
                id={optionId}
                name={groupName}
                value={color}
                className={styles.input}
                checked={value === color}
                onChange={() => onChange(color)}
              />
              <label htmlFor={optionId} className={styles.label}>
                <span
                  className={styles.swatch}
                  style={{ backgroundColor: getColorValue(color) }}
                  aria-hidden="true"
                />
                <span className={styles.name}>{color}</span>
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
