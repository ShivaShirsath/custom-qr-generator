import { useEffect } from 'react';

import { useExportActions } from '@/features/export/useExportActions';
import { isMod } from '@/lib/shortcuts';
import { useConfig } from '@/state';

/** ⌘/Ctrl+Z undo, ⇧⌘Z or Ctrl+Y redo, ⌘/Ctrl+S download. */
export function useShortcuts(): void {
  const { undo, redo } = useConfig();
  const { download } = useExportActions();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isMod(e) || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (key === 'y' && !e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (key === 's' && !e.shiftKey) {
        e.preventDefault();
        void download();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, download]);
}
