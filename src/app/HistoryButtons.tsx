import { Redo2, RotateCcw, Undo2 } from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog, useToast } from '@/components/feedback';
import { Button } from '@/components/ui';
import { shortcutLabel } from '@/lib/shortcuts';
import { useConfig } from '@/state';

import styles from './App.module.css';

/** Undo, redo and reset, kept together in the header. */
export function HistoryButtons() {
  const { undo, redo, canUndo, canRedo, dispatch } = useConfig();
  const toast = useToast();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className={styles.history} role="group" aria-label="History">
      <Button
        size="sm"
        icon={<Undo2 size={16} />}
        aria-label="Undo"
        title={`Undo (${shortcutLabel('Z')})`}
        disabled={!canUndo}
        onClick={undo}
      />
      <Button
        size="sm"
        icon={<Redo2 size={16} />}
        aria-label="Redo"
        title={`Redo (${shortcutLabel('Z', true)})`}
        disabled={!canRedo}
        onClick={redo}
      />
      <Button
        size="sm"
        icon={<RotateCcw size={16} />}
        aria-label="Reset everything"
        title="Reset everything"
        onClick={() => setConfirmReset(true)}
      />
      <ConfirmDialog
        open={confirmReset}
        title="Start over?"
        description="Your content, style, colours, logo and frame go back to the defaults. You can still undo this."
        confirmLabel="Reset"
        cancelLabel="Keep editing"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false);
          dispatch({ type: 'reset' });
          toast.show({
            tone: 'success',
            title: 'Fresh start!',
            description: 'Everything is back to the defaults.',
          });
        }}
      />
    </div>
  );
}
