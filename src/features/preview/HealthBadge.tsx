import { ChevronDown, CircleAlert } from 'lucide-react';
import { useId, useState } from 'react';

import { BlobBuddy, StarBuddy } from '@/components/illustrations';
import type { HealthLevel, HealthReport } from '@/core/qr';
import type { Tone } from '@/lib/tone';

import styles from './Preview.module.css';

const SUMMARY: Record<HealthLevel, string> = {
  good: 'Ready to scan!',
  warn: 'Scannable, with warnings',
  bad: 'Might not scan',
};

const TONE: Record<HealthLevel, Tone> = { good: 'mint', warn: 'butter', bad: 'coral' };

export function HealthBadge({ report }: { report: HealthReport }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={styles.health}>
      <button
        type="button"
        data-tone={TONE[report.level]}
        className={styles.badge}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.badgeIcon}>
          {report.level === 'good' ? (
            <StarBuddy size={38} />
          ) : report.level === 'bad' ? (
            <BlobBuddy size={38} />
          ) : (
            <CircleAlert size={24} aria-hidden="true" />
          )}
        </span>
        {SUMMARY[report.level]}
        <ChevronDown size={18} aria-hidden="true" />
      </button>
      {open && (
        <ul id={id} className={styles.checks}>
          {report.checks.map((c) => (
            <li key={c.id} className={styles.check}>
              <span className={styles.dot} data-level={c.level} aria-label={c.level} />
              <span className={styles.checkTitle}>{c.title}</span>
              <span className={styles.checkDetail}>{c.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
