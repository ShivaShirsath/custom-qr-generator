import { Info, TriangleAlert, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { BlobBuddy, StarBuddy } from '@/components/illustrations';
import { cx } from '@/lib/cx';
import type { Tone } from '@/lib/tone';

import styles from './Toast.module.css';
import { ToastContext, type ToastApi, type ToastOptions, type ToastTone } from './toast-context';

interface ToastItem extends Required<Omit<ToastOptions, 'description'>> {
  id: number;
  description?: string;
  leaving: boolean;
}

const TONE: Record<ToastTone, Tone> = {
  success: 'mint',
  error: 'coral',
  info: 'sky',
  warning: 'butter',
};

const MAX_TOASTS = 3;
const EXIT_MS = 200;

function ToastIcon({ tone }: { tone: ToastTone }) {
  if (tone === 'success') return <StarBuddy size={34} />;
  if (tone === 'error') return <BlobBuddy size={36} />;
  if (tone === 'warning') return <TriangleAlert size={22} aria-hidden="true" />;
  return <Info size={22} aria-hidden="true" />;
}

/** Renders themed toasts in a polite live region at the bottom of the screen. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const dismiss = useCallback(
    (id: number) => {
      window.clearTimeout(timers.current.get(id));
      timers.current.delete(id);
      setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      window.setTimeout(() => remove(id), EXIT_MS);
    },
    [remove],
  );

  const show = useCallback(
    ({ tone = 'info', title, description, duration }: ToastOptions) => {
      const id = nextId.current++;
      const ms = duration ?? (tone === 'error' ? 6000 : 3500);
      setToasts((list) =>
        [...list, { id, tone, title, description, duration: ms, leaving: false }].slice(
          -MAX_TOASTS,
        ),
      );
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), ms),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  const api = useMemo<ToastApi>(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ol className={styles.viewport} aria-live="polite" aria-label="Notifications">
        {toasts.map((t) => (
          <li
            key={t.id}
            data-tone={TONE[t.tone]}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={cx(styles.toast, t.leaving && styles.leaving)}
          >
            <span className={styles.icon}>
              <ToastIcon tone={t.tone} />
            </span>
            <span className={styles.text}>
              <span className={styles.title}>{t.title}</span>
              {t.description && <span className={styles.description}>{t.description}</span>}
            </span>
            <button
              type="button"
              className={styles.close}
              aria-label="Dismiss notification"
              onClick={() => dismiss(t.id)}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
    </ToastContext.Provider>
  );
}
