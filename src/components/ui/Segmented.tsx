import type { ReactNode } from 'react';

import { cx } from '@/lib/cx';

import styles from './Choice.module.css';
import { handleRadioKeys } from './radio-keys';

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  title?: string;
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<SegmentOption<T>>;
  onChange: (value: T) => void;
  className?: string;
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: SegmentedProps<T>) {
  const enabled = options.filter((o) => !o.disabled).map((o) => o.value);
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx(styles.segmented, className)}
      onKeyDown={(e) => handleRadioKeys(e, enabled, value, onChange)}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          data-value={o.value}
          aria-checked={o.value === value}
          tabIndex={o.value === value ? 0 : -1}
          disabled={o.disabled}
          title={o.title}
          className={styles.segment}
          onClick={() => onChange(o.value)}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
