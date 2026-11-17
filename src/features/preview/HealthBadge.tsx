import { ChevronDown, CircleAlert, CircleCheck, CircleX } from 'lucide-react';
import { useId, useState } from 'react';

import type { HealthLevel, HealthReport } from '@/core/qr';

import styles from './Preview.module.css';

const SUMMARY: Record<HealthLevel, string> = {
  good: 'Ready to scan',
  warn: 'Scannable, with warnings',
  bad: 'Might not scan',
};

function LevelIcon({ level, size = 16 }: { level: HealthLevel; size?: number }) {
  const Icon = level === 'good' ? CircleCheck : level === 'warn' ? CircleAlert : CircleX;
  return (
    <Icon size={size} className={styles[level]} style={{ background: 'none' }} aria-hidden="true" />
  );
}

export function HealthBadge({ report }: { report: HealthReport }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={styles.health}>
      <button
        type="button"
        className={`${styles.badge} ${styles[report.level]}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        <LevelIcon level={report.level} size={18} />
        {SUMMARY[report.level]}
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <ul id={id} className={styles.checks}>
          {report.checks.map((c) => (
            <li key={c.id} className={styles.check}>
              <LevelIcon level={c.level} />
              <span className={styles.checkTitle}>{c.title}</span>
              <span className={styles.checkDetail}>{c.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
