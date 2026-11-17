import type { ReactNode } from 'react';

import { panelId, tabId } from './tab-ids';
import styles from './Tabs.module.css';
import { handleRadioKeys } from './radio-keys';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: ReactNode;
}

interface TabsProps<T extends string> {
  label: string;
  idPrefix: string;
  tabs: ReadonlyArray<TabItem<T>>;
  active: T;
  onChange: (id: T) => void;
}

export function Tabs<T extends string>({ label, idPrefix, tabs, active, onChange }: TabsProps<T>) {
  const ids = tabs.map((t) => t.id);
  return (
    <div
      role="tablist"
      aria-label={label}
      className={styles.list}
      onKeyDown={(e) => handleRadioKeys(e, ids, active, onChange)}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          id={tabId(idPrefix, t.id)}
          data-value={t.id}
          aria-selected={t.id === active}
          aria-controls={panelId(idPrefix, t.id)}
          tabIndex={t.id === active ? 0 : -1}
          className={styles.tab}
          onClick={() => onChange(t.id)}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}
