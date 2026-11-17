import { useId } from 'react';

import styles from './Field.module.css';

interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export function Switch({ label, description, checked, disabled, onChange }: SwitchProps) {
  const id = useId();
  return (
    <div className={styles.switchRow}>
      <div className={styles.switchText}>
        <span className={styles.label} id={id}>
          {label}
        </span>
        {description && <span className={styles.hint}>{description}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        disabled={disabled}
        className={styles.switch}
        onClick={() => onChange(!checked)}
      />
    </div>
  );
}
