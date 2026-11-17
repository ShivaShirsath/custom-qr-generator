import type { ReactNode } from 'react';

import styles from './Section.module.css';

interface SectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function Section({ title, description, action, children }: SectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.heading}>
          <h3 className={styles.title}>{title}</h3>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Places sections side by side when the editor is wide enough. */
export function Columns({ children }: { children: ReactNode }) {
  return <div className={styles.columns}>{children}</div>;
}

/** Responsive row that wraps fields onto new lines on narrow screens. */
export function FieldRow({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}
