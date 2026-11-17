import { useEffect, useId, useRef, type ReactNode } from 'react';

import { BlobBuddy } from '@/components/illustrations';
import { Button } from '@/components/ui';
import type { Tone } from '@/lib/tone';

import styles from './Dialog.module.css';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Colour of the confirm button and illustration badge. */
  tone?: Tone;
  illustration?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Themed confirmation dialog built on the native <dialog> element, so focus trapping,
 * Escape to close and the inert background come from the browser.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'coral',
  illustration = <BlobBuddy size={84} />,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => {
        // Backdrop clicks target the <dialog> itself but land outside its box.
        if (e.target !== e.currentTarget) return;
        const r = e.currentTarget.getBoundingClientRect();
        const inside =
          e.clientX >= r.left &&
          e.clientX <= r.right &&
          e.clientY >= r.top &&
          e.clientY <= r.bottom;
        if (!inside) onCancel();
      }}
    >
      <div className={styles.art} data-tone={tone} aria-hidden="true">
        {illustration}
      </div>
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {description && (
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
      )}
      <div className={styles.actions}>
        <Button size="lg" autoFocus onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button size="lg" variant="primary" tone={tone} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
