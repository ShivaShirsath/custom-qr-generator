import type { CSSProperties, ReactNode } from 'react';

import { OverflowText } from '@/components/text';

import styles from './Choice.module.css';
import { handleRadioKeys } from './radio-keys';

export interface GridOption<T extends string> {
  value: T;
  label: string;
  /** Image URL or element shown above the label. */
  preview: string | ReactNode;
}

interface OptionGridProps<T extends string> {
  label: string;
  value: T | null;
  options: ReadonlyArray<GridOption<T>>;
  onChange: (value: T) => void;
  minTileWidth?: number;
}

export function OptionGrid<T extends string>({
  label,
  value,
  options,
  onChange,
  minTileWidth = 72,
}: OptionGridProps<T>) {
  const values = options.map((o) => o.value);
  const focusable = value ?? values[0];
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={styles.grid}
      style={{ '--tile-min': `${minTileWidth}px` } as CSSProperties}
      onKeyDown={(e) => focusable && handleRadioKeys(e, values, value ?? focusable, onChange)}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          data-value={o.value}
          aria-checked={o.value === value}
          tabIndex={o.value === focusable ? 0 : -1}
          className={styles.tile}
          onClick={() => onChange(o.value)}
        >
          <span className={styles.preview} aria-hidden="true">
            {typeof o.preview === 'string' ? (
              <img src={o.preview} alt="" draggable={false} />
            ) : (
              o.preview
            )}
          </span>
          <OverflowText className={styles.tileLabel} text={o.label} />
        </button>
      ))}
    </div>
  );
}
