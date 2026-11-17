import { useId, useState } from 'react';

import { isHexColor } from '@/core/qr';

import { Field } from './Field';
import styles from './Field.module.css';

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

/** Native colour picker paired with an editable hex input. */
export function ColorField({ label, value, onChange }: ColorFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);

  // Keep the text box in sync when the colour changes elsewhere (picker, presets).
  if (synced !== value) {
    setSynced(value);
    setDraft(value);
  }

  const commit = (next: string) => {
    const normalized = next.startsWith('#') ? next : `#${next}`;
    if (isHexColor(normalized)) onChange(normalized.toLowerCase());
    else setDraft(value);
  };

  return (
    <Field label={label} htmlFor={id}>
      <div className={styles.color}>
        <span className={styles.swatch} style={{ background: value }}>
          <input
            type="color"
            aria-label={`${label} picker`}
            value={value.length === 7 ? value : value.slice(0, 7)}
            onChange={(e) => onChange(e.target.value)}
          />
        </span>
        <input
          id={id}
          className={styles.hex}
          value={draft}
          spellCheck={false}
          maxLength={9}
          onChange={(e) => {
            setDraft(e.target.value);
            const normalized = e.target.value.startsWith('#')
              ? e.target.value
              : `#${e.target.value}`;
            if (/^#[0-9a-f]{6}$/i.test(normalized)) onChange(normalized.toLowerCase());
          }}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commit(e.currentTarget.value)}
        />
      </div>
    </Field>
  );
}
